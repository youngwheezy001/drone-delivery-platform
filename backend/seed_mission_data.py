import asyncio
from datetime import datetime, timedelta
from app.models.database import engine, AsyncSessionLocal, Base
from app.models.user import User
from app.models.marketplace import Product, Category
from app.models.delivery import DeliveryRecord
from app.core.security import get_password_hash

async def seed_mission_data():
    print("[SEEDER] Initializing Tactical Mission Data...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed Categories
        categories = ["Medical Supplies", "Ready Meals", "Electronics", "Documents"]
        cat_map = {}
        import sqlalchemy as sa
        for cat_name in categories:
            res = await db.execute(sa.select(Category).where(Category.name == cat_name))
            c = res.scalar()
            if not c:
                c = Category(name=cat_name)
                db.add(c)
                await db.flush() # Get ID
            cat_map[cat_name] = c.id
        await db.commit()
        print("[SEEDER] Logistics Categories Provisioned.")

        # 2. Seed Admin & Hubs (Sellers)
        entities = [
            # ID, Email, Password, Full Name, Company ID, Role, Lat, Lon
            ("admin_tustar_hq", "admin@tustar.io", "TacticalAdmin2026!", "HQ STRATEGIC COMMAND", "HQ_CMD", "ADMIN", -1.2921, 36.7884),
            ("hub_jkia", "jkia@tustar.io", "MissionJKIA2026!", "JKIA LOGISTICS HUB", "HUB_JKIA", "SELLER", -1.3321, 36.9212),
            ("hub_cbd", "cbd@tustar.io", "MissionCBD2026!", "CBD CENTRAL COMMAND", "HUB_CBD", "SELLER", -1.2833, 36.8233),
            ("hub_wilson", "wilson@tustar.io", "MissionWILSON2026!", "WILSON AIRFIELD OPS", "HUB_WILSON", "SELLER", -1.3216, 36.8147),
            ("hub_west", "westlands@tustar.io", "MissionWEST2026!", "WESTLANDS CARGO NODE", "HUB_WEST", "SELLER", -1.2633, 36.8033),
        ]
        
        for uid, email, pin, name, cid, role, lat, lon in entities:
            res = await db.execute(sa.select(User).where(User.email == email))
            u = res.scalar()
            if not u:
                u = User(
                    id=uid, email=email, hashed_password=get_password_hash(pin),
                    full_name=name, company_id=cid, role=role, is_active=True,
                    is_admin=(role == "ADMIN"),
                    latitude=str(lat),
                    longitude=str(lon)
                )
                db.add(u)
                await db.flush()
            
            if role == "SELLER":
                # 3. Seed Inventory for each Hub
                res_p = await db.execute(sa.select(Product).where(Product.seller_id == u.id))
                if not res_p.scalar():
                    p1 = Product(
                        name=f"Tactical {name.split()[0]} Kit",
                        description="Standard issue logistics package for rapid drone deployment.",
                        price=2500.0, seller_id=u.id, category_id=cat_map["Medical Supplies"]
                    )
                    p2 = Product(
                        name=f"Elite {name.split()[0]} Battery",
                        description="High-density power cell for long-range missions.",
                        price=4500.0, seller_id=u.id, category_id=cat_map["Electronics"]
                    )
                    db.add_all([p1, p2])

                # 4. Seed Sample Active Orders for each Hub
                res_d = await db.execute(sa.select(DeliveryRecord).where(sa.and_(DeliveryRecord.company_id == cid, DeliveryRecord.status == "READY_FOR_PICKUP")))
                if not res_d.scalar():
                    d1 = DeliveryRecord(
                        customer_id="tester@tustar.io", company_id=cid,
                        origin_lat=lat, origin_lon=lon,
                        destination_lat=lat + 0.01, destination_lon=lon + 0.01,
                        status="READY_FOR_PICKUP", estimated_cost=450.0,
                        package_weight_kg=1.5, distance_km=1.2,
                        route_json=[[lat, lon], [lat + 0.01, lon + 0.01]]
                    )
                    d2 = DeliveryRecord(
                        customer_id="customer@node.net", company_id=cid,
                        origin_lat=lat, origin_lon=lon,
                        destination_lat=lat - 0.01, destination_lon=lon - 0.01,
                        status="DISPATCHED", estimated_cost=1200.0,
                        package_weight_kg=0.8, distance_km=1.8,
                        route_json=[[lat, lon], [lat - 0.01, lon - 0.01]]
                    )
                    db.add_all([d1, d2])

        await db.commit()
        print("[SEEDER] Hubs, Inventory, and Active Missions Provisioned.")
        print("[SYSTEM] Mission Control is now fully populated for testing.")

if __name__ == "__main__":
    asyncio.run(seed_mission_data())
