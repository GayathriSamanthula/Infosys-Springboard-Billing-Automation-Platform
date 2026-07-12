from sqlalchemy.orm import Session

from backend.app.models.invoice import Invoice
from backend.app.schemas.invoice import InvoiceCreate


def create_invoice(db: Session, invoice: InvoiceCreate):
    db_invoice = Invoice(**invoice.model_dump())

    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    return db_invoice


def get_all_invoices(db: Session):
    return (
        db.query(Invoice)
        .filter(Invoice.is_deleted == False)
        .all()
    )


def get_invoice_by_id(db: Session, invoice_id: int):
    return (
        db.query(Invoice)
        .filter(
            Invoice.id == invoice_id,
            Invoice.is_deleted == False
        )
        .first()
    )


def delete_invoice(db: Session, invoice_id: int):
    invoice = get_invoice_by_id(db, invoice_id)

    if invoice:
        invoice.is_deleted = True
        db.commit()
        db.refresh(invoice)

    return invoice