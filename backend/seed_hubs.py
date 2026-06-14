import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database import AsyncSessionLocal, engine, Base
from app.models.user import User
from app.models.marketplace import Product, Category
from app.models.delivery import DeliveryRecord
from app.core import security
import uuid

async def seed_hubs():
    print("🛰️ INITIALIZING HUB DATABASE SEEDER...")
    
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # Create TUSTAR Admin if missing
        admin = User(
            id=str(uuid.uuid4()),
            email="admin@tustar.com",
            # We assume your auth flow expects a hashed password. Let's use 'password123'
            hashed_password=security.get_password_hash("password123"),
            full_name="Tustar Command",
            company_id="TUSTAR_HQ",
            role="ADMIN",
            region="NAIROBI_CENTRAL",
            is_active=True,
            is_admin=True,
            latitude="-1.2921",
            longitude="36.8219"
        )
        
        hub1 = User(
            id=str(uuid.uuid4()),
            email="hub1@tustar.com",
            hashed_password=security.get_password_hash("password123"),
            full_name="Nairobi Alpha Hub",
            company_id="ALPHA_NODE_01",
            role="SELLER",
            region="NAIROBI_WEST",
            is_active=True,
            is_admin=False,
            latitude="-1.3000",
            longitude="36.8000"
        )
        
        hub2 = User(
            id=str(uuid.uuid4()),
            email="hub2@tustar.com",
            hashed_password=security.get_password_hash("password123"),
            full_name="Nairobi Bravo Hub",
            company_id="BRAVO_NODE_02",
            role="SELLER",
            region="NAIROBI_EAST",
            is_active=True,
            is_admin=False,
            latitude="-1.2800",
            longitude="36.8500"
        )
        
        session.add_all([admin, hub1, hub2])
        try:
            await session.commit()
            print("✅ DATABASE SEEDED SUCCESSFULLY! Created Admin and 2 Seller Hubs.")
            print("   - Admin: admin@tustar.com / password123")
            print("   - Hub 1: hub1@tustar.com / password123")
            print("   - Hub 2: hub2@tustar.com / password123")
        except Exception as e:
            print("⚠️ ERROR: Database might already be seeded. Details: ", e)

if __name__ == "__main__":
    asyncio.run(seed_hubs())
