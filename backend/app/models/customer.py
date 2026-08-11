from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    phone_number = Column(String(20), unique=True)
    country = Column(String(60))
    address = Column(String(255))
    password = Column(String(255), nullable=True)
    customer_status = Column(String(20), default="ACTIVE", nullable=False)
    platform_source = Column(String(50), default="NEXORA_DIRECT", nullable=False)
    is_deleted = Column(Boolean, default=False)

    subscriptions = relationship("Subscription", back_populates="customer", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="customer", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="customer", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="customer")