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

            # 3. 🛰️ TACTICAL SEEDING: Provisioning Partner Hubs
            print("Initiating Partner Seeding Sequence...")
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            
            partners = [
                ("admin@tustar.io", "tustar123", "TUSTAR CENTRAL HUB", "TUSTAR_HQ", "SELLER"),
                ("lewis@megascript.com", "megascript001", "MEGASCRIPT LOGISTICS", "MEGASCRIPT_HUB", "SELLER"),
                ("global@cargo.net", "cargo777", "GLOBAL CARGO NODE", "GLOBAL_CARGO", "SELLER")
            ]
            
            seeds = 0
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            for email, pin, name, cid, role in partners:
                cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
                if not cursor.fetchone():
                    user_id = f"user_{cid.lower()}"
                    hashed_pw = pwd_context.hash(pin)
                    cursor.execute(
                        "INSERT INTO users (id, email, hashed_password, full_name, company_id, role, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
                        (user_id, email, hashed_pw, name, cid, role)
                    )
                    print(f"🛰️ [SEED] Provisioned Hub: {name} ({email})")
                    seeds += 1
            
            conn.commit()
            conn.close()
            if seeds > 0:
                print(f"✅ Successfully seeded {seeds} partner profiles.")
            else:
                print("🏁 Partner ecosystem already provisioned.")
                
        except Exception as e:
            print(f"❌ Synchronization/Seeding Error: {e}")
    else:
        print(f"⚠️  Target database '{db_path}' not found. Ensure you are in the /backend folder.")

if __name__ == "__main__":
    asyncio.run(sync_database())
