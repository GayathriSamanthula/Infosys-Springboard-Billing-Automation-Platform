from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException
from typing import Optional

from app.models.customer import Customer
from app.models.subscription import Subscription
from app.models.invoice import Invoice
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.schemas.audit_log import AuditLogCreate
from app.services.audit_log_service import create_audit_log


def create_customer(db: Session, customer: CustomerCreate):

    db_customer = Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number,
        country=customer.country,
        address=customer.address,
        customer_status=customer.customer_status or "ACTIVE",
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

    return query.order_by(Customer.id.desc()).offset(skip).limit(limit).all()
    
    
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