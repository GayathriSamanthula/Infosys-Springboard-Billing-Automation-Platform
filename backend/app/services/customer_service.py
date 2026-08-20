from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from fastapi import HTTPException
from typing import Optional
from datetime import datetime, date, timedelta

from app.models.customer import Customer
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.plan import Plan
from app.models.notification import Notification
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerLogin, CustomerRegister
from app.schemas.audit_log import AuditLogCreate
from app.services.audit_log_service import create_audit_log
from app.core.security import hash_password, verify_password
from app.core.jwt_handler import create_access_token


def create_customer(db: Session, customer: CustomerCreate):

    db_customer = Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number,
        country=customer.country,
        address=customer.address,
        customer_status=customer.customer_status or "ACTIVE",
        platform_source=getattr(customer, "platform_source", None) or "NEXORA_DIRECT",
    )

    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    create_audit_log(
        db,
        AuditLogCreate(
            event="Customer Created",
            performed_by="System",
            customer_id=db_customer.id,
            description=f"Customer '{db_customer.full_name}' was created."
        )
    )

    return db_customer


def get_all_customers(
    db: Session,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    query = db.query(Customer).filter(Customer.is_deleted == False)

    if status_filter:
        query = query.filter(Customer.customer_status == status_filter.upper())

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Customer.full_name.ilike(search_pattern),
                Customer.email.ilike(search_pattern),
                Customer.phone_number.ilike(search_pattern),
                Customer.country.ilike(search_pattern)
            )
        )

    customers = query.order_by(Customer.id.desc()).offset(skip).limit(limit).all()
    for c in customers:
        if not getattr(c, 'platform_source', None):
            setattr(c, 'platform_source', 'NEXORA_DIRECT')
        if not getattr(c, 'country', None):
            setattr(c, 'country', 'India')
    return customers
    
    
def get_customer_by_id(db: Session, customer_id: int):
    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.is_deleted == False
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if not getattr(customer, 'platform_source', None):
        setattr(customer, 'platform_source', 'NEXORA_DIRECT')

    return customer


def get_customer_history(db: Session, customer_id: int):
    customer = get_customer_by_id(db, customer_id)
    
    subscriptions = db.query(Subscription).filter(
        Subscription.customer_id == customer_id,
        Subscription.is_deleted == False
    ).all()

    invoices = db.query(Invoice).join(
        Subscription, Invoice.subscription_id == Subscription.id
    ).filter(
        Subscription.customer_id == customer_id,
        Invoice.is_deleted == False
    ).all()

    return {
        "customer": customer,
        "subscriptions_count": len(subscriptions),
        "subscriptions": subscriptions,
        "invoices_count": len(invoices),
        "invoices": invoices
    }

    
def update_customer(db: Session, customer_id: int, customer: CustomerUpdate):
    existing_customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.is_deleted == False)
        .first()
    )

    if not existing_customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if customer.email is not None and customer.email != existing_customer.email:
        email_exists = db.query(Customer).filter(
            Customer.email == customer.email,
            Customer.id != customer_id,
            Customer.is_deleted == False
        ).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already registered")

    if customer.phone_number is not None and customer.phone_number != existing_customer.phone_number:
        phone_exists = db.query(Customer).filter(
            Customer.phone_number == customer.phone_number,
            Customer.id != customer_id,
            Customer.is_deleted == False
        ).first()
        if phone_exists:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    if customer.full_name is not None:
        existing_customer.full_name = customer.full_name
    if customer.email is not None:
        existing_customer.email = customer.email
    if customer.phone_number is not None:
        existing_customer.phone_number = customer.phone_number
    if customer.country is not None:
        existing_customer.country = customer.country
    if customer.address is not None:
        existing_customer.address = customer.address
    if customer.customer_status is not None:
        existing_customer.customer_status = customer.customer_status

    db.commit()
    db.refresh(existing_customer)
    
    create_audit_log(
        db,
        AuditLogCreate(
            event="Customer Updated",
            performed_by="System",
            customer_id=existing_customer.id,
            description=f"Customer '{existing_customer.full_name}' was updated."
        )
    )

    return existing_customer


def delete_customer(db: Session, customer_id: int):
    existing_customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not existing_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    existing_customer.is_deleted = True
    existing_customer.customer_status = "INACTIVE"

    db.commit()
    create_audit_log(
        db,
        AuditLogCreate(
            event="Customer Deleted",
            performed_by="System",
            customer_id=existing_customer.id,
            description=f"Customer '{existing_customer.full_name}' was deleted."
        )
    )

    return {"message": "Customer deleted successfully"}


