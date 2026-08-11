from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.schemas.retry import (
    RetryConfigResponse,
    RetryConfigCreate,
    RetryQueueResponse,
    RetryProcessResponse
)
from app.services.retry_service import (
    get_retry_configs,
    init_default_retry_configs,
    schedule_retry,
    process_due_retries,
    get_retry_queue
)

router = APIRouter(
    prefix="/retry",
    tags=["Failed Payment Retry Engine"]
)


@router.get("/config", response_model=List[RetryConfigResponse], summary="View Active Retry Schedule Rules")
def read_retry_configs(db: Session = Depends(get_db)):
    """Retrieve active retry schedule configuration rules (Attempt 1: 1d, Attempt 2: 3d, Attempt 3: 7d)."""
    return get_retry_configs(db)


@router.get("/queue", response_model=List[RetryQueueResponse], summary="View Failed Payment Retry Queue")
def read_retry_queue(
    status: Optional[str] = Query(None, description="Filter by status: PENDING, SUCCESS, FAILED, CANCELLED"),
    customer_id: Optional[int] = Query(None, description="Filter by Customer ID"),
    db: Session = Depends(get_db)
):
    """Retrieve all failed payment items queued for background retries."""
    return get_retry_queue(db, status_filter=status, customer_id=customer_id)


@router.post("/schedule", response_model=RetryQueueResponse, summary="Schedule Failed Payment Retry")
def schedule_payment_retry(
    invoice_id: int,
    customer_id: int,
    attempt_number: int = 1,
    db: Session = Depends(get_db)
):
    """Schedules a new retry entry in the queue for a failed payment invoice."""
    entry = schedule_retry(db, invoice_id=invoice_id, customer_id=customer_id, attempt_number=attempt_number)
    if not entry:
        raise HTTPException(status_code=400, detail=f"Failed to schedule retry for attempt #{attempt_number}.")
    return entry


@router.post("/process", response_model=RetryProcessResponse, summary="Execute Due Failed Payment Retries")
def execute_retry_process(db: Session = Depends(get_db)):
    """Executes all due PENDING failed payment retries, updating invoice & subscription statuses."""
    return process_due_retries(db)
