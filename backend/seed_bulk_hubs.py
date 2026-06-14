import asyncio
import uuid
import random
from sqlalchemy import select, text
from app.models.database import AsyncSessionLocal
from app.models.user import User
from app.models.marketplace import Product, Category
from app.models.delivery import DeliveryRecord
from app.core.security import get_password_hash

async def run_bulk_injection():
    async with AsyncSessionLocal() as db:
        print("[SEEDER] Initiating Bulk Commercial Nodes...")
  
        # 1. Ensure Categories Exist
        categories = [
            ("Medical", "medkit-outline", "#ef4444"),
            ("Culinary", "fast-food-outline", "#f59e0b"),
            ("Electronics", "hardware-chip-outline", "#3b82f6"),
            ("Industrial Freight", "construct-outline", "#8b5cf6")
        ]
        cat_ids = {}
        for name, icon, color in categories:
            res = await db.execute(select(Category).where(Category.name == name))
            cat = res.scalars().first()
            if not cat:
                cat = Category(id=str(uuid.uuid4()), name=name, icon=icon, color=color)
                db.add(cat)
            cat_ids[name] = cat.id
            
        await db.commit()

        # 2. Advanced Commercial Hubs
        new_hubs = [
            # id, email, pass, name, comp_id, role, region, is_active, is_admin
            (str(uuid.uuid4()), "pharmacy@tustar.io", "medic001", "TUSTAR MEDICAL AERO", "TUSTAR_MEDICAL", "SELLER", "NAIROBI_HOSPITAL", 1, 0),
            (str(uuid.uuid4()), "pizza@tustar.io", "pizza001", "KILIMANI CULINARY NODE", "TUSTAR_PIZZA", "SELLER", "KILIMANI", 1, 0),
            (str(uuid.uuid4()), "electronics@megascript.com", "tech001", "MEGASCRIPT ELECTRONICS", "MEGASCRIPT_TECH", "SELLER", "WESTLANDS", 1, 0)
        ]
        
        # Fix Global Cargo
        await db.execute(text("DELETE FROM users WHERE email='global@cargo.net'"))
        new_hubs.append((str(uuid.uuid4()), "global@cargo.net", "cargo777", "GLOBAL CARGO NODE", "GLOBAL_CARGO", "SELLER", "NORTH_GRID", 1, 0))
        
        for uid, email, pin, name, cid, role, reg, is_act, is_adm in new_hubs:
            check = await db.execute(select(User.id).where(User.email == email))
            if not check.fetchone():
                hub = User(
                    id=uid, email=email, hashed_password=get_password_hash(pin),
                    full_name=name, company_id=cid, role=role, region=reg,
                    is_active=bool(is_act), is_admin=bool(is_adm)
                )
                db.add(hub)
                
                # Seed specific products for them
                if cid == "TUSTAR_MEDICAL":
                    db.add(Product(id=str(uuid.uuid4()), seller_id=uid, category_id=cat_ids["Medical"], name="Type-O Blood Synthetics", description="Urgent medical supplies", price=12500.0, weight_kg=1.5))
                    db.add(Product(id=str(uuid.uuid4()), seller_id=uid, category_id=cat_ids["Medical"], name="Epinephrine Auto-Injectors", description="Paramedic pack", price=4500.0, weight_kg=0.2))
                elif cid == "TUSTAR_PIZZA":
                    db.add(Product(id=str(uuid.uuid4()), seller_id=uid, category_id=cat_ids["Culinary"], name="Large Pepperoni Deep Dish", description="Hot insulated", price=1400.0, weight_kg=0.8))
                elif cid == "MEGASCRIPT_TECH":
                    db.add(Product(id=str(uuid.uuid4()), seller_id=uid, category_id=cat_ids["Electronics"], name="RTX 5090 Graphics Card", description="High-value GPU", price=350000.0, weight_kg=2.5))
                elif cid == "GLOBAL_CARGO":
                    db.add(Product(id=str(uuid.uuid4()), seller_id=uid, category_id=cat_ids["Industrial Freight"], name="Titanium Ball Bearings", description="Industrial Grade", price=25000.0, weight_kg=4.2))

        await db.commit()
        print("[SUCCESS] Bulk Nodes and High Value Mercantile Inventories Deployed!")

if __name__ == "__main__":
    asyncio.run(run_bulk_injection())
