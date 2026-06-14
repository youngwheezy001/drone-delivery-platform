from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
import uuid
from .database import Base

class KCAAFlightLog(Base):
    __tablename__ = "kcaa_flight_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    drone_id = Column(String, ForeignKey("drones.id"))
    operator_id = Column(String, ForeignKey("users.id"))
    
    takeoff_time = Column(DateTime)
    landing_time = Column(DateTime)
    
    max_altitude_reached_m = Column(Float)
    total_distance_flown_m = Column(Float)
    human_override_triggered = Column(Boolean, default=False)
    incident_report = Column(Text, nullable=True)

class NoFlyZone(Base):
    __tablename__ = "no_fly_zones"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String)
    restriction_level = Column(String) # e.g., 'CRITICAL', 'WARNING'
    
    # from geoalchemy2 import Geometry
    # polygon_geometry = Column(Geometry('POLYGON', 4326)) 
