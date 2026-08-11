from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.database import get_db
from app.schemas.tax import (
    TaxMasterCreate,
    TaxMasterResponse,
    TaxCalculateRequest,
    TaxCalculateResponse,
    TaxReportResponse
)
from app.services.tax_service import (
    get_tax_rules,
    create_tax_rule,
    update_tax_rule,
    calculate_tax_for_customer,
    generate_tax_reports
)

router = APIRouter(
    prefix="/tax",
    tags=["Tax Calculation Module"]
)


@router.get("/master", response_model=List[TaxMasterResponse], summary="View Active Tax Master Rules")
def read_tax_master(db: Session = Depends(get_db)):
    """Retrieve all active region and country-based tax rate rules from Tax Master."""
    return get_tax_rules(db)


@router.post("/master", response_model=TaxMasterResponse, summary="Create New Tax Master Rule")
def add_tax_master(tax_in: TaxMasterCreate, db: Session = Depends(get_db)):
    """Add a new country or state-specific tax rule to Tax Master."""
    return create_tax_rule(db, tax_in)


@router.put("/master/{tax_id}", response_model=TaxMasterResponse, summary="Update Tax Master Rule")
def edit_tax_master(tax_id: int, tax_in: TaxMasterCreate, db: Session = Depends(get_db)):
    """Update an existing tax rule in Tax Master."""
    rule = update_tax_rule(db, tax_id, tax_in)
    if not rule:
        raise HTTPException(status_code=404, detail="Tax rule not found.")
    return rule


@router.post("/calculate", response_model=TaxCalculateResponse, summary="Calculate Tax for Customer")
def calculate_tax(req: TaxCalculateRequest, db: Session = Depends(get_db)):
    """Calculates region-based tax and total invoice amount for a customer and subtotal."""
    return calculate_tax_for_customer(db, customer_id=req.customer_id, subtotal=req.subtotal)


@router.get("/reports", response_model=TaxReportResponse, summary="Admin Tax Collection Reports")
def read_tax_reports(
    period: str = Query("monthly", description="Report period: daily, weekly, monthly, yearly"),
    country: Optional[str] = Query(None, description="Optional country filter (e.g., India, UAE, USA)"),
    db: Session = Depends(get_db)
):
    """Retrieve admin tax collection reports grouped by country, state, and plan."""
    return generate_tax_reports(db, period=period, country_filter=country)
