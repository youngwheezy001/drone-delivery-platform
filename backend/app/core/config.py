import os
from dotenv import load_dotenv

# Load all variables from .env
load_dotenv()

class Settings:
    # --- PROJECT INFO ---
    PROJECT_NAME: str = "Autonomous Drone Delivery API"
    VERSION: str = "1.0.0"

    # --- DATABASE ---
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./drone_mission_control.db")

    # --- MISSION CONTROL GPS ---
    # Defaulting to Nairobi HQ
    HQ_LAT: float = float(os.getenv("HQ_LAT", -1.2921))
    HQ_LON: float = float(os.getenv("HQ_LON", 36.7884))

    # --- SERVER SETTINGS ---
    DEBUG: bool = os.getenv("DEBUG", "True") == "True"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    RELOAD: bool = os.getenv("RELOAD", "True") == "True"

    # --- SECURITY ---
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 Days for Mobile Parity

    # --- GEOFENCING / NO-FLY ZONES ---
    # We can store these as hardcoded defaults here, 
    # but they can be moved to a database in the future.
    NO_FLY_ZONES = [
        {"name": "JKIA Airport", "lat": -1.319, "lon": 36.927, "radius_km": 5.0},
        {"name": "Wilson Airport", "lat": -1.321, "lon": 36.814, "radius_km": 3.0},
        {"name": "State House", "lat": -1.278, "lon": 36.804, "radius_km": 1.0} 
    ]

# Global instance
settings = Settings()