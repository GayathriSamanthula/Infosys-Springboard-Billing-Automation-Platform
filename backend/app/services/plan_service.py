from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.app.models.plan import Plan
from backend.app.schemas.plan import PlanCreate, PlanResponse
from backend.app.services.audit_log_service import create_audit_log
from backend.app.schemas.audit_log import AuditLogCreate


def create_plan(db: Session, plan: PlanCreate):
    db_plan = Plan(
        name=plan.name,
        description=plan.description,
        price=plan.price,
        billing_cycle=plan.billing_cycle,
        trial_period_days=plan.trial_period_days,
        features=plan.features,
    )

    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    create_audit_log(
        db,
        AuditLogCreate(
            event="PLAN_CREATED",
            performed_by="SYSTEM",
            description=f"Plan '{db_plan.name}' was created."
        )
    )    

    return db_plan

def get_all_plans(db: Session, status: str = None):
    query = db.query(Plan).filter(
        Plan.is_deleted == False,
        Plan.is_archived == False
    )

    if status:
        query = query.filter(Plan.status == status)

    return query.all()

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

def update_plan(db: Session, plan_id: int, plan: PlanCreate):
    existing_plan = db.query(Plan).filter(Plan.id == plan_id).first()

    if not existing_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    existing_plan.name = plan.name
    existing_plan.description = plan.description
    existing_plan.price = plan.price
    existing_plan.billing_cycle = plan.billing_cycle
    existing_plan.trial_period_days = plan.trial_period_days
    existing_plan.features = plan.features

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
    existing_plan = db.query(Plan).filter(Plan.id == plan_id).first()

    if not existing_plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    existing_plan.is_deleted = True

    db.commit()

    return {"message": "Plan deleted successfully"}

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

    db.commit()
    db.refresh(existing_plan)
    create_audit_log(
        db,
        AuditLogCreate(
            event="PLAN_ARCHIVED",
            performed_by="SYSTEM",
            description=f"Plan '{existing_plan.name}' was archived."
        )
    )

    return existing_plan