def get_customer_portal_dashboard(db: Session, customer_id: int):
    customer = get_customer_by_id(db, customer_id)
    
    # Active Subscription & Plan
    subscription = (
        db.query(Subscription)
        .filter(Subscription.customer_id == customer_id, Subscription.is_deleted == False)
        .order_by(Subscription.id.desc())
        .first()
    )
    
    sub_data = None
    if subscription:
        plan = db.query(Plan).filter(Plan.id == subscription.plan_id).first()
        sub_data = {
            "id": subscription.id,
            "status": subscription.status.value if hasattr(subscription.status, 'value') else str(subscription.status),
            "start_date": subscription.start_date,
            "end_date": subscription.end_date,
            "next_billing_date": subscription.next_billing_date or subscription.end_date,
            "auto_renew": subscription.auto_renew,
            "plan_id": subscription.plan_id,
            "plan_name": plan.name if plan else "Standard Plan",
            "price": plan.price if plan else 0.0,
            "billing_cycle": plan.billing_cycle if plan else "monthly",
        }

    # Customer Invoices
    invoices = (
        db.query(Invoice)
        .join(Subscription, Invoice.subscription_id == Subscription.id)
        .filter(Subscription.customer_id == customer_id, Invoice.is_deleted == False)
        .order_by(Invoice.id.desc())
        .all()
    )
    enriched_invoices = []
    from app.services.invoice_service import _enrich_invoice
    for inv in invoices:
        inv = _enrich_invoice(db, inv)
        enriched_invoices.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "amount": inv.amount,
            "status": inv.status,
            "issue_date": inv.issue_date,
            "due_date": inv.due_date,
            "payment_date": inv.payment_date,
            "refund_amount": getattr(inv, "refund_amount", 0.0),
        })

    # Customer Payments
    payments = (
        db.query(Payment)
        .join(Subscription, Payment.subscription_id == Subscription.id)
        .filter(Subscription.customer_id == customer_id, Payment.is_deleted == False)
        .order_by(Payment.id.desc())
        .all()
    )
    enriched_payments = []
    for p in payments:
        enriched_payments.append({
            "id": p.id,
            "transaction_id": p.transaction_id,
            "amount": p.amount,
            "payment_status": p.payment_status,
            "payment_method": p.payment_method,
            "payment_date": p.payment_date,
        })

    # Customer Notifications
    notifications = (
        db.query(Notification)
        .filter(Notification.customer_id == customer_id)
        .order_by(Notification.id.desc())
        .limit(10)
        .all()
    )
    enriched_notifs = []
    for n in notifications:
        enriched_notifs.append({
            "id": n.id,
            "notification_type": n.notification_type,
            "message": n.message,
            "sent_date": n.sent_date,
            "is_read": n.is_read,
        })

    total_spent = sum(p.amount for p in payments if p.payment_status == 'SUCCESS')
    pending_count = sum(1 for i in invoices if i.status in ['PENDING', 'UNPAID', 'OVERDUE'])

    return {
        "customer": {
            "id": customer.id,
            "full_name": customer.full_name,
            "email": customer.email,
            "phone_number": customer.phone_number,
            "country": customer.country,
            "customer_status": customer.customer_status,
        },
        "active_subscription": sub_data,
        "invoices": enriched_invoices,
        "payments": enriched_payments,
        "notifications": enriched_notifs,
        "summary": {
            "total_spent": total_spent,
            "total_invoices": len(invoices),
            "pending_invoices_count": pending_count,
            "active_plan_name": sub_data["plan_name"] if sub_data else "No Active Plan",
        }
    }


def login_customer(db: Session, login_data: CustomerLogin):
    from sqlalchemy import func, or_
    raw_input = (login_data.email or '').strip()
    email_clean = raw_input.lower()

    not_deleted_condition = or_(Customer.is_deleted == False, Customer.is_deleted.is_(None))

    # 1. Try exact email match
    customer = (
        db.query(Customer)
        .filter(func.lower(Customer.email) == email_clean, not_deleted_condition)
        .first()
    )

    # 2. Try partial email or username prefix match (e.g. 'arjun' -> 'arjun.kumar@example.com')
    if customer is None and '@' not in raw_input:
        customer = (
            db.query(Customer)
            .filter(
                or_(
                    Customer.email.ilike(f"%{raw_input}%"),
                    Customer.full_name.ilike(f"%{raw_input}%")
                ),
                not_deleted_condition
            )
            .first()
        )

    # 3. Try ID match if numeric
    if customer is None and raw_input.isdigit():
        customer = (
            db.query(Customer)
            .filter(Customer.id == int(raw_input), not_deleted_condition)
            .first()
        )

    if customer is None:
        raise ValueError("No customer account found with this email address. Please register an account first.")

    # Strict Password Verification against existing database records only
    if not customer.password or not verify_password(login_data.password, customer.password):
        raise ValueError("Invalid password. Please check your password and try again.")

    token = create_access_token(
        {
            "sub": customer.email,
            "customer_id": customer.id,
            "role": "CUSTOMER"
        }
    )

    raw_src = getattr(customer, "platform_source", None) or "NEXORA_DIRECT"
    platform_src = "VELORA_DIRECT" if "VELORA" in str(raw_src).upper() else "NEXORA_DIRECT"

    return {
        "access_token": token,
        "token_type": "bearer",
        "customer_id": customer.id,
        "full_name": customer.full_name or (customer.email.split('@')[0] if customer.email else "Valued Customer"),
        "email": customer.email or "",
        "role": "CUSTOMER",
        "platform_source": platform_src
    }


