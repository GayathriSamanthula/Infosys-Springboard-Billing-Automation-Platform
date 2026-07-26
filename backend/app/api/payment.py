from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentProcessRequest,
    PaymentProcessResponse,
)
from app.services.payment_service import (
    create_payment,
    get_all_payments,
    get_payment_by_id,
    delete_payment,
    process_payment,
    retry_failed_payment,
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


@router.post(
    "/process",
    response_model=PaymentProcessResponse,
)
def process_payment_request(
    request: PaymentProcessRequest,
    db: Session = Depends(get_db),
):
    result = process_payment(
        db=db,
        request=request,
    )

    return result["gateway_response"]


@router.post("/{payment_id}/retry")
def retry_payment_request(
    payment_id: int,
    db: Session = Depends(get_db),
):
    """
    M8 Gap Endpoint: Retry a failed payment attempt through Mock Payment Gateway.
    """
    return retry_failed_payment(db=db, payment_id=payment_id)