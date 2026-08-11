from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.database.database import get_db
from app.schemas.invoice import InvoiceCreate, InvoiceResponse
from app.schemas.invoice_line_item import InvoiceLineItemResponse
from app.services.invoice_service import (
    create_invoice,
    generate_itemized_invoice,
    get_all_invoices,
    get_invoices_by_customer,
    get_invoice_by_id,
    get_invoice_line_items,
    delete_invoice,
    generate_invoice_html,
)


router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"]
)


@router.post("/", response_model=InvoiceResponse)
def create_new_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    return create_invoice(db, invoice)


@router.post("/generate-itemized", response_model=InvoiceResponse)
def generate_itemized_invoice_endpoint(
    subscription_id: int,
    proration_credit: float = 0.0,
    proration_debit: float = 0.0,
    usage_charge: float = 0.0,
    discount_amount: float = 0.0,
    tax_rate: float = 0.18,
    remarks: str = "Billing Cycle Itemized Invoice",
    previous_plan_name: Optional[str] = None,
    previous_plan_price: float = 0.0,
    remaining_days: int = 10,
    total_cycle_days: int = 30,
    db: Session = Depends(get_db),
):
    try:
        return generate_itemized_invoice(
            db=db,
            subscription_id=subscription_id,
            proration_credit=proration_credit,
            proration_debit=proration_debit,
            usage_charge=usage_charge,
            discount_amount=discount_amount,
            tax_rate=tax_rate,
            remarks=remarks,
            previous_plan_name=previous_plan_name,
            previous_plan_price=previous_plan_price,
            remaining_days=remaining_days,
            total_cycle_days=total_cycle_days,
        )
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))


@router.get("/", response_model=list[InvoiceResponse])
def read_all_invoices(
    db: Session = Depends(get_db)
):
    return get_all_invoices(db)


@router.get("/customer/{customer_id}", response_model=list[InvoiceResponse])
def read_invoices_by_customer(customer_id: int, db: Session = Depends(get_db)):
    return get_invoices_by_customer(db, customer_id)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def read_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = get_invoice_by_id(db, invoice_id)

    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return invoice


@router.get("/{invoice_id}/download", response_class=HTMLResponse)
def download_invoice_html(invoice_id: int, platform: Optional[str] = None, db: Session = Depends(get_db)):
    invoice = get_invoice_by_id(db, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    html_content = generate_invoice_html(invoice, platform=platform)
    return HTMLResponse(content=html_content, status_code=200)


@router.get("/{invoice_id}/line-items", response_model=list[InvoiceLineItemResponse])
def read_invoice_line_items(invoice_id: int, db: Session = Depends(get_db)):
    invoice = get_invoice_by_id(db, invoice_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return get_invoice_line_items(db, invoice_id)


@router.delete("/{invoice_id}", response_model=InvoiceResponse)
def remove_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = delete_invoice(db, invoice_id)

    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return invoice