from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey, Boolean
from backend.app.database.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)

    subscription_id = Column(
        Integer,
        ForeignKey("subscriptions.id"),
        nullable=False
    )

    invoice_number = Column(
        String(50),
        unique=True,
        nullable=False
    )

    amount = Column(
        Float,
        nullable=False
    )

    issue_date = Column(
        Date,
        nullable=False
    )

    due_date = Column(
        Date,
        nullable=False
    )

    status = Column(
        String(20),
        default="PENDING",
        nullable=False
    )

    payment_date = Column(
        Date
    )

    remarks = Column(
        String(255)
    )

    is_deleted = Column(
        Boolean,
        default=False
    )