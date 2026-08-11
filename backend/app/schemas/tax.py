from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date


class TaxMasterBase(BaseModel):
    country: str
    state: Optional[str] = "ALL"
    tax_name: str
    tax_percentage: float
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    is_active: bool = True


class TaxMasterCreate(TaxMasterBase):
    pass


class TaxMasterResponse(TaxMasterBase):
    id: int

    class Config:
        from_attributes = True


class TaxCalculateRequest(BaseModel):
    customer_id: int
    subtotal: float


class TaxCalculateResponse(BaseModel):
    customer_id: int
    customer_name: str
    country: str
    state: Optional[str] = "ALL"
    subtotal: float
    tax_name: str
    tax_percentage: float
    tax_amount: float
    grand_total: float


class TaxReportResponse(BaseModel):
    total_tax_collected: float
    total_invoices_taxed: int
    period: str
    country_breakdown: List[Dict[str, Any]]
    state_breakdown: List[Dict[str, Any]]
    plan_breakdown: List[Dict[str, Any]]
    customer_breakdown: List[Dict[str, Any]]
    payment_method_breakdown: List[Dict[str, Any]]
