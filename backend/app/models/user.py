from sqlalchemy import Column, String, Boolean, DateTime
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
    is_active = Column(Boolean, default=True)
    
    # 🔴 GEOSPATIAL METADATA (For HUB Mapping)
    latitude = Column(String, default="-1.2921") # Default to Nairobi HQ
    longitude = Column(String, default="36.7884")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), onupdate=func.now())
