import asyncio
from sqlalchemy import select, func
from app.models.database import AsyncSessionLocal
from app.models.drone import Drone
from app.models.delivery import DeliveryRecord
from app.models.user import User

async def rebalance_routine():
    """
    🛰️ AI FLEET ORCHESTRATOR V2.5
    Autonomous cross-region redistribution with simulated transit physics.
    """
    print("[REBALANCER] AI Core Active. Tactical Cross-Region monitoring active...")
    
    while True:
        try:
            async with AsyncSessionLocal() as db:
                # --- NEW: PREDICTIVE AI PASS (Financier Upgrade) ---
                from datetime import datetime
                current_hour = datetime.now().hour
                
                # Helper for transit physics
                async def finalize_transit(d_id, h_id):
                    await asyncio.sleep(60) # 60s Economic Redistribution
                    async with AsyncSessionLocal() as dbs:
                        target = await dbs.get(Drone, d_id)
                        if target:
                            target.status = "IDLE"
                            await dbs.commit()
                            print(f"✅ [REBALANCER] MIGRATION COMPLETE: UAV arrived at {h_id}")

                # 1. Aggregate Regional & Hub Demand
                demand_stmt = (
                    select(User.region, DeliveryRecord.company_id, func.count(DeliveryRecord.id))
                    .join(User, User.company_id == DeliveryRecord.company_id)
                    .where(DeliveryRecord.status.in_(["DISPATCHED", "PREPARING", "READY"]))
                    .group_by(User.region, DeliveryRecord.company_id)
                )
                res = await db.execute(demand_stmt)
                demand_data = res.all() # list of (region, hub_id, count)
                
                # 2. Map Regional Supply
                supply_stmt = (
                    select(User.region, Drone.current_hub_id, func.count(Drone.id))
                    .join(User, User.company_id == Drone.current_hub_id)
                    .where(Drone.status == "IDLE")
                    .group_by(User.region, Drone.current_hub_id)
                )
                res = await db.execute(supply_stmt)
                supply_data = res.all() # list of (region, hub_id, count)
                
                # Demand mapping
                total_regional_demand = {}
                for reg, hub, count in demand_data:
                    total_regional_demand[reg] = total_regional_demand.get(reg, 0) + count

                supply_map = {}
                for reg, hub, count in supply_data:
                    supply_map[hub] = count

                # --- 🔮 PHASE 11: PREDICTIVE BIG DATA REPOSITIONING ---
                from app.services.predictive_demand import predictive_demand_engine
                hotspot = await predictive_demand_engine.predict_hotspot(db)
                if hotspot:
                    # Find a nearby hub to the hotspot to preposition
                    # For simplicity, we just pick the first hub in the list as the "target"
                    # But ideally we'd find the closest company_id. 
                    # Let's get the closest active Hub
                    closest_hub_res = await db.execute(select(User).where(User.company_id != "Megascript Digital", User.is_active == True))
                    hubs = closest_hub_res.scalars().all()
                    
                    if hubs:
                        # Preposition 1 idle drone to this hotspot's nearest hub
                        target_hub = hubs[0].company_id 
                        source_hub = None
                        for s_reg, s_hub, s_count in supply_data:
                            if s_hub != target_hub and s_count > 3: # Pull from surplus hubs
                                source_hub = s_hub
                                break
                        
                        if source_hub:
                            drone_res = await db.execute(select(Drone).where(Drone.current_hub_id == source_hub, Drone.status == "IDLE").limit(1))
                            drone = drone_res.scalar_one_or_none()
                            if drone:
                                print(f"🔮 [BIG DATA REPOSITIONING] Surging UAV from {source_hub} -> {target_hub} for anticipated demand.")
                                drone.status = "IN_TRANSIT"
                                drone.current_hub_id = target_hub
                                await db.commit()
                                asyncio.create_task(finalize_transit(drone.id, target_hub))
                
                # 3. Decision Logic: High-Load Sinks
                for reg, hub_id, count in demand_data:
                    current_supply = supply_map.get(hub_id, 0)
                    if count > current_supply:
                        # HUB DEBT DETECTED.
                        # Look for surplus in the SAME region first
                        source_hub = None
                        for s_reg, s_hub, s_count in supply_data:
                            if s_reg == reg and s_hub != hub_id and s_count > 2:
                                source_hub = s_hub
                                break
                        
                        # If no local surplus, pull from ANY global surplus
                        if not source_hub:
                             for s_reg, s_hub, s_count in supply_data:
                                if s_count > 5: # Cross-region buffer
                                    source_hub = s_hub
                                    break
                        
                        if source_hub:
                            # TRIGGER AUTONOMOUS MIGRATION
                            drone_res = await db.execute(
                                select(Drone).where(Drone.current_hub_id == source_hub, Drone.status == "IDLE").limit(1)
                            )
                            drone = drone_res.scalar_one_or_none()
                            if drone:
                                print(f"🚀 [REBALANCER] MIGRATION INITIATED: {source_hub} -> {hub_id} (Sector Cross-Over)")
                                drone.status = "IN_TRANSIT"
                                drone.current_hub_id = hub_id
                                await db.commit()
                                
                                asyncio.create_task(finalize_transit(drone.id, hub_id))
                                break # Move one at a time per tick
        except Exception as e:
            print(f"❌ [REBALANCER V2.5 ERROR] {e}")
            
        await asyncio.sleep(30) # High-fidelity tactical tick

async def start_rebalancer():
    """Entry point for the background task loop."""
    asyncio.create_task(rebalance_routine())