def init_default_customers(db: Session):
    """Seed initial default customers for Nexora and Velora demo accounts."""
    defaults = [
        {"full_name": "Arjun Kumar", "email": "arjun@example.com", "platform_source": "NEXORA_DIRECT"},
        {"full_name": "Nadhiya Gedela", "email": "nadhiya@example.com", "platform_source": "NEXORA_DIRECT"},
        {"full_name": "Gayathri Samanthula", "email": "gayathri@example.com", "platform_source": "NEXORA_DIRECT"},
        {"full_name": "Priya Reddy", "email": "priya@example.com", "platform_source": "NEXORA_DIRECT"},
        {"full_name": "Sruthi pandey", "email": "sruthipandey@example.com", "platform_source": "VELORA_DIRECT"},
    ]
    for d in defaults:
        exists = db.query(Customer).filter(Customer.email == d["email"]).first()
        if not exists:
            c = Customer(
                full_name=d["full_name"],
                email=d["email"],
                phone_number="+91 9876543210",
                password=hash_password("password123"),
                customer_status="ACTIVE",
                platform_source=d["platform_source"]
            )
            db.add(c)
        else:
            exists.platform_source = d["platform_source"]
            db.add(exists)
    db.commit()

    # Seed Active Subscription for Sruthi pandey (Premium Pro Plan ₹2000/mo)
    try:
        from app.models.plan import Plan
        from app.models.subscription import Subscription
        from app.models.payment import Payment
        from app.models.billing_cycle import BillingCycle
        from app.services.invoice_service import generate_itemized_invoice

        sruthi = db.query(Customer).filter(Customer.email == "sruthipandey@example.com").first()
        pro_plan = db.query(Plan).filter(Plan.name.ilike("%Premium Pro%")).first()
        if not pro_plan:
            pro_plan = db.query(Plan).filter(Plan.is_archived == False).first()

        if sruthi and pro_plan:
            sub = db.query(Subscription).filter(Subscription.customer_id == sruthi.id, Subscription.is_deleted == False).first()
            if not sub:
                sub = Subscription(
                    customer_id=sruthi.id,
                    plan_id=pro_plan.id,
                    start_date=date.today(),
                    end_date=date.today() + timedelta(days=30),
                    next_billing_date=date.today() + timedelta(days=30),
                    status="ACTIVE",
                    platform_source="VELORA_DIRECT"
                )
                db.add(sub)
                db.commit()
                db.refresh(sub)
            else:
                sub.platform_source = "VELORA_DIRECT"
                sub.status = "ACTIVE"
                db.add(sub)
                db.commit()

            pay = db.query(Payment).filter(Payment.customer_id == sruthi.id).first()
            if not pay:
                pay = Payment(
                    customer_id=sruthi.id,
                    subscription_id=sub.id,
                    amount=2360.0,
                    payment_method="Velora Wallet",
                    transaction_id="TXN_VEL_SRUTHI_101",
                    payment_status="SUCCESS",
                    platform_source="VELORA_DIRECT"
                )
                db.add(pay)
                db.commit()
            else:
                pay.transaction_id = "TXN_VEL_SRUTHI_101"
                pay.subscription_id = sub.id
                db.add(pay)
                db.commit()

            inv = db.query(Invoice).filter(Invoice.subscription_id == sub.id).first()
            if not inv:
                inv = generate_itemized_invoice(
                    db=db,
                    subscription_id=sub.id,
                    proration_credit=0.0,
                    proration_debit=0.0,
                    tax_rate=0.18,
                    remarks="Itemized Recurring Billing Cycle Invoice for Premium Pro Plan"
                )
            if inv:
                inv.platform_source = "VELORA_DIRECT"
                inv.status = "PAID"
                db.add(inv)
                db.commit()

            bc = db.query(BillingCycle).filter(BillingCycle.subscription_id == sub.id).first()
            if not bc:
                bc = BillingCycle(
                    subscription_id=sub.id,
                    billing_start_date=date.today(),
                    billing_end_date=date.today() + timedelta(days=30),
                    renewal_date=date.today() + timedelta(days=30),
                    next_billing_date=date.today() + timedelta(days=30),
                    cycle_status="ACTIVE (AUTOMATED)",
                    is_processed=True
                )
                db.add(bc)
                db.commit()

            from app.models.notification import Notification
            notif = db.query(Notification).filter(Notification.customer_id == sruthi.id).first()
            if not notif:
                n1 = Notification(
                    customer_id=sruthi.id,
                    notification_type="SUBSCRIPTION_ACTIVATED",
                    message="Your Velora Merchant subscription for Premium Pro Plan has been activated successfully.",
                    sent_date=date.today(),
                    status="SENT",
                    delivery_channel="EMAIL",
                    is_read=False,
                    is_deleted=False
                )
                n2 = Notification(
                    customer_id=sruthi.id,
                    notification_type="INVOICE_GENERATED",
                    message="Itemized invoice INV-2026-VEL-1001 for ₹2,360.00 (incl. 18% GST) generated.",
                    sent_date=date.today(),
                    status="SENT",
                    delivery_channel="EMAIL",
                    is_read=False,
                    is_deleted=False
                )
                n3 = Notification(
                    customer_id=sruthi.id,
                    notification_type="PAYMENT_RECEIVED",
                    message="Payment transaction TXN_VEL_SRUTHI_101 of ₹2,360.00 via Velora Wallet completed successfully.",
                    sent_date=date.today(),
                    status="SENT",
                    delivery_channel="EMAIL",
                    is_read=True,
                    is_deleted=False
                )
                db.add_all([n1, n2, n3])
                db.commit()
    except Exception as e:
        print(f"Sruthi pandey seed notice: {e}")


