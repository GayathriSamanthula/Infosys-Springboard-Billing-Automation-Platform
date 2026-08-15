from datetime import date, timedelta
from uuid import uuid4
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.invoice import Invoice
from app.models.invoice_line_item import InvoiceLineItem, LineItemType
from app.models.subscription import Subscription
from app.models.plan import Plan
from app.models.customer import Customer
from app.models.payment import Payment
from app.schemas.invoice import InvoiceCreate


def generate_unique_invoice_number(db: Session) -> str:
    today_str = date.today().strftime("%Y%m%d")
    count = db.query(Invoice).count() + 1
    random_code = uuid4().hex[:4].upper()
    return f"INV-{today_str}-{count:04d}-{random_code}"


def create_invoice(db: Session, invoice: InvoiceCreate):
    db_invoice = Invoice(**invoice.model_dump())

    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    return _enrich_invoice(db, db_invoice)


def generate_itemized_invoice(
    db: Session,
    subscription_id: int,
    proration_credit: float = 0.0,
    proration_debit: float = 0.0,
    usage_charge: float = 0.0,
    discount_amount: float = 0.0,
    tax_rate: Optional[float] = None,
    remarks: str = "Billing Cycle Invoice",
    previous_plan_name: Optional[str] = None,
    previous_plan_price: float = 0.0,
    remaining_days: int = 10,
    total_cycle_days: int = 30,
) -> Invoice:
    subscription = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not subscription:
        raise ValueError("Subscription not found.")

    plan = db.query(Plan).filter(Plan.id == subscription.plan_id).first()
    if not plan:
        raise ValueError("Associated subscription plan not found.")

    # Deduplication check: Reuse existing active invoice if already created for this subscription
    existing_invoice = db.query(Invoice).filter(
        Invoice.subscription_id == subscription.id,
        Invoice.is_deleted == False
    ).order_by(Invoice.id.desc()).first()

    if existing_invoice:
        return _enrich_invoice(db, existing_invoice)

    invoice_number = generate_unique_invoice_number(db)
    issue_date = date.today()
    due_date = issue_date + timedelta(days=7)

    if proration_credit > 0 or proration_debit > 0:
        net_diff = (proration_debit + usage_charge) - proration_credit - discount_amount
        subtotal = max(0.0, round(net_diff, 2))
    else:
        subtotal = max(0.0, round(plan.price + usage_charge - discount_amount, 2))

    # Dynamic Location Tax calculation from Tax Master
    from app.services.tax_service import calculate_tax_for_customer
    if tax_rate is None:
        tax_res = calculate_tax_for_customer(db, customer_id=subscription.customer_id, subtotal=subtotal)
        tax_rate = tax_res.tax_percentage / 100.0
        tax_name = tax_res.tax_name
        tax_pct = tax_res.tax_percentage
        tax_amount = tax_res.tax_amount
    else:
        tax_pct = round(tax_rate * 100, 2)
        tax_name = "GST" if tax_rate == 0.18 else "Tax"
        tax_amount = round(subtotal * tax_rate, 2)

    final_amount = round(subtotal + tax_amount, 2)

    db_invoice = Invoice(
        subscription_id=subscription.id,
        invoice_number=invoice_number,
        issue_date=issue_date,
        due_date=due_date,
        amount=final_amount,
        tax_amount=tax_amount,
        status="UNPAID",
        remarks=remarks,
    )

    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    if proration_credit > 0 or proration_debit > 0:
        line_item_desc = f"Mid-Cycle Plan Change ({previous_plan_name or 'Previous Plan'} -> {plan.name})"
    else:
        b_cycle = plan.billing_cycle.value if hasattr(plan.billing_cycle, 'value') else str(plan.billing_cycle or 'MONTHLY')
        line_item_desc = f"Subscription Fee: {plan.name} ({b_cycle.upper()})"

    line_item_plan = InvoiceLineItem(
        invoice_id=db_invoice.id,
        description=line_item_desc,
        item_type=LineItemType.PLAN_FEE,
        quantity=1,
        unit_price=plan.price,
        amount=plan.price,
    )
    db.add(line_item_plan)

    if proration_credit > 0:
        line_item_credit = InvoiceLineItem(
            invoice_id=db_invoice.id,
            description=f"Proration Credit: Unused time on {previous_plan_name or 'Previous Plan'} ({remaining_days}/{total_cycle_days} days)",
            item_type=LineItemType.PRORATION_CREDIT,
            quantity=1,
            unit_price=-proration_credit,
            amount=-proration_credit,
        )
        db.add(line_item_credit)

    if proration_debit > 0:
        line_item_debit = InvoiceLineItem(
            invoice_id=db_invoice.id,
            description=f"Proration Charge: Remaining time on {plan.name} ({remaining_days}/{total_cycle_days} days)",
            item_type=LineItemType.PRORATION_DEBIT,
            quantity=1,
            unit_price=proration_debit,
            amount=proration_debit,
        )
        db.add(line_item_debit)

    if usage_charge > 0:
        line_item_usage = InvoiceLineItem(
            invoice_id=db_invoice.id,
            description=f"Metered Usage Charges (API & Overage): ₹{usage_charge:.2f}",
            item_type=LineItemType.USAGE_CHARGE,
            quantity=1,
            unit_price=usage_charge,
            amount=usage_charge,
        )
        db.add(line_item_usage)

    if discount_amount > 0:
        line_item_discount = InvoiceLineItem(
            invoice_id=db_invoice.id,
            description=f"Promotional Discount / Coupon: -₹{discount_amount:.2f}",
            item_type=LineItemType.DISCOUNT,
            quantity=1,
            unit_price=-discount_amount,
            amount=-discount_amount,
        )
        db.add(line_item_discount)

    if tax_amount > 0:
        line_item_tax = InvoiceLineItem(
            invoice_id=db_invoice.id,
            description=f"Tax ({tax_pct}% {tax_name} on subtotal ₹{subtotal:.2f})",
            item_type=LineItemType.TAX,
            quantity=1,
            unit_price=tax_amount,
            amount=tax_amount,
        )
        db.add(line_item_tax)

    db.commit()
    db.refresh(db_invoice)
    return _enrich_invoice(db, db_invoice)


