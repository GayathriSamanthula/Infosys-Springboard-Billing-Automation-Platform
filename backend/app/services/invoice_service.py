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

    return db_invoice


def generate_itemized_invoice(
    db: Session,
    subscription_id: int,
    proration_credit: float = 0.0,
    proration_debit: float = 0.0,
    usage_charge: float = 0.0,
    discount_amount: float = 0.0,
    tax_rate: float = 0.18,
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

    invoice_number = generate_unique_invoice_number(db)
    issue_date = date.today()
    due_date = issue_date + timedelta(days=7)

    # For mid-cycle proration adjustments, net subtotal is the prorated new charge minus unused credit
    if proration_credit > 0 or proration_debit > 0:
        net_diff = (proration_debit + usage_charge) - proration_credit - discount_amount
    else:
        net_diff = (plan.price + usage_charge) - discount_amount

    if net_diff < 0:
        billing_direction = "PLATFORM_REFUNDS_CUSTOMER"
        refund_amount = round(abs(net_diff), 2)
        subtotal = 0.0
        status = "REFUNDED"
    else:
        billing_direction = "CUSTOMER_PAYS"
        refund_amount = 0.0
        subtotal = round(net_diff, 2)
        status = "PENDING"

    tax_amount = round(subtotal * tax_rate, 2)
    total_amount = round(subtotal + tax_amount, 2)

    db_invoice = Invoice(
        subscription_id=subscription_id,
        invoice_number=invoice_number,
        amount=total_amount,
        tax_amount=tax_amount,
        refund_amount=refund_amount,
        billing_direction=billing_direction,
        issue_date=issue_date,
        due_date=due_date,
        status=status,
        remarks=remarks,
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    if previous_plan_name and previous_plan_price > 0:
        line_item_prev = InvoiceLineItem(
            invoice_id=db_invoice.id,
            description=f"Current / Previous Plan Price: {previous_plan_name} (₹{previous_plan_price:.2f}/mo)",
            item_type=LineItemType.PLAN_FEE,
            quantity=1,
            unit_price=previous_plan_price,
            amount=previous_plan_price,
        )
        db.add(line_item_prev)

    plan_desc = f"Target Plan Base Fee: {plan.name} (₹{plan.price:.2f}/mo)" if previous_plan_name else f"Subscription Plan Fee ({plan.name})"

    line_item_plan = InvoiceLineItem(
        invoice_id=db_invoice.id,
        description=plan_desc,
        item_type=LineItemType.PLAN_FEE,
        quantity=1,
        unit_price=plan.price,
        amount=plan.price,
    )
    db.add(line_item_plan)

    if proration_credit > 0:
        credit_desc = f"Proration Credit for unused period of {previous_plan_name} ({remaining_days} days unused out of {total_cycle_days} cycle days)" if previous_plan_name else f"Proration Credit for unused period ({remaining_days} days unused out of {total_cycle_days} cycle days)"
        line_item_credit = InvoiceLineItem(
            invoice_id=db_invoice.id,
            description=credit_desc,
            item_type=LineItemType.PRORATION_CREDIT,
            quantity=1,
            unit_price=-proration_credit,
            amount=-proration_credit,
        )
        db.add(line_item_credit)

    if proration_debit > 0:
        debit_desc = f"Proration Debit for upgrading to {plan.name} ({remaining_days} remaining days out of {total_cycle_days} cycle days)" if previous_plan_name else f"Proration Adjustment for plan upgrade ({remaining_days} remaining days out of {total_cycle_days} cycle days)"
        line_item_debit = InvoiceLineItem(
            invoice_id=db_invoice.id,
            description=debit_desc,
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

    if refund_amount > 0:
        line_item_refund = InvoiceLineItem(
            invoice_id=db_invoice.id,
            description=f"Net Refund/Credit Dispatched to Customer Account: ₹{refund_amount:.2f}",
            item_type=LineItemType.PRORATION_CREDIT,
            quantity=1,
            unit_price=-refund_amount,
            amount=-refund_amount,
        )
        db.add(line_item_refund)

    if tax_amount > 0:
        line_item_tax = InvoiceLineItem(
            invoice_id=db_invoice.id,
            description=f"Tax ({int(tax_rate * 100)}% GST on subtotal ₹{subtotal:.2f})",
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
    sub = db.query(Subscription).filter(Subscription.id == invoice.subscription_id).first()
    if sub:
        cust = db.query(Customer).filter(Customer.id == sub.customer_id).first()
        plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()
        if cust:
            invoice.customer_name = cust.full_name
            invoice.customer_email = cust.email
        if plan:
            invoice.plan_name = plan.name

    items = db.query(InvoiceLineItem).filter(InvoiceLineItem.invoice_id == invoice.id).all()
    invoice.line_items = items
    return invoice


def mark_invoice_as_paid(db: Session, subscription_id: int, payment_date: Optional[date] = None):
    """
    Finds the latest PENDING or UNPAID invoice for a subscription and marks it PAID.
    """
    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.subscription_id == subscription_id,
            Invoice.is_deleted == False,
            or_(Invoice.status == "PENDING", Invoice.status == "UNPAID", Invoice.status == "OVERDUE")
        )
        .order_by(Invoice.id.desc())
        .first()
    )

    if invoice:
        invoice.status = "PAID"
        invoice.payment_date = payment_date or date.today()
        db.commit()
        db.refresh(invoice)

    return _enrich_invoice(db, invoice)


def get_all_invoices(db: Session):
    invoices = db.query(Invoice).filter(Invoice.is_deleted == False).order_by(Invoice.id.desc()).all()
    return [_enrich_invoice(db, inv) for inv in invoices]


def get_invoice_by_id(db: Session, invoice_id: int):
    invoice = (
        db.query(Invoice)
        .filter(
            Invoice.id == invoice_id,
            Invoice.is_deleted == False
        )
        .first()
    )
    return _enrich_invoice(db, invoice)


def get_invoice_line_items(db: Session, invoice_id: int):
    return (
        db.query(InvoiceLineItem)
        .filter(InvoiceLineItem.invoice_id == invoice_id)
        .all()
    )


def delete_invoice(db: Session, invoice_id: int):
    invoice = get_invoice_by_id(db, invoice_id)

    if invoice:
        invoice.is_deleted = True
        db.commit()
        db.refresh(invoice)

    return invoice


def generate_invoice_html(invoice: Invoice) -> str:
    """
    Generates a clean HTML tax invoice document for printing/saving as PDF.
    """
    items_rows = ""
    if hasattr(invoice, 'line_items') and invoice.line_items:
        for item in invoice.line_items:
            items_rows += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{item.description}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">{item.item_type}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹{item.amount:.2f}</td>
            </tr>
            """
    else:
        items_rows = f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Subscription Plan Service</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">PLAN_FEE</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹{invoice.amount:.2f}</td>
        </tr>
        """

    customer_name = getattr(invoice, 'customer_name', 'Valued Customer')
    customer_email = getattr(invoice, 'customer_email', 'N/A')
    plan_name = getattr(invoice, 'plan_name', 'Subscription Plan')

    transition_box = ""
    if invoice.remarks and ("Upgrade" in invoice.remarks or "Downgrade" in invoice.remarks):
        is_upgrade = "Upgrade" in invoice.remarks
        box_bg = "#f0f9ff" if is_upgrade else "#fefce8"
        box_border = "#bae6fd" if is_upgrade else "#fef08a"
        box_color = "#0369a1" if is_upgrade else "#a16207"
        transition_box = f"""
        <div style="background-color: {box_bg}; border: 1px solid {box_border}; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <div style="font-weight: bold; color: {box_color}; font-size: 14px; text-transform: uppercase; margin-bottom: 5px;">
                {'⚡ Plan Upgrade Transition Summary' if is_upgrade else '🔄 Plan Downgrade Transition Summary'}
            </div>
            <div style="font-size: 13px; color: #334155;">
                <strong>Details:</strong> {invoice.remarks}
            </div>
            <div style="font-size: 13px; color: #334155; margin-top: 4px;">
                <strong>{'Net Upgrade Payment Required:' if is_upgrade else 'Net Downgrade Adjustment:'}</strong> ₹{invoice.amount:.2f}
            </div>
        </div>
        """

    total_display = f"Total Amount Payable: ₹{invoice.amount:.2f}"
    if invoice.billing_direction == "PLATFORM_REFUNDS_CUSTOMER" or getattr(invoice, 'refund_amount', 0) > 0:
        total_display = f"Platform Refund / Credit to Customer: ₹{getattr(invoice, 'refund_amount', 0):.2f} (Customer Bill: ₹0.00)"

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Tax Invoice {invoice.invoice_number}</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 40px; line-height: 1.5; }}
        .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; }}
        .company {{ font-size: 24px; font-weight: bold; color: #0284c7; }}
        .badge {{ display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }}
        .badge-paid {{ background-color: #dcfce7; color: #15803d; }}
        .badge-pending {{ background-color: #fef3c7; color: #b45309; }}
        .badge-refunded {{ background-color: #dbeafe; color: #1e40af; }}
        .details-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        th {{ background-color: #f8fafc; color: #475569; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 12px; }}
        .total-box {{ text-align: right; margin-top: 30px; font-size: 18px; font-weight: bold; color: #0284c7; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }}
        @media print {{ body {{ margin: 0; }} }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company">NEXORA BILLING PLATFORM</div>
            <div style="font-size: 13px; color: #64748b;">Automated Subscription & Billing Management</div>
        </div>
        <div style="text-align: right;">
            <h2 style="margin: 0; color: #0f172a;">TAX INVOICE</h2>
            <div style="font-weight: bold; margin-top: 5px;">{invoice.invoice_number}</div>
            <div class="badge {'badge-paid' if invoice.status.upper() == 'PAID' else 'badge-refunded' if invoice.status.upper() == 'REFUNDED' else 'badge-pending'}" style="margin-top: 8px;">
                {invoice.status}
            </div>
        </div>
    </div>

    <div class="details-grid">
        <div>
            <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Billed To:</strong>
            <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">{customer_name}</div>
            <div style="color: #475569;">{customer_email}</div>
            <div style="color: #475569;">Current Active Plan: {plan_name} (Sub #{invoice.subscription_id})</div>
        </div>
        <div style="text-align: right;">
            <strong style="color: #64748b; font-size: 12px; text-transform: uppercase;">Invoice Details:</strong>
            <div style="margin-top: 5px;">Issue Date: <strong>{invoice.issue_date}</strong></div>
            <div>Due Date: <strong>{invoice.due_date}</strong></div>
            {f'<div>Payment Date: <strong>{invoice.payment_date}</strong></div>' if invoice.payment_date else ''}
        </div>
    </div>

    {transition_box}

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th style="text-align: center;">Item Type</th>
                <th style="text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            {items_rows}
        </tbody>
    </table>

    <div class="total-box">
        {total_display}
    </div>

    <div style="margin-top: 15px; color: #64748b; font-size: 12px; border-top: 1px dashed #cbd5e1; padding-top: 15px;">
        Remarks: {invoice.remarks or 'Thank you for your business!'}
    </div>
</body>
</html>"""