import random
import re
from app.services.notification_service import send_smart_email


def validate_country_phone_number(phone_number: str, country: str = "India"):
    if not phone_number or not str(phone_number).strip():
        raise ValueError("Phone number is required.")
    
    clean_phone = re.sub(r"[^\d+]", "", str(phone_number).strip())
    digits_only = re.sub(r"\D", "", clean_phone)
    
    # 1. Block Dummy Repeated / Sequential Digits
    if len(set(digits_only)) == 1 or digits_only in ["1234567890", "0123456789", "9876543210", "123456789"]:
        raise ValueError("Please enter a valid, original phone number (dummy repeated/sequential numbers like 1234567890 or 0000000000 are not allowed).")
    
    is_india = ("INDIA" in str(country or "India").upper()) or clean_phone.startswith("+91") or (not clean_phone.startswith("+") and len(digits_only) == 10)
    
    if is_india:
        # India Rule: Must be 10 digits starting with 6, 7, 8, or 9 (with optional +91)
        india_digits = digits_only[2:] if clean_phone.startswith("+91") else digits_only
        
        if len(india_digits) != 10 or india_digits[0] not in ["6", "7", "8", "9"]:
            raise ValueError("For India, phone number must be a valid 10-digit mobile number starting with 6, 7, 8, or 9 (with optional +91 country code).")
    else:
        # International Rule: Must start with '+' valid country code and contain 10-15 digits
        if not clean_phone.startswith("+"):
            raise ValueError("For international numbers outside India, please include a valid country code starting with '+' (e.g. +1 for US, +44 for UK, +971 for UAE).")
        if len(digits_only) < 10 or len(digits_only) > 15:
            raise ValueError("Please enter a valid international phone number with a recognized country code.")


