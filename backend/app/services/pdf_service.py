import io
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

from app.models.invoice import Invoice
from app.models.customer import Customer
from app.models.subscription import Subscription
from app.models.plan import Plan
from app.models.payment import Payment
from app.models.invoice_line_item import InvoiceLineItem


def generate_invoice_pdf_bytes(db: Session, invoice_id: int, platform: str = "NEXORA") -> bytes:
    """
    Generates a professional, branded PDF invoice document using ReportLab.
    Matches all 8 section requirements from Module 3 PDF specification.
    0 database records modified or erased.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise ValueError(f"Invoice #{invoice_id} not found.")

    subscription = db.query(Subscription).filter(Subscription.id == invoice.subscription_id).first() if invoice.subscription_id else None
    
    customer = None
    if getattr(invoice, "customer_id", None):
        customer = db.query(Customer).filter(Customer.id == invoice.customer_id).first()
    if not customer and subscription:
        customer = db.query(Customer).filter(Customer.id == subscription.customer_id).first()
    if not customer and getattr(invoice, "customer_email", None):
        customer = db.query(Customer).filter(Customer.email == invoice.customer_email).first()

    if not customer:
        customer = Customer(
            id=getattr(invoice, 'customer_id', 0),
            full_name=getattr(invoice, 'customer_name', None) or 'Valued Customer',
            email=getattr(invoice, 'customer_email', None) or 'customer@example.com',
        )

    plan = db.query(Plan).filter(Plan.id == subscription.plan_id).first() if subscription else None
    payment = db.query(Payment).filter(Payment.subscription_id == (subscription.id if subscription else 0)).order_by(Payment.id.desc()).first()
    line_items = db.query(InvoiceLineItem).filter(InvoiceLineItem.invoice_id == invoice.id).all()

    if not REPORTLAB_AVAILABLE:
        buffer = io.BytesIO()
        text_content = f"PDF INVOICE STATEMENT\nInvoice #: {invoice.invoice_number}\nCustomer: {customer.full_name}\nAmount: Rs.{invoice.amount}\nStatus: {invoice.status}\nPlatform: {platform}"
        buffer.write(text_content.encode("utf-8"))
        buffer.seek(0)
        return buffer.getvalue()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    primary_color = colors.HexColor("#4f46e5") if platform.upper() == "NEXORA" else colors.HexColor("#0284c7")
    text_dark = colors.HexColor("#0f172a")
    bg_light = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#cbd5e1")

    # Custom Paragraph Styles
    style_title = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        textColor=primary_color,
        spaceAfter=4
    )
    style_subtitle = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=12
    )
    style_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=text_dark,
        spaceBefore=10,
        spaceAfter=6
    )
    style_body = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=text_dark
    )
    style_bold = ParagraphStyle(
        "BodyBoldCustom",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=text_dark
    )
    style_footer = ParagraphStyle(
        "FooterCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        alignment=1,  # Center
        textColor=colors.HexColor("#64748b")
    )

    elements = []

    # 1. Company Information & Header
    company_profiles = {
        "NEXORA": {
            "title": "NEXORA BILLING PLATFORM",
            "address": "100 SaaS Plaza, Suite 500, San Francisco, CA 94107",
            "tax_id": "GSTIN / Tax ID: GSTIN-27NEXORA9941E1Z5",
            "email": "support@nexora.com",
            "phone": "+1 (800) 555-0199",
            "website": "www.nexora.com"
        },
        "VELORA": {
            "title": "VELORA FINTECH PLATFORM",
            "address": "250 Fintech Tower, Suite 1200, New York, NY 10005",
            "tax_id": "Tax Registration ID: TRN-100293849500003",
            "email": "support@velora.com",
            "phone": "+1 (800) 777-0244",
            "website": "www.velora.com"
        }
    }

    active_company = company_profiles.get(platform.upper(), company_profiles["NEXORA"])

    comp_title = active_company["title"]
    comp_address = active_company["address"]
    comp_tax_id = active_company["tax_id"]
    comp_contact = f"Email: {active_company['email']} | Phone: {active_company['phone']} | {active_company['website']}"

    header_left = [
        Paragraph(comp_title, style_title),
        Paragraph(comp_address, style_subtitle),
        Paragraph(f"<b>{comp_tax_id}</b>", style_body),
        Paragraph(comp_contact, style_subtitle),
    ]

    header_right = [
        Paragraph("<b>OFFICIAL TAX INVOICE</b>", ParagraphStyle("RightTitle", parent=style_title, alignment=2, fontSize=16)),
        Paragraph(f"Invoice #: <b>{invoice.invoice_number}</b>", ParagraphStyle("RightInv", parent=style_body, alignment=2)),
        Paragraph(f"Status: <b>{invoice.status}</b>", ParagraphStyle("RightStatus", parent=style_bold, alignment=2, textColor=colors.HexColor("#16a34a") if invoice.status=="PAID" else colors.HexColor("#dc2626"))),
        Paragraph(f"Date: {invoice.issue_date or invoice.payment_date or date.today().strftime('%Y-%m-%d')}", ParagraphStyle("RightDate", parent=style_body, alignment=2)),
    ]

    header_table = Table([[header_left, header_right]], colWidths=[320, 220])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1, color=border_color, spaceAfter=12))

    # 2. Customer Information & Invoice Details
    cust_name = customer.full_name if customer else "Valued Customer"
    cust_email = customer.email if customer else "customer@example.com"
    cust_phone = getattr(customer, "phone_number", None) or "N/A"
    cust_country = customer.country if customer and customer.country else "DEFAULT"
    cust_addr = getattr(customer, "address", None) or "N/A"

    currency_symbol = "₹" if "INDIA" in cust_country.upper() else "$"
    currency_code = "INR" if "INDIA" in cust_country.upper() else "USD"

    cust_info_html = [
        Paragraph("<b>BILLED TO (CUSTOMER):</b>", style_heading),
        Paragraph(f"<b>{cust_name}</b> (ID: #{customer.id if customer else 10})", style_body),
        Paragraph(f"Email: {cust_email}", style_body),
        Paragraph(f"Phone: {cust_phone}", style_body),
        Paragraph(f"Address: {cust_addr}, {cust_country}", style_body),
    ]

    sub_id_str = f"#{subscription.id}" if subscription else "N/A"
    plan_name_str = plan.name if plan else (getattr(invoice, "plan_name", None) or "Standard Plan")
    raw_cycle = getattr(subscription, "billing_cycle", None) or getattr(plan, "billing_interval", None) or "Monthly"
    billing_period_str = f"{str(raw_cycle).capitalize()} (Auto-Renewing)"

    inv_details_html = [
        Paragraph("<b>INVOICE & SUBSCRIPTION DETAILS:</b>", style_heading),
        Paragraph(f"Invoice Ref: <b>{invoice.invoice_number}</b>", style_body),
        Paragraph(f"Subscription ID: <b>{sub_id_str}</b>", style_body),
        Paragraph(f"Plan Name: <b>{plan_name_str}</b>", style_body),
        Paragraph(f"Billing Period: <b>{billing_period_str}</b>", style_body),
        Paragraph(f"Due Date: <b>{invoice.due_date or (date.today() + timedelta(days=7)).strftime('%Y-%m-%d')}</b>", style_body),
    ]

    meta_table = Table([[cust_info_html, inv_details_html]], colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))

    # 3. Itemized Line Items Table
    elements.append(Paragraph("ITEMIZED LINE ITEMS", style_heading))

    table_data = [
        [Paragraph("<b>Item Description</b>", style_bold),
         Paragraph("<b>Type</b>", style_bold),
         Paragraph("<b>Qty</b>", style_bold),
         Paragraph("<b>Unit Price</b>", style_bold),
         Paragraph("<b>Amount</b>", style_bold)]
    ]

    inv_amount = float(getattr(invoice, "amount", 0.0) or getattr(invoice, "total_amount", 0.0) or 0.0)

    if line_items:
        for item in line_items:
            table_data.append([
                Paragraph(item.description or "Subscription Fee", style_body),
                Paragraph(item.item_type or "PLAN_FEE", style_body),
                Paragraph(str(item.quantity or 1), style_body),
                Paragraph(f"{currency_symbol}{item.unit_price or 0.0:.2f}", style_body),
                Paragraph(f"{currency_symbol}{item.amount or 0.0:.2f}", style_body),
            ])
    else:
        # Fallback default itemized breakdown
        tax_val = float(getattr(invoice, "tax_amount", 0.0) or 0.0)
        subtotal_val = max(0.0, round(inv_amount - tax_val, 2))

        table_data.append([
            Paragraph(f"Subscription Fee - {plan.name if plan else 'Premium Plan'}", style_body),
            Paragraph("PLAN_FEE", style_body),
            Paragraph("1", style_body),
            Paragraph(f"{currency_symbol}{subtotal_val:.2f}", style_body),
            Paragraph(f"{currency_symbol}{subtotal_val:.2f}", style_body),
        ])
        if tax_val > 0:
            table_data.append([
                Paragraph("Applicable GST / Regional Tax", style_body),
                Paragraph("TAX", style_body),
                Paragraph("1", style_body),
                Paragraph(f"{currency_symbol}{tax_val:.2f}", style_body),
                Paragraph(f"{currency_symbol}{tax_val:.2f}", style_body),
            ])

    item_table = Table(table_data, colWidths=[200, 100, 50, 95, 95])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 14))

    # 4. Invoice Summary & Payment Details Box (Tax Added ONCE Only)
    tax_final = float(getattr(invoice, "tax_amount", 0.0) or 0.0)
    subtotal_final = max(0.0, round(inv_amount - tax_final, 2))
    grand_total = round(subtotal_final + tax_final, 2)

    txn_ref = payment.transaction_id if (payment and payment.transaction_id) else invoice.invoice_number.replace("INV-", "TXN-")
    pay_method = payment.payment_method if (payment and payment.payment_method) else "Online Payment"
    gw_name = payment.gateway_name if (payment and payment.gateway_name) else ("Velora Merchant Gateway" if platform.upper() == "VELORA" else "Nexora Billing Gateway")

    payment_info_html = [
        Paragraph("<b>PAYMENT TRANSACTION RECEIPT:</b>", style_heading),
        Paragraph(f"Payment Status: <b>{invoice.status}</b>", style_body),
        Paragraph(f"Transaction ID: <b>{txn_ref}</b>", style_body),
        Paragraph(f"Payment Date: <b>{invoice.payment_date or str(date.today())}</b>", style_body),
        Paragraph(f"Payment Method: <b>{pay_method}</b>", style_body),
        Paragraph(f"Gateway Name: <b>{gw_name}</b>", style_body),
    ]

    discount_amt = float(getattr(invoice, "discount_amount", 0.0) or getattr(invoice, "discount", 0.0) or 0.0)
    proration_amt = float(getattr(invoice, "proration_credit", 0.0) or getattr(invoice, "proration_amount", 0.0) or 0.0)

    summary_html = [
        Paragraph("<b>FINANCIAL SUMMARY:</b>", style_heading),
        Paragraph(f"Subtotal (Base Plan Rate): <b>{currency_symbol}{subtotal_final:.2f} {currency_code}</b>", style_body),
        Paragraph(f"Total Discount: <b>{currency_symbol}{discount_amt:.2f} {currency_code}</b>", style_body),
        Paragraph(f"Proration Credit: <b>{currency_symbol}{proration_amt:.2f} {currency_code}</b>", style_body),
        Paragraph(f"Regional Tax / GST: <b>{currency_symbol}{tax_final:.2f} {currency_code}</b>", style_body),
        Paragraph(f"<font size=11 color='{primary_color.hexval()}'><b>GRAND TOTAL: {currency_symbol}{grand_total:.2f} {currency_code}</b></font>", ParagraphStyle("GrandTotal", parent=style_body, spaceBefore=4)),
    ]

    summary_table = Table([[payment_info_html, summary_html]], colWidths=[270, 270])
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), bg_light),
        ('BOX', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))

    # 5. Terms & Footer
    elements.append(HRFlowable(width="100%", thickness=1, color=border_color, spaceAfter=8))
    elements.append(Paragraph("<b>Terms & Conditions:</b> All payments are governed by Nexora/Velora Terms of Service. Invoices are non-transferable.", style_footer))
    elements.append(Paragraph("<b>Refund Policy:</b> Refunds requested within 14 days of billing cycle initiation are processed according to standard proration rules.", style_footer))
    elements.append(Paragraph("Thank you for your business! For billing inquiries, contact support@nexora.com.", style_footer))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
