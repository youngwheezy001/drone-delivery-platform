from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from sqlalchemy import select

from app.core.config import settings
from app.api.v1.endpoints import deliveries, telemetry, auth, sellers, marketplace, admin, chat, fleet, health, fintech, utm, nlp, b2b
from app.models.database import engine, Base, AsyncSessionLocal
from app.models.delivery import DeliveryRecord
from app.models.user import User
from app.models.drone import Drone
from app.models.weather_log import WeatherLog
from app.models.kcaa_log import KCAALog
from app.models.marketplace import Category, Product, PromoCode, Complaint
from app.services.mission_service import MissionService
from app.services.chaos_engine import chaos_engine
from app.services.weather import start_weather_engine, get_current_weather

async def auto_dispatch_engine():
    """🛰️ THE AUTO-DISPATCH ENGINE: Polls for scheduled missions every 60 seconds."""
    while True:
        try:
            async with AsyncSessionLocal() as db:
                now = datetime.now()
                # Promote missions scheduled for the next 15 minutes
                threshold = now + timedelta(minutes=15)
                
                result = await db.execute(
                    select(DeliveryRecord)
                    .where(DeliveryRecord.status == "SCHEDULED")
                    .where(DeliveryRecord.scheduled_at <= threshold)
                )
                missions = result.scalars().all()
                
                weather = get_current_weather()
                if weather.get("is_grounded", False):
                    # Weather is bad, skip dispatching
                    print(f"🛑 [AUTO-DISPATCH] Grid is GROUNDED due to weather. Holding {len(missions)} scheduled missions.")
                elif missions:
                    for m in missions:
                        m.status = "DISPATCHED" # Move to Hub Packing Queue
                    await db.commit()
                    print(f"🛰️ [AUTO-DISPATCH] Promoted {len(missions)} missions to active status.")
        except Exception as e:
            print(f"❌ [AUTO-DISPATCH ERROR] {e}")
        
        await asyncio.sleep(60) # Interval for mission promotion

# This ensures the database tables (including Users) are created when the server starts
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # Note: In a production app, use Alembic migrations instead of create_all
        await conn.run_sync(Base.metadata.create_all)
        
        # Removed patch_columns() since we are on Postgres now
    
    # Start the Auto-Dispatch Engine & Fleet Rebalancer
    dispatch_task = asyncio.create_task(auto_dispatch_engine())
    chaos_engine.start()
    
    from app.services.fleet_rebalancer import start_rebalancer
    await start_rebalancer()
    
    # Start Weather Telemetry Engine
    await start_weather_engine()
    
    yield
    
    # Clean up
    dispatch_task.cancel()
    # rebalance_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan # Attach the startup logic here
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES ---
# Professional Routing Structure
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(deliveries.router, prefix="/api/v1/deliveries", tags=["deliveries"])
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["telemetry"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["marketplace"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(fleet.router, prefix="/api/v1/fleet", tags=["fleet"])
app.include_router(nlp.router, prefix="/api/v1/nlp", tags=["nlp"])
app.include_router(b2b.router, prefix="/api/v1/b2b", tags=["b2b"])
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
app.include_router(fintech.router, prefix="/api/v1/fintech", tags=["fintech"])
app.include_router(utm.router, prefix="/api/v1/utm", tags=["utm"])
app.include_router(nlp.router, prefix="/api/v1/nlp", tags=["nlp"])

@app.get("/")
async def root():
    return {"message": "Drone Mission Control API is online."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)