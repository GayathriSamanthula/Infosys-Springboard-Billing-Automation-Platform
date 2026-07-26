from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional

from app.models.plan import Plan
from app.schemas.plan import PlanCreate, PlanUpdate
from app.services.audit_log_service import create_audit_log
from app.schemas.audit_log import AuditLogCreate


def create_plan(db: Session, plan: PlanCreate):
    billing_cycle = (plan.billing_cycle or "").strip().upper()
    if billing_cycle not in ["MONTHLY", "YEARLY", "ANNUAL"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid billing cycle interval. Supported values are: MONTHLY, YEARLY"
        )

    db_plan = Plan(
        name=plan.name,
        description=plan.description,
        price=plan.price,
        billing_cycle=billing_cycle,
        trial_period_days=plan.trial_period_days or 0,
        features=plan.features,
        status=plan.status or "ACTIVE"
    )

    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    create_audit_log(
        db,
        AuditLogCreate(
            event="Plan Created",
            performed_by="System",
            description=f"Plan '{db_plan.name}' was created."
        )
    )

    return db_plan


def get_all_plans(db: Session, status: Optional[str] = None, include_archived: bool = False):
    query = db.query(Plan).filter(Plan.is_deleted == False)

    if not include_archived and status != "ARCHIVED":
        query = query.filter(Plan.is_archived == False)

    if status:
        query = query.filter(Plan.status == status)

    return query.order_by(Plan.id.desc()).all()


def get_plan_by_id(db: Session, plan_id: int):
    plan = (
        db.query(Plan)
        .filter(
            Plan.id == plan_id,
            Plan.is_deleted == False
        )
        .first()
    )

    if not plan:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )

    return plan


def update_plan(db: Session, plan_id: int, plan: PlanUpdate):
    existing_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.is_deleted == False).first()

    if not existing_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if plan.billing_cycle is not None:
        billing_cycle = plan.billing_cycle.strip().upper()
        if billing_cycle not in ["MONTHLY", "YEARLY", "ANNUAL"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid billing cycle interval. Supported values are: MONTHLY, YEARLY"
            )
        existing_plan.billing_cycle = billing_cycle

    if plan.name is not None:
        existing_plan.name = plan.name
    if plan.description is not None:
        existing_plan.description = plan.description
    if plan.price is not None:
        existing_plan.price = plan.price
    if plan.trial_period_days is not None:
        existing_plan.trial_period_days = plan.trial_period_days
    if plan.features is not None:
        existing_plan.features = plan.features
    if plan.status is not None:
        existing_plan.status = plan.status

    db.commit()
    db.refresh(existing_plan)
    create_audit_log(
        db,
        AuditLogCreate(
            event="PLAN_UPDATED",
            performed_by="SYSTEM",
            description=f"Plan '{existing_plan.name}' was updated."
        )
    )

    return existing_plan


def delete_plan(db: Session, plan_id: int):
    existing_plan = db.query(Plan).filter(Plan.id == plan_id, Plan.is_deleted == False).first()

    if not existing_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Module 1 requirement: Plans must be archived instead of permanently deleted to preserve existing subscribers
    existing_plan.is_archived = True
    existing_plan.status = "ARCHIVED"
    db.commit()
    db.refresh(existing_plan)

    create_audit_log(
        db,
        AuditLogCreate(
            event="Plan Archived",
            performed_by="System",
            description=f"Plan '{existing_plan.name}' was archived."
        )
    )

    return {"message": "Plan archived successfully", "plan": existing_plan}


def archive_plan(db: Session, plan_id: int):
    existing_plan = (
        db.query(Plan)
        .filter(
            Plan.id == plan_id,
            Plan.is_deleted == False
        )
        .first()
    )

    if not existing_plan:
        raise HTTPException(
            status_code=404,
            detail="Plan not found"
        )

    existing_plan.is_archived = True
    existing_plan.status = "ARCHIVED"

    db.commit()
    db.refresh(existing_plan)
    create_audit_log(
        db,
        AuditLogCreate(
            event="Plan Archived",
            performed_by="System",
            description=f"Plan '{existing_plan.name}' was archived."
        )
    )

    return existing_plan