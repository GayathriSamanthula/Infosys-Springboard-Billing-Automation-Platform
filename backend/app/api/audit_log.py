from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.schemas.audit_log import AuditLogCreate, AuditLogResponse
from backend.app.services.audit_log_service import (
    create_audit_log,
    get_audit_logs,
    get_audit_log,
    delete_audit_log,
)

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.post("/", response_model=AuditLogResponse)
def create_new_audit_log(audit_log: AuditLogCreate, db: Session = Depends(get_db)):
    return create_audit_log(db, audit_log)


@router.get("/", response_model=list[AuditLogResponse])
def read_audit_logs(db: Session = Depends(get_db)):
    return get_audit_logs(db)


@router.get("/{audit_log_id}", response_model=AuditLogResponse)
def read_audit_log(audit_log_id: int, db: Session = Depends(get_db)):
    audit_log = get_audit_log(db, audit_log_id)
    if not audit_log:
        raise HTTPException(status_code=404, detail="Audit Log not found")
    return audit_log


@router.delete("/{audit_log_id}")
def remove_audit_log(audit_log_id: int, db: Session = Depends(get_db)):
    audit_log = delete_audit_log(db, audit_log_id)
    if not audit_log:
        raise HTTPException(status_code=404, detail="Audit Log not found")
    return {"message": "Audit Log deleted successfully"}