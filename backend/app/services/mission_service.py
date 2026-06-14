import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.delivery import DeliveryRecord
from app.models.user import User
from app.services.a_star_planner import FlightPathPlanner
from app.services.pricing_engine import pricing_engine
from app.services.mission_validator import ai_logistics
from app.core.config import settings
from app.services.weather_service import weather_monitor
from app.services.airspace_registry import airspace_registry

class MissionService:
    """
    UAV STRATEGIC ORCHESTRATOR v5.0
    The central domain master for mission authorization, waypoint reservation, and yield optimization.
    """
    def __init__(self):
        self.planner = FlightPathPlanner()
        self.hq_pos = (settings.HQ_LAT, settings.HQ_LON)
        self.obstacles = settings.NO_FLY_ZONES

    async def get_regional_load(self, db: AsyncSession, company_id: str) -> Tuple[str, int, float]:
        """Calculates regional and sector congestion indices."""
        # ... logic remains same ...
        reg_stmt = (
            select(User.region, func.count(DeliveryRecord.id))
            .join(User, User.company_id == DeliveryRecord.company_id)
            .where(User.company_id == company_id)
            .where(DeliveryRecord.status.in_(["DISPATCHED", "PREPARING", "READY", "EN_ROUTE"]))
        ).group_by(User.region)
        
        hub_reg_res = await db.execute(reg_stmt)
        hub_reg_data = hub_reg_res.first()
        hub_region = hub_reg_data[0] if hub_reg_data else "NAIROBI_CENTRAL"
        active_count = hub_reg_data[1] if hub_reg_data else 0

        total_reg_stmt = (
            select(func.count(DeliveryRecord.id))
            .join(User, User.company_id == DeliveryRecord.company_id)
            .where(User.region == hub_region)
            .where(DeliveryRecord.status.in_(["DISPATCHED", "PREPARING", "READY", "EN_ROUTE"]))
        )
        total_reg_res = await db.execute(total_reg_stmt)
        total_reg_count = total_reg_res.scalar() or 0
        regional_congestion = min(total_reg_count / 30.0, 1.0)
        
        return hub_region, active_count, regional_congestion

    async def authorize_mission(
        self, 
        db: AsyncSession, 
        customer_id: str, 
        destination: Tuple[float, float],
        package_weight: float,
        scheduled_at: Optional[datetime] = None,
        company_id: str = "Megascript Digital",
        is_rugged_terrain: bool = False
    ) -> DeliveryRecord:
        """🛰️ ATOMIC COMMAND: Authorize and persist a mission with yield-aware pricing."""
        path = await self.planner.calculate_optimal_path(self.hq_pos, destination, self.obstacles)
        if not path:
             raise ValueError("Mission synchronization failed: No viable path found.")

        outbound_distance = sum(self.planner.haversine(path[i][0], path[i][1], path[i+1][0], path[i+1][1]) for i in range(len(path)-1))
        total_distance = outbound_distance * 2
        
        # --- AVENUE 1: MULTI-LEG RELAYS (PONY EXPRESS) ---
        is_relay = False
        relay_hub_id = None
        if total_distance > 30.0:
            # Over max endurance (15km outbound * 2). Need a relay hub!
            # Find a hub that is roughly halfway
            hub_res = await db.execute(select(User).where(User.role == "SELLER", User.is_active == True))
            hubs = hub_res.scalars().all()
            
            best_hub = None
            best_dist_diff = float('inf')
            
            for h in hubs:
                if h.latitude and h.longitude:
                    hub_lat, hub_lon = float(h.latitude), float(h.longitude)
                    dist_to_hub = self.planner.haversine(self.hq_pos[0], self.hq_pos[1], hub_lat, hub_lon)
                    dist_from_hub = self.planner.haversine(hub_lat, hub_lon, destination[0], destination[1])
                    
                    if dist_to_hub < 15.0 and dist_from_hub < 15.0:
                        # Viable relay!
                        diff = abs(dist_to_hub - dist_from_hub)
                        if diff < best_dist_diff:
                            best_dist_diff = diff
                            best_hub = h
                            
            if not best_hub:
                raise ValueError("Payload endurance exceeded. No viable Relay Hub found in range.")
                
            is_relay = True
            relay_hub_id = best_hub.id
            # Recalculate split path
            hub_pos = (float(best_hub.latitude), float(best_hub.longitude))
            leg1 = await self.planner.calculate_optimal_path(self.hq_pos, hub_pos, self.obstacles)
            leg2 = await self.planner.calculate_optimal_path(hub_pos, destination, self.obstacles)
            if not leg1 or not leg2:
                raise ValueError("Relay synchronization failed: No viable path via intermediate hub.")
            path = leg1[:-1] + leg2 # Combine legs
            
            print(f"🛰️ [RELAY] Multi-leg route established via {best_hub.full_name}")

        hub_region, active_count, regional_congestion = await self.get_regional_load(db, company_id)
        
        # Calculate Fleet Utilization
        from app.models.drone import Drone
        drone_res = await db.execute(select(Drone).where(Drone.needs_maintenance == False))
        drones = drone_res.scalars().all()
        total_drones = len(drones)
        active_drones = len([d for d in drones if d.status not in ["IDLE", "MAINTENANCE", "CHARGING"]])
        fleet_util = (active_drones / total_drones) if total_drones > 0 else 0.0
        
        pricing = pricing_engine.calculate_mission_cost(total_distance, active_count, regional_congestion, fleet_util)
        
        # --- AVENUE 3: TUSTAR PRIME ---
        user_res = await db.execute(select(User).where(User.id == customer_id))
        customer = user_res.scalars().first()
        if customer and customer.is_prime:
            pricing['total_yield'] = 0.0 # Prime members get free delivery
            print(f"👑 [TUSTAR PRIME] Delivery fee waived for {customer.email}")

        new_delivery = DeliveryRecord(
            customer_id=customer_id,
            company_id=company_id,
            status="PREPARING" if customer and customer.is_prime else "SCHEDULED", # Prime Priority
            origin_lat=self.hq_pos[0],
            origin_lon=self.hq_pos[1],
            destination_lat=destination[0],
            destination_lon=destination[1],
            package_weight_kg=package_weight,
            distance_km=round(total_distance, 3), 
            route_json=path, 
            estimated_cost=pricing['total_yield'],
            scheduled_at=scheduled_at,
            is_rugged_terrain=is_rugged_terrain
        )
        
        db.add(new_delivery)
        await db.commit()
        await db.refresh(new_delivery)
        airspace_registry.reserve_path(str(new_delivery.id), path, datetime.now())
        return new_delivery

    async def get_scheduled_queue(self, db: AsyncSession) -> List[dict]:
        """Fetch queue with AI situational risk assessment."""
        result = await db.execute(
            select(DeliveryRecord)
            .where(DeliveryRecord.status == "SCHEDULED")
            .order_by(DeliveryRecord.scheduled_at.asc())
        )
        missions = result.scalars().all()
        
        response = []
        for m in missions:
            assessment = {"status": "UNAVAILABLE", "risk_score": 0}
            if m.route_json:
                risk = ai_logistics.validate_route_risk(m.route_json)
                window = ai_logistics.calculate_optimal_window(m.route_json)
                assessment = {
                    "risk_score": risk['risk_score'],
                    "status": risk['status'],
                    "est_battery": risk['est_battery_drain'],
                    "optimal_delay": window['best_departure_delay']
                }

            response.append({
                "id": m.id,
                "origin_lat": m.origin_lat,
                "origin_lon": m.origin_lon,
                "destination_lat": m.destination_lat,
                "destination_lon": m.destination_lon,
                "package_weight": m.package_weight_kg,
                "scheduled_at": m.scheduled_at.isoformat() if m.scheduled_at else None,
                "status": m.status,
                "hub": m.company_id,
                "ai_assessment": assessment
            })
        return response

    async def process_queue(self, db: AsyncSession) -> int:
        """Promotes all qualified scheduled missions to active DISPATCHED state."""
        result = await db.execute(
            select(DeliveryRecord).where(DeliveryRecord.status == "SCHEDULED")
        )
        missions = result.scalars().all()
        
        count = 0
        for m in missions:
            # Atomic promotion
            m.status = "DISPATCHED"
            count += 1
            
        await db.commit()
        return count

mission_service = MissionService()
