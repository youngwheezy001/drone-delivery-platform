from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.models.database import Base
import uuid

class Complaint(Base):
    """
    Customer Service Module for handling platform issues.
    Tracks user feedback and hub responses. 🛰️🚨
    """
    __tablename__ = "complaints"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String, index=True, nullable=False)
    subject = Column(String, nullable=False)
    description = Column(String, nullable=False)
    status = Column(String, default="OPEN") # OPEN, IN_REVIEW, RESOLVED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PromoCode(Base):
    """
    Marketing Module for Marketplace discounts.
    Tracks active promo codes and their values. 🛰️🎟️
    """
    __tablename__ = "promos"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String, unique=True, index=True, nullable=False)
    discount_percent = Column(Float, default=10.0)
    is_active = Column(Boolean, default=True)
    expiry_date = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 🔴 NEW: MERCANTILE AUTONOMY MODELS
class Category(Base):
    """
    Dynamic Marketplace Categories (Pharmacy, Pizza, etc.)
    """
    __tablename__ = "categories"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    icon = Column(String, default="grid-outline")
    color = Column(String, default="#ffffff")

class Product(Base):
    """
    Mercantile Product Catalog.
    Owned by a Seller (User).
    """
    __tablename__ = "products"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String, ForeignKey("users.id"), index=True)
    category_id = Column(String, ForeignKey("categories.id"), index=True)
    
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    weight_kg = Column(Float, default=0.5)
    image_url = Column(String)
    
    is_trending = Column(Boolean, default=False)
    is_top_performer = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
