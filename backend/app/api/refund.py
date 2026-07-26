from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.schemas.refund import RefundRequest, RefundResponse
from app.services.refund_service import process_subscription_refund, get_all_refunds

router = APIRouter(
    prefix="/refunds",
    tags=["Refunds"]
)


@router.post("/process", response_model=RefundResponse)
def process_refund(
    request: RefundRequest,
    db: Session = Depends(get_db)
):
    try:
        return process_subscription_refund(db, request)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@router.get("/history", response_model=list[RefundResponse])
def read_refund_history(
    db: Session = Depends(get_db)
):
    return get_all_refunds(db)
