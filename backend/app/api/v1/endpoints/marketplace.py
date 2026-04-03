from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
import uuid

from app.models.database import get_db
from app.models.marketplace import Complaint, PromoCode, Category, Product
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

# --- CUSTOMER SUPPORT & MARKETING ---

class ComplaintCreate(BaseModel):
    subject: str
    description: str

class PromoResponse(BaseModel):
    code: str
    discount_percent: float

@router.post("/complaint")
async def file_complaint(
    request: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Files a professional complaint or feedback report. 🛰️🚨"""
    new_complaint = Complaint(
        customer_id=current_user.email,
        subject=request.subject,
        description=request.description
    )
    db.add(new_complaint)
    await db.commit()
    return {"status": "success", "message": "Feedback submitted. Ticket ID: " + new_complaint.id}

@router.get("/promos", response_model=List[PromoResponse])
async def get_active_promos(db: AsyncSession = Depends(get_db)):
    """Returns all active discount codes for the marketplace."""
    result = await db.execute(select(PromoCode).where(PromoCode.is_active == True))
    promos = result.scalars().all()
    return promos

# --- MERCANTILE AUTONOMY API ---

class ProductCreate(BaseModel):
    category_id: str
    name: str
    description: str
    price: float
    weight_kg: float
    image_url: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    is_trending: Optional[bool] = None
    is_top_performer: Optional[bool] = None
    is_active: Optional[bool] = None

@router.get("/categories", response_model=List[dict])
async def get_all_categories(db: AsyncSession = Depends(get_db)):
    """Fetch all dynamic marketplace categories."""
    result = await db.execute(select(Category))
    return [{"id": c.id, "name": c.name, "icon": c.icon, "color": c.color} for c in result.scalars().all()]

@router.get("/my-inventory")
async def get_seller_inventory(
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Fetch all products owned by the active merchant."""
    result = await db.execute(select(Product).where(Product.seller_id == current_user.id))
    return result.scalars().all()

@router.post("/products")
async def create_product(
    request: ProductCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Sellers can introduce new products to their catalog."""
    new_prod = Product(
        seller_id=current_user.id,
        **request.dict()
    )
    db.add(new_prod)
    await db.commit()
    return new_prod

@router.patch("/products/{prod_id}")
async def update_product(
    prod_id: str,
    request: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sellers can update price, name, or 'Trending' status of their products."""
    result = await db.execute(select(Product).where(Product.id == prod_id, Product.seller_id == current_user.id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found or access denied")
    
    for key, value in request.dict(exclude_unset=True).items():
        setattr(product, key, value)
    
    await db.commit()
    return product
