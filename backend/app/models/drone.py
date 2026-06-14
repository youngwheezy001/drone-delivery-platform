from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.models.database import Base
import uuid

class Drone(Base):
    """
    Strategic Fleet Persistence Model.
    Tracks UAV positioning, hub assignment, and operational health.
    """
    __tablename__ = "drones"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: f"UAV-{str(uuid.uuid4())[:8].upper()}")
    current_hub_id = Column(String, index=True, nullable=True) # SELLER's company_id
    status = Column(String, default="IDLE") # IDLE, EN_ROUTE, REBALANCING, CHARGING, MAINTENANCE
    
    # Telemetry Persistence
    latitude = Column(Float, default=-1.2921)
    longitude = Column(Float, default=36.7884)
    
    # Phase 1 PostGIS Migration
    # location = Column(Geometry(geometry_type='POINT', srid=4326))
    
    flight_hours = Column(Float, default=0.0)
    
    # Phase 13: Cell Health AI
    battery_health_pct = Column(Float, default=100.0)
    
    # KCAA Aviation Compliance
    flight_hours_since_maintenance = Column(Float, default=0.0)
    distance_flown_km = Column(Float, default=0.0)
    needs_maintenance = Column(Boolean, default=False)
    maintenance_due_date = Column(DateTime(timezone=True), nullable=True)
    
    is_active = Column(Boolean, default=True)
    last_ping = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
