from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogCreate


def create_audit_log(db: Session, audit_log: AuditLogCreate):
    db_audit_log = AuditLog(**audit_log.model_dump())
    db.add(db_audit_log)
    db.commit()
    db.refresh(db_audit_log)
    return db_audit_log


def get_audit_logs(db: Session):
    return db.query(AuditLog).order_by(AuditLog.id.desc()).all()


def get_audit_log(db: Session, audit_log_id: int):
    return db.query(AuditLog).filter(AuditLog.id == audit_log_id).first()


def delete_audit_log(db: Session, audit_log_id: int):
    audit_log = db.query(AuditLog).filter(AuditLog.id == audit_log_id).first()
    if audit_log:
        db.delete(audit_log)
        db.commit()
    return audit_log