def register_customer(db: Session, reg_data: CustomerRegister):
    # Country-Specific Phone Validation Rule
    validate_country_phone_number(reg_data.phone_number, reg_data.country or "India")

    # Block Disposable / Fake Domains
    disposable_domains = ["example.com", "test.com", "dummy.com", "mailinator.com", "tempmail.com", "dispostable.com", "email.com", "yopmail.com", "guerrillamail.com"]
    email_domain = reg_data.email.split("@")[-1].lower() if "@" in reg_data.email else ""
    if email_domain in disposable_domains:
        raise ValueError("Please register using a valid personal or business email address (e.g. Gmail, Outlook, Yahoo, or your custom domain).")

    existing_email = (
        db.query(Customer)
        .filter(Customer.email == reg_data.email, Customer.is_deleted == False)
        .first()
    )
    if existing_email:
        raise ValueError("Customer email is already registered.")

    existing_phone = (
        db.query(Customer)
        .filter(Customer.phone_number == reg_data.phone_number, Customer.is_deleted == False)
        .first()
    )
    if existing_phone:
        raise ValueError("Customer phone number is already registered.")

    raw_source = getattr(reg_data, "platform_source", None) or "NEXORA_DIRECT"
    if str(raw_source).upper() in ["VELORA", "VELORA_DIRECT"]:
        platform_src = "VELORA_DIRECT"
    else:
        platform_src = "NEXORA_DIRECT"

    # Generate 6-Digit OTP with 10-Minute Expiration Validity
    otp_code = f"{random.randint(100000, 999999)}"
    otp_expiry = datetime.utcnow() + timedelta(minutes=10)

    new_customer = Customer(
        full_name=reg_data.username,
        email=reg_data.email,
        phone_number=reg_data.phone_number,
        password=hash_password(reg_data.password),
        country=reg_data.country or "",
        address=reg_data.address or "",
        customer_status="PENDING_VERIFICATION",
        platform_source=platform_src,
        is_verified=False,
        verification_otp=otp_code,
        otp_expires_at=otp_expiry
    )

    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)

    create_audit_log(
        db,
        AuditLogCreate(
            event="Customer Registered",
            performed_by="Customer Self-Service",
            customer_id=new_customer.id,
            description=f"Subscriber '{new_customer.full_name}' registered on platform '{new_customer.platform_source}' (Pending OTP Verification)."
        )
    )

    # Dispatch Branded HTML OTP Email (Valid for 10 minutes)
    try:
        platform_brand = "VELORA" if "VELORA" in platform_src else "NEXORA"
        brand_title = "Velora Fintech" if "VELORA" in platform_src else "Nexora Billing"
        send_smart_email(
            to_email=new_customer.email,
            customer_name=new_customer.full_name,
            subject=f"{brand_title} Account Security Verification Code: {otp_code}",
            template_name="subscription_lifecycle.html",
            context={
                "platform_title": brand_title,
                "status": "PENDING_OTP_VERIFICATION",
                "event_description": f"Your 6-Digit Account Security Verification OTP Code is: {otp_code} (Valid for 10 minutes).",
                "effective_date": str(date.today()),
                "message": f"Your 6-digit Account Security Verification OTP is: {otp_code}. This verification code is valid for 10 minutes.",
                "otp_code": otp_code,
                "plan_name": f"{brand_title} Registration Activation",
                "invoice_number": f"VERIFY-{new_customer.id}",
                "transaction_id": f"OTP-{otp_code}",
                "payment_date": str(date.today()),
                "payment_method": "Security OTP",
                "amount": "0.00"
            },
            platform=platform_brand
        )
    except Exception as email_err:
        print(f"OTP email dispatch notice: {email_err}")

    return {
        "status": "REQUIRES_OTP",
        "message": "Verification OTP sent to your email address (Valid for 10 minutes).",
        "email": new_customer.email,
        "customer_id": new_customer.id,
        "platform_source": new_customer.platform_source
    }


def verify_customer_otp(db: Session, email: str, otp_code: str):
    customer = (
        db.query(Customer)
        .filter(Customer.email == email, Customer.is_deleted == False)
        .first()
    )
    if not customer:
        raise ValueError("No customer account found with this email address.")

    if not customer.verification_otp or customer.verification_otp != str(otp_code).strip():
        raise ValueError("Invalid verification code. Please check your email inbox and try again.")

    if customer.otp_expires_at and datetime.utcnow() > customer.otp_expires_at:
        raise ValueError("Verification code has expired (10 minutes limit). Please click Resend Code to receive a new OTP.")

    customer.is_verified = True
    customer.customer_status = "ACTIVE"
    customer.verification_otp = None
    customer.otp_expires_at = None

    db.commit()
    db.refresh(customer)

    create_audit_log(
        db,
        AuditLogCreate(
            event="Customer Verified",
            performed_by="Customer Self-Service OTP",
            customer_id=customer.id,
            description=f"Subscriber '{customer.full_name}' successfully verified email via 10-minute OTP."
        )
    )

    token = create_access_token(
        {
            "sub": customer.email,
            "customer_id": customer.id,
            "role": "CUSTOMER"
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "customer_id": customer.id,
        "full_name": customer.full_name,
        "email": customer.email,
        "role": "CUSTOMER",
        "platform_source": customer.platform_source
    }