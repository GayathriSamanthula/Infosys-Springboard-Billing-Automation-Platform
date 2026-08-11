from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database.database import Base


class RetryConfiguration(Base):
    """
    Stores configurable retry schedule rules.
    Default Rules:
    - Attempt 1: Retry after 1 day
    - Attempt 2: Retry after 3 days
    - Attempt 3: Retry after 7 days
    """
    __tablename__ = "retry_configurations"

    id = Column(Integer, primary_key=True, index=True)
    retry_attempt = Column(Integer, unique=True, nullable=False, index=True)
    retry_after_days = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class RetryQueue(Base):
    """
    Stores queued failed payment retry attempts waiting for execution.
    """
    __tablename__ = "retry_queue"

    retry_id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    retry_attempt = Column(Integer, nullable=False, default=1)
    scheduled_retry_date = Column(DateTime, nullable=False, index=True)
    actual_retry_date = Column(DateTime, nullable=True)
    retry_status = Column(String, nullable=False, default="PENDING", index=True)  # PENDING, SUCCESS, FAILED, CANCELLED
    failure_reason = Column(String, nullable=True)
    next_retry_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    customer = relationship("Customer", backref="retry_queue_items")
    invoice = relationship("Invoice", backref="retry_queue_items")
