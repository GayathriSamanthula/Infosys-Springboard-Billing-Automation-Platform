from fastapi import APIRouter, Depends, HTTPException
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schemas.billing_cycle import (
    BillingCycleCreate,
    BillingCycleResponse,
)
from app.services.billing_cycle_service import (
    create_billing_cycle,
    get_all_billing_cycles,
    get_billing_cycle,
    delete_billing_cycle,
    generate_due_invoices,
)

router = APIRouter(
    prefix="/billing-cycles",
    tags=["Billing Cycles"]
)


@router.get("/", response_model=list[BillingCycleResponse])
def read_all_billing_cycles(db: Session = Depends(get_db)):
    return get_all_billing_cycles(db)


@router.post("/", response_model=BillingCycleResponse)
def create_new_billing_cycle(
    billing_cycle: BillingCycleCreate,
    db: Session = Depends(get_db),
):
    return create_billing_cycle(db, billing_cycle)


@router.get("/{billing_cycle_id}", response_model=BillingCycleResponse)
def read_billing_cycle(
    billing_cycle_id: int,
    db: Session = Depends(get_db),
):
    billing_cycle = get_billing_cycle(db, billing_cycle_id)

    if billing_cycle is None:
        raise HTTPException(status_code=404, detail="Billing cycle not found")

    return billing_cycle


@router.delete("/{billing_cycle_id}")
def remove_billing_cycle(
    billing_cycle_id: int,
    db: Session = Depends(get_db),
):
    billing_cycle = delete_billing_cycle(db, billing_cycle_id)

    if billing_cycle is None:
        raise HTTPException(status_code=404, detail="Billing cycle not found")

    return {"message": "Billing cycle deleted successfully"}


@router.post("/run")
def run_billing(db: Session = Depends(get_db)):
    result = generate_due_invoices(db)
    return result