from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.models.database import get_db
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

class SellerOnboardRequest(BaseModel):
    company_name: str
    business_type: str
    contact_phone: str

@router.post("/onboard")
async def onboard_seller(
    request: SellerOnboardRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Onboards a registered user as a Seller/Merchant.
    Updates the user's role to SELLER and sets their company identity.
    """
    if current_user.role == "SELLER":
        # Already a seller, update details
        current_user.company_id = request.company_name
        # In a real app, we might have a separate SellerProfile model
    else:
        current_user.role = "SELLER"
        current_user.company_id = request.company_name

    await db.commit()
    await db.refresh(current_user)
    
    return {
        "status": "success",
        "message": f"Welcome {request.company_name} to the Drone Logistics Network!",
        "role": current_user.role
    }
