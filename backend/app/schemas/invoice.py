from datetime import date

from pydantic import BaseModel


class InvoiceBase(BaseModel):
    subscription_id: int
    invoice_number: str
    amount: float
    issue_date: date
    due_date: date
    status: str
    remarks: str

class InvoiceCreate(InvoiceBase):
    pass


class InvoiceResponse(InvoiceBase):
    id: int

    class Config:
        from_attributes = True