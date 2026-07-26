from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean, Enum, DateTime
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime
import enum


class SubscriptionStatus(str, enum.Enum):
    TRIAL = "TRIAL"
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELLED = "CANCELLED"
    PAUSED = "PAUSED"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False
    )

    plan_id = Column(
        Integer,
        ForeignKey("plans.id"),
        nullable=False
    )

    start_date = Column(
        Date,
        nullable=False
    )

    end_date = Column(
        Date,
        nullable=False
    )

    next_billing_date = Column(
        Date,
        nullable=False
    )

    status = Column(
        Enum(SubscriptionStatus),
        default=SubscriptionStatus.TRIAL,
        nullable=False
    )
    
    trial_started_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    activated_at = Column(
        DateTime,
        nullable=True
    )

    past_due_at = Column(
        DateTime,
        nullable=True
    )

    cancelled_at = Column(
        DateTime,
        nullable=True
    )

    pause_date = Column(
        DateTime,
        nullable=True
    )

    auto_renew = Column(
        Boolean,
        default=True,
    )
    cancel_at_period_end = Column(
        Boolean,
        default=False
    )

    is_deleted = Column(
        Boolean,
        default=False
    )

    customer = relationship("Customer", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    invoices = relationship("Invoice", back_populates="subscription", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="subscription", cascade="all, delete-orphan")
    billing_cycles = relationship("BillingCycle", back_populates="subscription", cascade="all, delete-orphan")