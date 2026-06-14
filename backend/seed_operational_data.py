import asyncio
import uuid
import json
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.models.database import AsyncSessionLocal
from app.models.user import User
from app.models.delivery import DeliveryRecord
from app.models.marketplace import Product

async def run_operational_seeder():
    async with AsyncSessionLocal() as db:
        print("[SEEDER] Initiating Tactical Data Provisioning...")
        
        # 1. Fetch the original Hubs
        hub_cids = ["TUSTAR_COMMAND", "TUSTAR_HQ", "MEGASCRIPT_HUB", "GLOBAL_CARGO"]
        
        result = await db.execute(select(User).where(User.company_id.in_(hub_cids)))
        hubs = result.scalars().all()
        
        if not hubs:
            print("[ERROR] Could not locate the initial Hubs in the database. Ensure main.py migrations ran.")
            return
        
        print(f"[SUCCESS] Found {len(hubs)} operational hubs. Injecting missions...")
        
        # Dummy coordinates in Nairobi
        locations = [
            (-1.2921, 36.8219), (-1.2833, 36.8167), (-1.3000, 36.8000), 
            (-1.2500, 36.8300), (-1.3200, 36.8500), (-1.2700, 36.7900)
        ]
        
        statuses = ["READY_FOR_PICKUP", "DISPATCHED", "EN_ROUTE", "DELIVERED"]

        missions_generated = 0
        
        # 2. Generate 5-8 deliveries per hub
        for hub in hubs:
            num_missions = random.randint(3, 6)
            for _ in range(num_missions):
                dest = random.choice(locations)
                status = random.choice(statuses)
                
                # Mock Path
                path = [
                    {"lat": hub.latitude if hub.latitude else -1.292, "lng": hub.longitude if hub.longitude else 36.821},
                    {"lat": dest[0], "lng": dest[1]}
                ]
                
                delivery = DeliveryRecord(
                    id=f"M-{random.randint(1000, 9999)}",
                    customer_id=f"TEST_USER_{random.randint(100, 999)}",
                    company_id=hub.company_id,
                    status=status,
                    origin_lat=float(hub.latitude) if hub.latitude else -1.292,
                    origin_lon=float(hub.longitude) if hub.longitude else 36.821,
                    destination_lat=dest[0],
                    destination_lon=dest[1],
                    package_weight_kg=round(random.uniform(0.5, 3.5), 1),
                    distance_km=round(random.uniform(2.0, 15.0), 1),
                    route_json=path,
                    estimated_cost=round(random.uniform(500, 3500), 2),
                    scheduled_at=datetime.now(timezone.utc)
                )
                db.add(delivery)
                missions_generated += 1
                
        await db.commit()
        print(f"[SUCCESS] Injected {missions_generated} active Drone Delivery Missions across the grid!")

if __name__ == "__main__":
    asyncio.run(run_operational_seeder())
