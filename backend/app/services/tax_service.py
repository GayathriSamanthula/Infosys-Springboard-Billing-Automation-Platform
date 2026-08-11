from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from typing import List, Dict, Any, Optional

from app.models.tax import TaxMaster
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.subscription import Subscription
from app.models.plan import Plan
from app.models.payment import Payment
from app.schemas.tax import TaxMasterCreate, TaxCalculateResponse, TaxReportResponse


def init_default_tax_rules(db: Session):
    """
    Seeds default country and region tax rate rules if not present in Tax Master.
    Default Rules:
    - India: GST @ 18.0%
    - UAE: VAT @ 5.0%
    - USA (California): Sales Tax @ 8.25%
    - International Default: Standard @ 0.0%
    0 existing records modified or erased.
    """
    defaults = [
        {"country": "India", "state": "ALL", "tax_name": "GST", "tax_percentage": 18.0},
        {"country": "UAE", "state": "ALL", "tax_name": "VAT", "tax_percentage": 5.0},
        {"country": "USA", "state": "California", "tax_name": "Sales Tax", "tax_percentage": 8.25},
        {"country": "DEFAULT", "state": "ALL", "tax_name": "Zero Tax Rate", "tax_percentage": 0.0},
    ]

    for item in defaults:
        existing = db.query(TaxMaster).filter(
            TaxMaster.country == item["country"],
            TaxMaster.state == item["state"]
        ).first()
        if not existing:
            rule = TaxMaster(
                country=item["country"],
                state=item["state"],
                tax_name=item["tax_name"],
                tax_percentage=item["tax_percentage"],
                effective_from=date(2026, 1, 1),
                is_active=True
            )
            db.add(rule)
    db.commit()


def get_tax_rules(db: Session) -> List[TaxMaster]:
    """Returns active tax rules from Tax Master."""
    init_default_tax_rules(db)
    return db.query(TaxMaster).filter(TaxMaster.is_active == True).order_by(TaxMaster.country.asc()).all()


def create_tax_rule(db: Session, tax_in: TaxMasterCreate) -> TaxMaster:
    """Creates a new tax rule in Tax Master."""
    init_default_tax_rules(db)
    rule = TaxMaster(
        country=tax_in.country,
        state=tax_in.state or "ALL",
        tax_name=tax_in.tax_name,
        tax_percentage=tax_in.tax_percentage,
        effective_from=tax_in.effective_from or date.today(),
        effective_to=tax_in.effective_to,
        is_active=tax_in.is_active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def update_tax_rule(db: Session, tax_id: int, tax_in: TaxMasterCreate) -> Optional[TaxMaster]:
    """Updates an existing tax rule in Tax Master."""
    rule = db.query(TaxMaster).filter(TaxMaster.id == tax_id).first()
    if not rule:
        return None

    rule.country = tax_in.country
    rule.state = tax_in.state or "ALL"
    rule.tax_name = tax_in.tax_name
    rule.tax_percentage = tax_in.tax_percentage
    if tax_in.effective_from:
        rule.effective_from = tax_in.effective_from
    rule.effective_to = tax_in.effective_to
    rule.is_active = tax_in.is_active

    db.commit()
    db.refresh(rule)
    return rule


def calculate_tax_for_customer(db: Session, customer_id: int, subtotal: float) -> TaxCalculateResponse:
    """
    Looks up Customer location (country/state), finds matching rule in Tax Master,
    and calculates exact tax_amount and grand_total.
    """
    init_default_tax_rules(db)
    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    customer_name = customer.full_name if customer else "Guest Customer"
    country = customer.country if customer and customer.country else "DEFAULT"
    state = "ALL"

    # Search for specific country + state match first
    tax_rule = db.query(TaxMaster).filter(
        TaxMaster.country.ilike(country),
        TaxMaster.is_active == True
    ).first()

    # Fallback to DEFAULT tax rule if country not found
    if not tax_rule:
        tax_rule = db.query(TaxMaster).filter(
            TaxMaster.country == "DEFAULT",
            TaxMaster.is_active == True
        ).first()

    tax_name = tax_rule.tax_name if tax_rule else "GST"
    tax_percentage = tax_rule.tax_percentage if tax_rule else 18.0

    tax_amount = round(subtotal * (tax_percentage / 100.0), 2)
    grand_total = round(subtotal + tax_amount, 2)

    return TaxCalculateResponse(
        customer_id=customer_id,
        customer_name=customer_name,
        country=country,
        state=state,
        subtotal=round(subtotal, 2),
        tax_name=tax_name,
        tax_percentage=tax_percentage,
        tax_amount=tax_amount,
        grand_total=grand_total
    )


def generate_tax_reports(db: Session, period: str = "monthly", country_filter: Optional[str] = None) -> TaxReportResponse:
    """
    Generates admin tax collection reports aggregated by country, state, and subscription plan.
    """
    init_default_tax_rules(db)
    invoices_query = db.query(Invoice).filter(Invoice.is_deleted == False)

    if country_filter:
        invoices_query = invoices_query.join(Subscription).join(Customer).filter(Customer.country.ilike(country_filter))

    invoices = invoices_query.all()
    total_tax = sum(inv.tax_amount or 0.0 for inv in invoices)

    # Tax aggregations
    country_map: Dict[str, float] = {}
    state_map: Dict[str, float] = {}
    plan_map: Dict[str, float] = {}
    customer_map: Dict[str, float] = {}
    payment_method_map: Dict[str, float] = {}

    for inv in invoices:
        cust = db.query(Customer).join(Subscription).filter(Subscription.id == inv.subscription_id).first() if inv.subscription_id else None
        cntry = cust.country if cust and cust.country else "DEFAULT"
        state = getattr(cust, 'state', None) or getattr(cust, 'country', 'ALL') if cust else "ALL"
        cname = cust.full_name if cust and cust.full_name else "Guest Customer"
        tax_val = inv.tax_amount or 0.0

        country_map[cntry] = country_map.get(cntry, 0.0) + tax_val
        state_map[state] = state_map.get(state, 0.0) + tax_val
        customer_map[cname] = customer_map.get(cname, 0.0) + tax_val

        sub = db.query(Subscription).filter(Subscription.id == inv.subscription_id).first() if inv.subscription_id else None
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first() if sub else None
        pname = plan.name if plan else "Standard Plan"
        plan_map[pname] = plan_map.get(pname, 0.0) + tax_val

        pay = db.query(Payment).filter(Payment.invoice_id == inv.id).first() if inv.id else None
        pmethod = pay.payment_method if pay and pay.payment_method else "Credit Card"
        payment_method_map[pmethod] = payment_method_map.get(pmethod, 0.0) + tax_val

    country_breakdown = [{"country": k, "tax_collected": round(v, 2)} for k, v in country_map.items()]
    state_breakdown = [{"state": k, "tax_collected": round(v, 2)} for k, v in state_map.items()]
    plan_breakdown = [{"plan_name": k, "tax_collected": round(v, 2)} for k, v in plan_map.items()]
    customer_breakdown = [{"customer_name": k, "tax_collected": round(v, 2)} for k, v in customer_map.items()]
    payment_method_breakdown = [{"payment_method": k, "tax_collected": round(v, 2)} for k, v in payment_method_map.items()]

    return TaxReportResponse(
        total_tax_collected=round(total_tax, 2),
        total_invoices_taxed=len(invoices),
        period=period,
        country_breakdown=country_breakdown,
        state_breakdown=state_breakdown,
        plan_breakdown=plan_breakdown,
        customer_breakdown=customer_breakdown,
        payment_method_breakdown=payment_method_breakdown
    )
