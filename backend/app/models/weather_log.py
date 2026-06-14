from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.sql import func
from app.models.database import Base
import uuid

class WeatherLog(Base):
    """
    Historical Environmental Telemetry.
    Captures storm patterns for predictive yield analysis.
    """
    __tablename__ = "weather_logs"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    storm_lat = Column(Float, nullable=False)
    storm_lon = Column(Float, nullable=False)
    intensity = Column(Float, default=1.0) # 0.0 to 1.0 logic
    
    logged_at = Column(DateTime(timezone=True), server_default=func.now())
