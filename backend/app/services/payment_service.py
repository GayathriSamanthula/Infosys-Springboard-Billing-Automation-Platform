from sqlalchemy.orm import Session

from backend.app.models.payment import Payment
from backend.app.schemas.payment import PaymentCreate


def create_payment(db: Session, payment: PaymentCreate):
    db_payment = Payment(**payment.model_dump())

    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)

    return db_payment


def get_all_payments(db: Session):
    return (
        db.query(Payment)
        .filter(Payment.is_deleted == False)
        .all()
    )


def get_payment_by_id(db: Session, payment_id: int):
    return (
        db.query(Payment)
        .filter(
            Payment.id == payment_id,
            Payment.is_deleted == False
        )
        .first()
    )


def delete_payment(db: Session, payment_id: int):
    payment = (
        db.query(Payment)
        .filter(
            Payment.id == payment_id,
            Payment.is_deleted == False
        )
        .first()
    )

    if payment:
        payment.is_deleted = True
        db.commit()
        db.refresh(payment)

    return payment
