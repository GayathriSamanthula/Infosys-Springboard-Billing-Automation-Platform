from sqlalchemy import Column, Integer, String, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False
    )

    notification_type = Column(
        String(50),
        nullable=False
    )

    message = Column(
        String(255),
        nullable=False
    )

    sent_date = Column(
        Date,
        nullable=False
    )

    status = Column(
        String(20),
        default="PENDING",
        nullable=False
    )

    delivery_channel = Column(
        String(30)
    )

    is_read = Column(
        Boolean,
        default=False
    )

    is_deleted = Column(
        Boolean,
        default=False
    )

    customer = relationship("Customer", back_populates="notifications")