def _enrich_invoice(db: Session, invoice: Invoice):
    if not invoice:
        return None
    sub = db.query(Subscription).filter(Subscription.id == invoice.subscription_id).first() if invoice.subscription_id else None
    if sub:
        invoice.customer_id = sub.customer_id
        cust = db.query(Customer).filter(Customer.id == sub.customer_id).first()
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        if cust:
            invoice.customer_name = cust.full_name
            invoice.customer_email = cust.email
        if plan:
            invoice.plan_name = plan.name
    elif getattr(invoice, "customer_id", None):
        cust = db.query(Customer).filter(Customer.id == invoice.customer_id).first()
        if cust:
            invoice.customer_name = cust.full_name
            invoice.customer_email = cust.email

    # Auto-reconcile invoice status if a successful payment transaction exists
    if str(getattr(invoice, 'status', '')).upper() != 'PAID':
        matching_pay = db.query(Payment).filter(
            or_(Payment.invoice_id == invoice.id, Payment.subscription_id == invoice.subscription_id),
            Payment.payment_status == 'SUCCESS',
            Payment.is_deleted == False
        ).first()
        if matching_pay:
            invoice.status = 'PAID'
            if not invoice.payment_date and matching_pay.payment_date:
                invoice.payment_date = matching_pay.payment_date
            try:
                db.commit()
                db.refresh(invoice)
            except Exception:
                db.rollback()

    items = db.query(InvoiceLineItem).filter(InvoiceLineItem.invoice_id == invoice.id).all()
    invoice.line_items = items
    return invoice


