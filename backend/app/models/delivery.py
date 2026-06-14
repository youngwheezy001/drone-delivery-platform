from sqlalchemy import Column, String, Float, JSON, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
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
    status = Column(String, default="PREPARING") # PREPARING, SCHEDULED, READY, DISPATCHED, EN_ROUTE, ARRIVED_AT_DROPZONE, DELIVERED, FAILED
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    is_p2p = Column(Boolean, default=False)
    
    # Phase 13: Proof of Delivery
    crypto_signature = Column(String(255), nullable=True)
    
    # Phase 15: Kinetic Airdrop
    is_rugged_terrain = Column(Boolean, default=False)
    
    # Phase 1 PostGIS Migration
    # origin_location = Column(Geometry(geometry_type='POINT', srid=4326))
    # destination_location = Column(Geometry(geometry_type='POINT', srid=4326))
    # flight_path = Column(Geometry(geometry_type='LINESTRING', srid=4326))
    
    package_weight_kg = Column(Float, nullable=False)
    distance_km = Column(Float, nullable=False)
    route_json = Column(JSON, nullable=False) # Saves the array of waypoints
    estimated_cost = Column(Float, default=0.0) # Network yield in KES
    scheduled_at = Column(DateTime(timezone=True), nullable=True) # Future mission timing
    
    # 🔗 RELATIONSHIPS (Strategic Multi-Tenancy)
    seller = relationship("User", primaryjoin="DeliveryRecord.company_id == User.company_id", foreign_keys="DeliveryRecord.company_id", viewonly=True)
    customer = relationship("User", primaryjoin="DeliveryRecord.customer_id == User.id", foreign_keys="DeliveryRecord.customer_id", viewonly=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())