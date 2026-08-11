from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.schemas.plan import PlanCreate, PlanUpdate, PlanResponse
from app.services.plan_service import (
    create_plan,
    get_all_plans,
    get_plan_by_id,
    update_plan,
    delete_plan,
    archive_plan,
)


router = APIRouter(
    prefix="/plans",
    tags=["Plans"]
)


@router.post(
    "/",
    response_model=PlanResponse
)
def create_subscription_plan(
    plan: PlanCreate,
    db: Session = Depends(get_db)
):
    return create_plan(db, plan)


@router.get(
    "/",
    response_model=list[PlanResponse]
)
def get_subscription_plans(
    db: Session = Depends(get_db)
):
    return get_all_plans(db)


@router.get(
    "/{plan_id}",
    response_model=PlanResponse
)
def get_subscription_plan(
    plan_id: int,
    db: Session = Depends(get_db)
):
    return get_plan_by_id(db, plan_id)


@router.put(
    "/{plan_id}",
    response_model=PlanResponse
)
def update_subscription_plan(
    plan_id: int,
    plan: PlanUpdate,
    db: Session = Depends(get_db)
):
    return update_plan(db, plan_id, plan)


@router.delete(
    "/{plan_id}"
)
def delete_subscription_plan(
    plan_id: int,
    db: Session = Depends(get_db)
):
    return delete_plan(db, plan_id)


@router.put(
    "/{plan_id}/archive",
    response_model=PlanResponse
)
def archive_subscription_plan(
    plan_id: int,
    db: Session = Depends(get_db)
):
    return archive_plan(db, plan_id)