from datetime import date, timedelta, datetime


def mark_invoice_as_paid(db: Session, subscription_id: int, payment_date: Optional[date] = None):
    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.subscription_id == subscription_id,
            Invoice.is_deleted == False,
            or_(Invoice.status == "PENDING", Invoice.status == "UNPAID", Invoice.status == "OVERDUE", Invoice.status == "PAID")
        )
        .order_by(Invoice.id.desc())
        .first()
    )

    if invoice:
        invoice.status = "PAID"
        invoice.payment_date = payment_date or date.today()
        db.commit()

        # Ensure a payment transaction log entry exists for this invoice
        from app.models.payment import Payment
        existing_payment = db.query(Payment).filter(
            or_(Payment.invoice_id == invoice.id, Payment.subscription_id == invoice.subscription_id),
            Payment.is_deleted == False
        ).first()

        if not existing_payment:
            pay_dt = datetime.combine(invoice.payment_date, datetime.min.time()) if isinstance(invoice.payment_date, date) and not isinstance(invoice.payment_date, datetime) else (invoice.payment_date or datetime.utcnow())
            new_payment = Payment(
                subscription_id=invoice.subscription_id,
                invoice_id=invoice.id,
                amount=invoice.amount,
                payment_method="Credit Card / Auto Pay",
                transaction_id=f"TXN-AUTO-{invoice.id}-{uuid4().hex[:6].upper()}",
                payment_date=pay_dt,
                payment_status="SUCCESS",
                gateway_name="Mock Payment Gateway",
                remarks=f"Payment settled for invoice {invoice.invoice_number}"
            )
            db.add(new_payment)
            db.commit()

        db.refresh(invoice)

    return _enrich_invoice(db, invoice)


def get_all_invoices(db: Session) -> list[Invoice]:
    invoices = db.query(Invoice).filter(Invoice.is_deleted == False).order_by(Invoice.id.desc()).all()
    return [_enrich_invoice(db, inv) for inv in invoices]


def get_invoices_by_customer(db: Session, customer_id: int) -> list[Invoice]:
    subscriptions = db.query(Subscription).filter(Subscription.customer_id == customer_id).all()
    sub_ids = [s.id for s in subscriptions]

    invoices = (
        db.query(Invoice)
        .filter(
            Invoice.is_deleted == False,
            Invoice.subscription_id.in_(sub_ids)
        )
        .order_by(Invoice.id.desc())
        .all()
    )
    return [_enrich_invoice(db, inv) for inv in invoices]


def get_invoice_by_id(db: Session, invoice_id: int) -> Optional[Invoice]:
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id, Invoice.is_deleted == False)
        .first()
    )
    return _enrich_invoice(db, invoice)


def get_invoice_line_items(db: Session, invoice_id: int) -> list[InvoiceLineItem]:
    return (
        db.query(InvoiceLineItem)
        .filter(InvoiceLineItem.invoice_id == invoice_id)
        .all()
    )


def delete_invoice(db: Session, invoice_id: int) -> Optional[Invoice]:
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id, Invoice.is_deleted == False)
        .first()
    )

    if invoice:
        invoice.is_deleted = True
        db.commit()

    return invoice


