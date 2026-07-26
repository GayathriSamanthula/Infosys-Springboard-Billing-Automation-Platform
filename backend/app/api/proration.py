from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app.services.proration_service import ProrationService

from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.plan import Plan
from app.models.subscription import Subscription

from app.schemas.proration import (
    ProrationRequest,
    ProrationResponse,
)

router = APIRouter(
    prefix="/proration",
    tags=["Proration"]
)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "/calculate",
    response_model=ProrationResponse
)
def calculate_proration(
    request: ProrationRequest,
    db: Session = Depends(get_db)
):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == request.subscription_id,
            Subscription.is_deleted == False
        )
        .first()
    )

    if subscription is None:
        raise HTTPException(
            status_code=404,
            detail="Subscription not found."
        )

    current_plan = (
        db.query(Plan)
        .filter(
            Plan.id == subscription.plan_id,
            Plan.is_deleted == False
        )
        .first()
    )

    if current_plan is None:
        raise HTTPException(
            status_code=404,
            detail="Current subscription plan not found."
        )

    new_plan = (
        db.query(Plan)
        .filter(
            Plan.id == request.new_plan_id,
            Plan.is_deleted == False
        )
        .first()
    )

    if new_plan is None:
        raise HTTPException(
            status_code=404,
            detail="Requested plan not found."
        )

    if current_plan.id == new_plan.id:
        raise HTTPException(
            status_code=400,
            detail="Subscription is already using the selected plan."
        )

    try:
        proration_result = ProrationService.calculate_proration(
            current_plan_price=current_plan.price,
            new_plan_price=new_plan.price,
            billing_start_date=subscription.start_date,
            billing_end_date=subscription.end_date,
            plan_change_date=date.today()
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    return ProrationResponse(
        total_cycle_days=proration_result.total_cycle_days,
        used_days=proration_result.used_days,
        remaining_days=proration_result.remaining_days,
        current_plan_credit=proration_result.current_plan_credit,
        new_plan_charge=proration_result.new_plan_charge,
        final_amount=proration_result.final_amount,
        change_type=proration_result.change_type,
    )