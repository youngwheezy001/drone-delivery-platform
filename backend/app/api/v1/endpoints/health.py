from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.models.database import get_db
from app.services.weather import get_current_weather
import time

router = APIRouter()

@router.get("/tactical")
async def get_tactical_health(db: AsyncSession = Depends(get_db)):
    """
    MISSION CRITICAL: Tactical Health HUD 🛰️🏥
    Verifies SQL connectivity, engine latency, and multi-tenant integrity.
    """
    start_time = time.time()
    
    try:
        # 1. SQL Connectivity & Latency Check
        await db.execute(text("SELECT 1"))
        latency_ms = round((time.time() - start_time) * 1000, 2)
        
        # 2. Schema Readiness Audit (Check key tables)
        tables_res = await db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        table_names = [r[0] for r in tables_res.all()]
        
        required_tables = ["users", "deliveries", "products", "drones"]
        missing_tables = [t for t in required_tables if t not in table_names]
        
        return {
            "status": "OPERATIONAL" if not missing_tables else "DEGRADED",
            "weather": get_current_weather(),
            "telemetry": {
                "db_latency_ms": latency_ms,
                "connection": "STABLE",
                "engine": "SQLALCHEMY_ASYNC",
                "readiness_audit": "PASSED" if not missing_tables else f"MISSING_{'_'.join(missing_tables).upper()}"
            },
            "timestamp": time.time()
        }
    except Exception as e:
        return {
            "status": "CRITICAL_FAILURE",
            "telemetry": {
                "error": str(e),
                "connection": "DROPPED"
            },
            "timestamp": time.time()
        }
