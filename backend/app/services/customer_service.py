from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.models.customer import Customer
from backend.app.schemas.customer import CustomerCreate
from backend.app.schemas.audit_log import AuditLogCreate
from backend.app.services.audit_log_service import create_audit_log


def create_customer(db: Session, customer: CustomerCreate):
    db_customer = Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number,
        country=customer.country,
        address=customer.address,
    )

    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    create_audit_log(
        db,
        AuditLogCreate(
            event="Customer Created",
            performed_by=str(db_customer.id),
            description=f"Customer '{db_customer.full_name}' was created."
         )
    )

    return db_customer


def get_all_customers(db: Session):
    return (
        db.query(Customer)
        .filter(Customer.is_deleted == False)
        .all()
    )
    
    
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

    
def update_customer(db: Session, customer_id: int, customer):
    existing_customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not existing_customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    existing_customer.full_name = customer.full_name
    existing_customer.email = customer.email
    existing_customer.phone_number = customer.phone_number
    existing_customer.country = customer.country
    existing_customer.address = customer.address
    existing_customer.customer_status = customer.customer_status

    db.commit()
    db.refresh(existing_customer)
    
    create_audit_log(
        db,
        AuditLogCreate(
            event="Customer Updated",
            performed_by=str(existing_customer.id),
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

    db.commit()
    create_audit_log(
        db,
        AuditLogCreate(
            event="Customer Deleted",
            performed_by=str(existing_customer.id),
            description=f"Customer '{existing_customer.full_name}' was deleted."
        )
    )

    return {"message": "Customer deleted successfully"}