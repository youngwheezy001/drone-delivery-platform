from fastapi import APIRouter
from app.models.database import engine
from sqlalchemy import text

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Standard Health Check endpoint for Docker orchestration.
    Verifies that the API is online and the Database connection is alive.
    """
    try:
        # Check database connection
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "database": "connected",
            "api": "online"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
