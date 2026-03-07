from sqlalchemy import Column, String, Float, JSON, DateTime
from sqlalchemy.sql import func
from app.models.database import Base
import uuid

class DeliveryRecord(Base):
    """SQLite Table representation of a drone delivery mission."""
    __tablename__ = "deliveries"
    __table_args__ = {'extend_existing': True} # Fixes the Uvicorn hot-reload crash

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id = Column(String, nullable=False, index=True)
    company_id = Column(String, index=True, default="Megascript Digital") # The Multi-Tenant Lock!
    status = Column(String, default="PENDING")
    
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    
    package_weight_kg = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    route_json = Column(JSON, nullable=False) # Saves the array of waypoints
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())