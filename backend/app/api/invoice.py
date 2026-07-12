from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import SessionLocal
from backend.app.schemas.invoice import InvoiceCreate, InvoiceResponse
from backend.app.services.invoice_service import (
    create_invoice,
    get_all_invoices,
    get_invoice_by_id,
    delete_invoice,
)


router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=InvoiceResponse)
def create_new_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    return create_invoice(db, invoice)


@router.get("/", response_model=list[InvoiceResponse])
def read_all_invoices(db: Session = Depends(get_db)):
    return get_all_invoices(db)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def read_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = get_invoice_by_id(db, invoice_id)

    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return invoice


@router.delete("/{invoice_id}", response_model=InvoiceResponse)
def remove_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = delete_invoice(db, invoice_id)

    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return invoice