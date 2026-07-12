from sqlalchemy import Column, Integer, String, DateTime
from backend.app.database.database import Base
from datetime import datetime


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    event = Column(
        String(100),
        nullable=False
    )

    performed_by = Column(
        String(100),
        nullable=False
    )

    description = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )