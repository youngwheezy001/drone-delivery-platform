from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.database import Base
import uuid

class User(Base):
    """
    Enterprise-grade User Model for RBAC (Role-Based Access Control).
    Tracks authentication details and organizational ownership.
    """
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    
    # Professional RBAC Fields
    company_id = Column(String, index=True, default="Megascript Digital")
    role = Column(String, default="OPERATOR") # ADMIN, OPERATOR, PILOT, SELLER, CUSTOMER
    region = Column(String, default="NAIROBI_CENTRAL")
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_prime = Column(Boolean, default=False)
    tustar_tokens = Column(Integer, default=0)
    
    # Phase 10: B2B Enterprise
    api_key = Column(String(255), nullable=True)
    webhook_url = Column(String(255), nullable=True)
    
    # Phase 11: Decentralized Franchising
    is_franchise = Column(Boolean, default=False)
    franchise_earnings = Column(Float, default=0.0)
    
    # Notifications
    expo_push_token = Column(String(255), nullable=True)
    
    # 🔴 GEOSPATIAL METADATA (For HUB Mapping)
    latitude = Column(String, default="-1.2921") # Default to Nairobi HQ
    longitude = Column(String, default="36.7884")
    
    # 🔗 RELATIONSHIPS
    products = relationship("Product", back_populates="seller", cascade="all, delete-orphan")
    deliveries = relationship("DeliveryRecord", primaryjoin="User.company_id == DeliveryRecord.company_id", foreign_keys="DeliveryRecord.company_id", viewonly=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), onupdate=func.now())
