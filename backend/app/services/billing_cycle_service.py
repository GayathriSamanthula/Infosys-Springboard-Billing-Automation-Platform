from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.models.billing_cycle import BillingCycle
from app.schemas.billing_cycle import BillingCycleCreate
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.plan import Plan
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.services.invoice_service import generate_itemized_invoice


def _enrich_billing_cycle(db: Session, cycle: BillingCycle):
    if not cycle:
        return None
    sub = db.query(Subscription).filter(Subscription.id == cycle.subscription_id).first()
    if sub:
        cust = db.query(Customer).filter(Customer.id == sub.customer_id).first()
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        if cust:
            cycle.customer_name = cust.full_name
            cycle.customer_email = cust.email
        if plan:
            cycle.plan_name = plan.name
    return cycle


def create_billing_cycle(db: Session, billing_cycle: BillingCycleCreate):
    db_billing_cycle = BillingCycle(**billing_cycle.model_dump())
    db.add(db_billing_cycle)
    db.commit()
    db.refresh(db_billing_cycle)
    return _enrich_billing_cycle(db, db_billing_cycle)


def get_all_billing_cycles(db: Session):
    cycles = db.query(BillingCycle).order_by(BillingCycle.id.desc()).all()
    seen_keys = set()
    unique_cycles = []
    for c in cycles:
        key = (c.subscription_id, c.billing_start_date)
        if key not in seen_keys:
            seen_keys.add(key)
            unique_cycles.append(c)
    return [_enrich_billing_cycle(db, c) for c in unique_cycles]


def get_billing_cycle(db: Session, billing_cycle_id: int):
    cycle = (
        db.query(BillingCycle)
        .filter(BillingCycle.id == billing_cycle_id)
        .first()
    )
    return _enrich_billing_cycle(db, cycle)


def delete_billing_cycle(db: Session, billing_cycle_id: int):
    billing_cycle = (
        db.query(BillingCycle)
        .filter(BillingCycle.id == billing_cycle_id)
        .first()
    )

    if billing_cycle:
        db.delete(billing_cycle)
        db.commit()

    return billing_cycle


def generate_due_invoices(db: Session):
    today = date.today()

    processed_subscriptions = 0
    generated_invoices = 0

    active_subscriptions = (
        db.query(Subscription)
        .filter(
            Subscription.is_deleted == False,
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL])
        )
        .all()
    )

    for subscription in active_subscriptions:
        processed_subscriptions += 1

        plan = (
            db.query(Plan)
            .filter(
                Plan.id == subscription.plan_id
            )
            .first()
        )

        if not plan:
            continue

        try:
            generate_itemized_invoice(
                db=db,
                subscription_id=subscription.id,
                proration_credit=0.0,
                proration_debit=0.0,
                tax_rate=0.18,
                remarks=f"Itemized Recurring Billing Cycle Invoice for {plan.name}"
            )
            generated_invoices += 1
        except Exception:
            pass

        cycle_upper = (plan.billing_cycle or "MONTHLY").upper()
        if cycle_upper == "MONTHLY":
            next_date = today + timedelta(days=30)
        elif cycle_upper == "QUARTERLY":
            next_date = today + timedelta(days=90)
        elif cycle_upper in ["SEMI_ANNUALLY", "SEMI_ANNUAL", "SEMI-ANNUALLY", "SEMI-ANNUAL"]:
            next_date = today + timedelta(days=182)
        elif cycle_upper in ["YEARLY", "ANNUAL"]:
            next_date = today + timedelta(days=365)
        else:
            next_date = today + timedelta(days=30)

        subscription.next_billing_date = next_date
        db.add(subscription)

        # Check if a billing cycle entry already exists for today to prevent duplicates
        existing_cycle = (
            db.query(BillingCycle)
            .filter(
                BillingCycle.subscription_id == subscription.id,
                BillingCycle.billing_start_date == today
            )
            .first()
        )

        if existing_cycle:
            existing_cycle.billing_end_date = next_date
            existing_cycle.renewal_date = next_date
            existing_cycle.next_billing_date = next_date
            existing_cycle.cycle_status = "PROCESSED"
            existing_cycle.is_processed = True
            db.add(existing_cycle)
        else:
            db_cycle = BillingCycle(
                subscription_id=subscription.id,
                billing_start_date=today,
                billing_end_date=next_date,
                renewal_date=next_date,
                next_billing_date=next_date,
                cycle_status="PROCESSED",
                is_processed=True
            )
            db.add(db_cycle)

    db.commit()

    return {
        "message": f"Billing cycle engine executed successfully. Processed {processed_subscriptions} subscription cycles.",
        "processed_subscriptions": processed_subscriptions,
        "generated_invoices": generated_invoices
    }