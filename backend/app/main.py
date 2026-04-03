from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from sqlalchemy import select

from app.core.config import settings
from app.api.v1.endpoints import deliveries, telemetry, auth, sellers, marketplace, admin, chat
from app.models.database import engine, Base, AsyncSessionLocal
from app.models.delivery import DeliveryRecord

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
                
                if missions:
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
        
        # 🛠️ SURGICAL REPAIR: Patch missing columns for legacy DBs
        def patch_columns(connection):
            cursor = connection.cursor()
            cursor.execute("PRAGMA table_info(deliveries)")
            cols = [c[1] for c in cursor.fetchall()]
            if "estimated_cost" not in cols:
                cursor.execute("ALTER TABLE deliveries ADD COLUMN estimated_cost FLOAT DEFAULT 0.0")
                print("🛠️ [SYSTEM] Patched 'estimated_cost'.")
            if "scheduled_at" not in cols:
                cursor.execute("ALTER TABLE deliveries ADD COLUMN scheduled_at DATETIME")
                print("🛠️ [SYSTEM] Patched 'scheduled_at'.")
            connection.commit()

        await conn.run_sync(patch_columns)
    
    # Start the Auto-Dispatch Engine
    dispatch_task = asyncio.create_task(auto_dispatch_engine())
    
    yield
    
    # Clean up
    dispatch_task.cancel()

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
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(deliveries.router, prefix="/api/v1/deliveries", tags=["deliveries"])
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["telemetry"])
app.include_router(sellers.router, prefix="/api/v1/sellers", tags=["sellers"])
app.include_router(marketplace.router, prefix="/api/v1/marketplace", tags=["marketplace"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])

@app.get("/")
async def root():
    return {"message": "Drone Mission Control API is online."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)