import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

# Ensure we import all models so Base.metadata knows about them
from app.models.database import Base
from app.models.user import User
from app.models.marketplace import Category, Product
from app.models.drone import Drone
from app.models.delivery import DeliveryRecord
from app.models.compliance import KCAAFlightLog, NoFlyZone
from app.models.ledger import Transaction

load_dotenv()

async def setup():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("ERROR: No DATABASE_URL found in .env")
        return

    # Convert to asyncpg
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        
    engine = create_async_engine(db_url, echo=True, connect_args={"statement_cache_size": 0})
    
    try:
        # 1. Enable PostGIS Extension
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            print("OK: PostGIS Extension Verified/Enabled.")
            
        # 2. Create All Tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print("OK: All Enterprise Tables Created.")
            
        print("DONE: PostgreSQL Initialization Complete! You are now running an Enterprise Aviation Network.")
    except Exception as e:
        print(f"ERROR: Setup Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(setup())
