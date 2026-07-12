from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.schemas.payment import PaymentCreate, PaymentResponse
from backend.app.services.payment_service import (
    create_payment,
    get_all_payments,
    get_payment_by_id,
    delete_payment,
)

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


@router.post("/", response_model=PaymentResponse)
def create_new_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db)
):
    return create_payment(db, payment)


@router.get("/", response_model=list[PaymentResponse])
def read_all_payments(
    db: Session = Depends(get_db)
):
    return get_all_payments(db)


@router.get("/{payment_id}", response_model=PaymentResponse)
def read_payment(
    payment_id: int,
    db: Session = Depends(get_db)
):
    payment = get_payment_by_id(db, payment_id)

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return payment


@router.delete("/{payment_id}")
def remove_payment(
    payment_id: int,
    db: Session = Depends(get_db)
):
    payment = delete_payment(db, payment_id)

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return {
        "message": "Payment deleted successfully"
    }