from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.sql import func
from app.models.database import Base
import uuid

class KCAALog(Base):
    """
    Automated KCAA Compliance Logging Module.
    Strict, immutable audit log for regulatory compliance.
    Records every flight path event, altitude change, and operator intervention.
    """
    __tablename__ = "kcaa_logs"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: f"KCAA-{str(uuid.uuid4())[:8].upper()}")
    delivery_id = Column(String, index=True, nullable=False)
    
    # Event Types: TAKEOFF, WAYPOINT, EMERGENCY, LANDING, INTERVENTION
    event_type = Column(String, nullable=False)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude_m = Column(Float, nullable=False)
    
    # Additional context for emergency triggers or interventions
    details = Column(String, nullable=True)

    timestamp = Column(DateTime(timezone=True), server_default=func.now())
