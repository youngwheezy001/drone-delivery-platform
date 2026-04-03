import asyncio
import sqlite3
import os
from app.models.database import engine, Base

async def sync_database():
    """🛰️ TACTICAL DB SYNC: Patches missing columns for the Tustar Logistics Network."""
    print("Initiating Database Synchronization Sequence...")

    # 1. Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Core Tables Verified.")

    # 2. Manual SQLite Patching for legacy nodes
    db_path = "drone_mission_control.db" # Updated from sql_app.db
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check for existing columns to avoid errors
            cursor.execute("PRAGMA table_info(deliveries)")
            cols = [c[1] for c in cursor.fetchall()]
            
            patches = 0
            if "estimated_cost" not in cols:
                cursor.execute("ALTER TABLE deliveries ADD COLUMN estimated_cost FLOAT DEFAULT 0.0")
                print("🛠️  Patched: 'estimated_cost' added to deliveries.")
                patches += 1
            
            if "scheduled_at" not in cols:
                cursor.execute("ALTER TABLE deliveries ADD COLUMN scheduled_at DATETIME")
                print("🛠️  Patched: 'scheduled_at' added to deliveries.")
                patches += 1

            if "company_id" not in cols:
                cursor.execute("ALTER TABLE deliveries ADD COLUMN company_id STRING DEFAULT 'Megascript Digital'")
                print("🛠️  Patched: 'company_id' added to deliveries.")
                patches += 1

            conn.commit()
            conn.close()
            
            if patches == 0:
                print("🏁 Database is already fully synchronized.")
            else:
                print(f"✅ Successfully applied {patches} tactical patches.")
                
        except Exception as e:
            print(f"❌ Synchronization Error: {e}")
    else:
        print("⚠️  Target database 'sql_app.db' not found. Ensure you are in the /backend folder.")

if __name__ == "__main__":
    asyncio.run(sync_database())