def generate_invoice_html(invoice: Invoice, platform: Optional[str] = None) -> str:
    plat = (platform or "").upper()
    if not plat:
        plat = str(getattr(invoice, "platform_source", "")).upper()

    is_velora = (plat == "VELORA" or plat == "VELORA_GATEWAY")

    brand_name = "VELORA FINTECH STATEMENT" if is_velora else "NEXORA BILLING STATEMENT"
    brand_color = "#f57c00" if is_velora else "#0284c7"
    footer_text = (
        "Thank you for choosing Velora Fintech Platform.<br>For billing inquiries or tax receipts, contact support@velora.com"
        if is_velora
        else "Thank you for choosing Nexora SaaS Billing Automation Platform.<br>For billing inquiries or tax receipts, contact support@nexora.com"
    )

    cust_name = getattr(invoice, "customer_name", f"Customer #{getattr(invoice, 'customer_id', 1)}")
    cust_email = getattr(invoice, "customer_email", "N/A")
    cust_country = str(getattr(invoice, "customer_country", "DEFAULT")).upper()
    plan_name = getattr(invoice, "plan_name", "Subscription Plan")

    currency_symbol = "$" if "INDIA" not in cust_country else "₹"
    currency_code = "USD" if "INDIA" not in cust_country else "INR"

    tax_amt = float(getattr(invoice, "tax_amount", 0.0) or 0.0)
    total_amt = float(getattr(invoice, "amount", 0.0) or 0.0)
    subtotal_amt = max(0.0, total_amt - tax_amt)

    line_items = getattr(invoice, "line_items", None)
    if not line_items:
        line_items_html = f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{plan_name} (Plan Price Subtotal)</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">{currency_symbol}{subtotal_amt:.2f}</td>
        </tr>
        """
        if tax_amt > 0:
            line_items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Regional Tax / GST / VAT</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">{currency_symbol}{tax_amt:.2f}</td>
            </tr>
            """
    else:
        line_items_html = ""
        for item in line_items:
            line_items_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{item.description}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">{currency_symbol}{item.amount:.2f}</td>
            </tr>
            """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{brand_name} - {invoice.invoice_number}</title>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px; color: #0f172a; }}
            .container {{ max-width: 700px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; border: 2px solid {brand_color}; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }}
            .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid {brand_color}; padding-bottom: 20px; margin-bottom: 30px; }}
            .title {{ font-size: 24px; font-weight: 800; color: {brand_color}; margin: 0; }}
            .inv-num {{ font-size: 14px; font-weight: 700; color: #64748b; margin-top: 5px; }}
            .details-grid {{ display: flex; justify-content: space-between; margin-bottom: 30px; }}
            .details-box {{ width: 48%; }}
            .details-label {{ font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }}
            .details-val {{ font-size: 14px; font-weight: 700; color: #0f172a; }}
            table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
            th {{ background-color: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; font-weight: 800; color: {brand_color}; border-bottom: 2px solid #e2e8f0; }}
            .total-row {{ font-size: 18px; font-weight: 900; color: {brand_color}; text-align: right; padding-top: 15px; border-top: 2px solid {brand_color}; }}
            .footer {{ text-align: center; margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div>
                    <h1 class="title">{brand_name}</h1>
                    <div class="inv-num">Tax Invoice: {invoice.invoice_number}</div>
                </div>
                <div style="text-align: right;">
                    <span style="background-color: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800;">
                        {invoice.status}
                    </span>
                </div>
            </div>

            <div class="details-grid">
                <div class="details-box">
                    <div class="details-label">Billed To (Customer ID #{getattr(invoice, 'customer_id', 1)})</div>
                    <div class="details-val">{cust_name}</div>
                    <div style="font-size: 12px; color: #64748b;">{cust_email}</div>
                </div>
                <div class="details-box" style="text-align: right;">
                    <div class="details-label">Billing Metadata</div>
                    <div class="details-val">Plan: {plan_name}</div>
                    <div style="font-size: 12px; color: #64748b;">Issue Date: {invoice.issue_date}</div>
                    <div style="font-size: 12px; color: #64748b;">Due Date: {invoice.due_date}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description / Line Item</th>
                        <th style="text-align: right;">Amount ({currency_code})</th>
                    </tr>
                </thead>
                <tbody>
                    {line_items_html}
                </tbody>
            </table>

            <div class="total-row">
                Total Billed Amount: {currency_symbol}{invoice.amount:.2f}
            </div>

            <div class="footer">
                {footer_text}
            </div>
        </div>
    </body>
    </html>
    """
    return html