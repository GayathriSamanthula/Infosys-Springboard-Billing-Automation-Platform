from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database.database import get_db
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.services.customer_service import (
    create_customer,
    get_all_customers,
    get_customer_by_id,
    get_customer_history,
    update_customer,
    delete_customer
)

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)



@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED
)
def create_new_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db)
):
    return create_customer(db, customer)


@router.get(
    "/",
    response_model=List[CustomerResponse]
)
def get_customers(
    db: Session = Depends(get_db)
):
    return get_all_customers(db)


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    return get_customer_by_id(db, customer_id)


@router.get(
    "/{customer_id}/history"
)
def get_customer_activity_history(
    customer_id: int,
    db: Session = Depends(get_db)
):
    return get_customer_history(db, customer_id)


@router.put(
    "/{customer_id}",
    response_model=CustomerResponse
)
def update_existing_customer(
    customer_id: int,
    customer: CustomerUpdate,
    db: Session = Depends(get_db)
):
    return update_customer(db, customer_id, customer)


@router.delete("/{customer_id}")
def remove_customer(
    customer_id: int,
    db: Session = Depends(get_db)
):
    return delete_customer(db, customer_id)
