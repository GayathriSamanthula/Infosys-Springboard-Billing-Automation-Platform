from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.pdf_service import generate_invoice_pdf_bytes

router = APIRouter(
    prefix="/invoices",
    tags=["PDF Invoice Generation Module"]
)


@router.get("/{invoice_id}/pdf", summary="Download Official Branded PDF Invoice")
def download_invoice_pdf(
    invoice_id: int,
    platform: str = Query("NEXORA", description="Platform branding: NEXORA or VELORA"),
    db: Session = Depends(get_db)
):
    """Generates and streams a downloadable branded PDF invoice document for the given invoice ID."""
    try:
        pdf_bytes = generate_invoice_pdf_bytes(db, invoice_id=invoice_id, platform=platform)
        filename = f"Invoice_{invoice_id}_{platform.upper()}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {e}")


@router.get("/{invoice_id}/preview", summary="Inline Browser Preview of PDF Invoice")
def preview_invoice_pdf(
    invoice_id: int,
    platform: str = Query("NEXORA", description="Platform branding: NEXORA or VELORA"),
    db: Session = Depends(get_db)
):
    """Streams an inline browser-viewable PDF invoice document."""
    try:
        pdf_bytes = generate_invoice_pdf_bytes(db, invoice_id=invoice_id, platform=platform)
        filename = f"Preview_Invoice_{invoice_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={filename}"
            }
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render PDF preview: {e}")
