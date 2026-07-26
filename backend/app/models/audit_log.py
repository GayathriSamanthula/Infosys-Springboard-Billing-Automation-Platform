from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base
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

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=True
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

    user = relationship("User", back_populates="audit_logs")
    customer = relationship("Customer", back_populates="audit_logs")