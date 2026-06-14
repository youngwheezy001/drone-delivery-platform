import asyncio
import uuid
from sqlalchemy import text, select
from app.models.database import AsyncSessionLocal
from app.models.user import User
from app.models.marketplace import Product, Category
from app.models.delivery import DeliveryRecord
from app.models.drone import Drone
from app.core.security import get_password_hash

async def sterilize_and_seed_real():
    async with AsyncSessionLocal() as db:
        print("[STERILIZATION] Initiating Global Database Reset...")
        
        # 1. WIPE MISSION DATA & INVENTORY
        print("Wiping transaction data, inventory, and placeholders...")
        await db.execute(text("DELETE FROM deliveries"))
        await db.execute(text("DELETE FROM products"))
        await db.execute(text("DELETE FROM categories"))
        await db.execute(text("DELETE FROM drones"))
        await db.execute(text("DELETE FROM users"))
        await db.commit()

        # 2. SEED REAL HUBS ONLY
        print("Seeding Real Commercial Entities...")
        
        # Default Category for real goods
        standard_cat = Category(id=str(uuid.uuid4()), name="Logistical Goods", icon="cube-outline", color="#64748b")
        db.add(standard_cat)
        await db.flush()

        real_hubs = [
            # id, email, pass, name, comp_id, role, region, is_admin
            ("user_master_admin", "mwangilewis205@gmail.com", "Tustarcruzz001", "LEWIS MWANGI (HQ)", "TUSTAR_COMMAND", "ADMIN", "NAIROBI_CENTRAL", 1),
            ("user_tustar_hq", "admin@tustar.io", "tustar123", "TUSTAR CENTRAL DISPATCH", "TUSTAR_HQ", "SELLER", "NAIROBI_CENTRAL", 0),
            ("user_megascript_hub", "lewis@megascript.com", "megascript001", "MEGASCRIPT LOGISTICS", "MEGASCRIPT_HUB", "SELLER", "EAST_SECTOR", 0),
            ("user_global_cargo", "global@cargo.net", "cargo777", "GLOBAL CARGO NODE", "GLOBAL_CARGO", "SELLER", "NORTH_GRID", 0)
        ]

        hub_company_ids = []
        for uid, email, pin, name, cid, role, reg, is_adm in real_hubs:
            hub = User(
                id=uid, email=email, hashed_password=get_password_hash(pin),
                full_name=name, company_id=cid, role=role, region=reg,
                is_active=True, is_admin=bool(is_adm)
            )
            db.add(hub)
            if role == "SELLER":
                hub_company_ids.append(cid)
                # Seed a sample 'real' product for each seller
                db.add(Product(
                    id=str(uuid.uuid4()), seller_id=uid, category_id=standard_cat.id,
                    name=f"{name} Priority Cargo", description="Standardized logistical payload",
                    price=5000.0, weight_kg=1.2
                ))
        
        await db.flush()

        # 3. PROVISION REAL FLEET (6 Drones per Seller)
        print("Provisioning Authentic UAV Fleet...")
        for cid in hub_company_ids:
            for i in range(6):
                drone = Drone(
                    id=f"UAV-{cid[:3]}-{100 + i}",
                    current_hub_id=cid,
                    status="IDLE",
                    battery_health=100
                )
                db.add(drone)

        await db.commit()
        print("[STERILIZATION COMPLETE] Operational Matrix restricted to Real Hubs only.")

if __name__ == "__main__":
    asyncio.run(sterilize_and_seed_real())
