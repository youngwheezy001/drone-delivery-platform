from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import random
from typing import Dict, List, Tuple
from pydantic import BaseModel

from sqlalchemy import select
from app.models.database import AsyncSessionLocal
from app.models.delivery import DeliveryRecord
from app.models.kcaa_log import KCAALog
from app.models.drone import Drone
from app.services.weather_service import weather_monitor
from app.services.chaos_engine import chaos_engine

router = APIRouter()

# --- PHASE 14: GLOBAL REROUTE TRACKER ---
active_reroutes: Dict[str, Tuple[float, float]] = {}

def interpolate_points(p1, p2, steps=10):
    lat_step = (p2[0] - p1[0]) / steps
    lon_step = (p2[1] - p1[1]) / steps
    return [[p1[0] + (lat_step * i), p1[1] + (lon_step * i)] for i in range(steps)]


@router.get("/chaos-zones")
async def get_chaos_zones():
    return {"zones": chaos_engine.get_zones()}

@router.websocket("/stream/{delivery_id}")
async def telemetry_stream(websocket: WebSocket, delivery_id: str):
    """
    A synchronized flight simulator that drives the map markers 
    on both the Customer App and the Mission Control Dashboard.
    Supports Environmental Physics (Weather Penalties).
    """
    await websocket.accept()
    
    # 1. Fetch the actual route from the Database
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(DeliveryRecord).where(DeliveryRecord.id == delivery_id))
        delivery = result.scalars().first()
        
        if not delivery or not delivery.route_json:
            await websocket.send_text(json.dumps({"error": "Route not found for this delivery ID"}))
            await websocket.close()
            return
        
        dynamic_route = delivery.route_json
        is_rugged_terrain = getattr(delivery, 'is_rugged_terrain', False)

    try:
        # 2. Start the simulation with Environment Physics
        smooth_path = []
        for i in range(len(dynamic_route) - 1):
            smooth_path.extend(interpolate_points(dynamic_route[i], dynamic_route[i+1], steps=15))
        smooth_path.append(dynamic_route[-1])

        battery = 100.0
        base_sleep = 0.5
        
        # --- DIGITAL TWIN HARDWARE STATE ---
        motor_temp = 45.0
        rotor_rpm = 4200
        imu_drift = 0.01
        voltage_sag = 0.0
        voltage_sag = 0.0
        
        # --- PHASE 13: BATTERY AI STATE ---
        last_battery = 100.0
        abnormal_drain_events = 0
        
        # 📝 KCAA LOG: TAKEOFF
        async with AsyncSessionLocal() as db_log:
            db_log.add(KCAALog(delivery_id=delivery_id, event_type="TAKEOFF", latitude=dynamic_route[0][0], longitude=dynamic_route[0][1], altitude_m=0.0))
            await db_log.commit()
        
        path_idx = 0
        while path_idx < len(smooth_path):
            coord = smooth_path[path_idx]
            path_idx += 1
            
            # --- PHASE 14: MID-AIR REROUTING (Hot-Swapping Paths) ---
            if delivery_id in active_reroutes:
                new_dest = active_reroutes.pop(delivery_id)
                print(f"🔄 [HOT-SWAP] {delivery_id} intercepting new destination: {new_dest}. Recalculating A*...")
                from app.services.a_star_planner import FlightPathPlanner
                from app.core.config import settings
                planner = FlightPathPlanner()
                new_path = await planner.calculate_optimal_path((coord[0], coord[1]), new_dest, settings.NO_FLY_ZONES)
                if new_path:
                    dynamic_route = new_path
                    smooth_path = []
                    for i in range(len(dynamic_route) - 1):
                        smooth_path.extend(interpolate_points(dynamic_route[i], dynamic_route[i+1], steps=15))
                    smooth_path.append(dynamic_route[-1])
                    path_idx = 0
                    continue # Re-evaluate loop with new path!
            
            penalty = weather_monitor.get_weather_penalty(coord[0], coord[1])
            
            # Apply physics penalties
            current_sleep = base_sleep / penalty['speed_multiplier']
            
            # --- PHASE 14: THERMAL UPDRAFT GLIDING ---
            if random.random() < 0.03: # 3% chance
                print(f"🌪️ [THERMAL UPDRAFT] {delivery_id} gliding. Halting battery drain.")
                rotor_rpm = 0
                # Drain is 0 for this tick
            else:
                battery -= (0.1 * penalty['drain_multiplier'])
                rotor_rpm = int(4200 * penalty['drain_multiplier'] + random.uniform(-100, 100))
                
            # --- PHASE 15: EMI ZONES (Electromagnetic Interference) ---
            if random.random() < 0.05:
                print(f"⚠️ [EMI WARNING] {delivery_id} entered high RF noise zone! Engaging Optical Flow.")
                coord[0] += random.uniform(-0.0005, 0.0005) # Fuzz GPS
                coord[1] += random.uniform(-0.0005, 0.0005)
                imu_drift *= 2.0
                current_sleep *= 2.0 # Halve speed
            
            # Check Chaos Engine
            in_chaos = False
            for zone in chaos_engine.get_zones():
                from app.services.a_star_planner import FlightPathPlanner
                planner = FlightPathPlanner()
                if planner.haversine(coord[0], coord[1], zone['latitude'], zone['longitude']) <= zone['radius_km']:
                    in_chaos = True
                    break

            # --- DIGITAL TWIN SENSOR EMULATION ---
            import random
            motor_temp += random.uniform(0.1, 0.5) * penalty['drain_multiplier']
            if in_chaos:
                motor_temp += random.uniform(2.0, 5.0) # Spike in storms
            
            # Cooldown logic
            if motor_temp > 90.0:
                current_sleep *= 2.0 # Slow down to cool off
                motor_temp -= random.uniform(1.0, 3.0)
            
            imu_drift += random.uniform(0.001, 0.005) * penalty['speed_multiplier']
            voltage_sag = 22.2 - (0.5 * penalty['drain_multiplier'])
            
            # --- PHASE 14: MID-AIR PAYLOAD HANDOFF ---
            if battery < 20.0 and len(smooth_path) - path_idx > 20:
                print(f"⚡ [INTERCEPT REQUEST] {delivery_id} battery failing. Handoff requested.")
                import uuid
                fresh_drone = f"UAV-{str(uuid.uuid4())[:8].upper()}"
                print(f"🤝 [PAYLOAD HANDOFF] UAV intercepted by fresh drone {fresh_drone}!")
                battery = 100.0 # Fresh battery takes over!

            # 🚨 AUTOMATED FAILSAFE TRIGGERS
            if battery < 15.0 or motor_temp > 110.0 or (penalty['status'] == "SEVERE" and not in_chaos):
                reason = "Thermal Runaway" if motor_temp > 110.0 else f"Battery: {round(battery,1)}%, Weather: {penalty['status']}"
                async with AsyncSessionLocal() as db_log:
                    db_log.add(KCAALog(
                        delivery_id=delivery_id, 
                        event_type="EMERGENCY", 
                        latitude=coord[0], 
                        longitude=coord[1], 
                        altitude_m=0.0,
                        details=f"Autonomy Override. {reason}"
                    ))
                    await db_log.commit()
                
                payload = {
                    "delivery_id": delivery_id,
                    "status": "EMERGENCY_LANDING",
                    "telemetry": {
                        "latitude": coord[0], 
                        "longitude": coord[1], 
                        "altitude_m": 0.0, 
                        "battery": max(0, round(battery, 1))
                    }
                }
                await websocket.send_text(json.dumps(payload))
                await websocket.close()
                print(f"🚨 [FAILSAFE] Mission {delivery_id} aborted. Drone grounded safely.")
                return # Terminate flight loop
            
            # --- PHASE 12: SWARM COLLISION AVOIDANCE ---
            from app.services.airspace_registry import airspace_registry
            base_alt = 45.0 + (50.0 if penalty['in_storm'] else 0.0)
            
            # --- PHASE 16: HOSTILE ENVIRONMENT SABOTAGE ---
            if base_alt < 50.0 and random.random() < 0.01:
                print(f"🚨 [SECURITY ALERT] {delivery_id} encountered vandalism attempt! Engaging evasive vertical climb.")
                base_alt = 80.0
            
            # Update Live Global Radar
            airspace_registry.update_live_radar(delivery_id, coord[0], coord[1], base_alt, "IN_TRANSIT")
            
            # Check for mid-air overlaps with other drones
            if airspace_registry.is_collision_imminent(delivery_id, coord[0], coord[1]):
                print(f"⚠️ [SWARM WARNING] Collision Imminent for {delivery_id}! Staggering altitude +15m.")
                base_alt += 15.0
                
            # --- PHASE 16: HYPERSONIC TRANSIT CORRIDORS (Aero-Drafting) ---
            for other_id, pos in airspace_registry.live_radar_feed.items():
                if other_id != delivery_id and pos["status"] == "IN_TRANSIT":
                    dist = airspace_registry._calculate_dist((coord[0], coord[1]), (pos["lat"], pos["lon"]))
                    if dist < 0.5:
                        print(f"💨 [AERO-DRAFTING] {delivery_id} slipstreaming behind {other_id}. Efficiency +20%.")
                        penalty['speed_multiplier'] *= 1.2
                        battery += 0.02 # Refund some battery drain
                        current_sleep /= 1.2 # Fly faster
                        break
            
            payload = {
                "delivery_id": delivery_id,
                "status": "IN_TRANSIT",
                "weather_status": penalty['status'],
                "telemetry": {
                    "latitude": coord[0], 
                    "longitude": coord[1], 
                    "altitude_m": base_alt, # Turbulence + Swarm Avoidance
                    "speed_ms": 12.5 * penalty['speed_multiplier'],
                    "battery": max(0, round(battery, 1))
                },
                "hardware": {
                    "motor_temp_c": round(motor_temp, 1),
                    "rotor_rpm": rotor_rpm,
                    "imu_drift_rad": round(imu_drift, 4),
                    "voltage": round(voltage_sag, 2)
                }
            }
            
            # --- PHASE 13: BATTERY AI HEALTH TRACKING ---
            drain = last_battery - battery
            if drain > 0.4: # Abnormal sag per tick
                abnormal_drain_events += 1
            last_battery = battery
            
            # --- PHASE 13: MESH NETWORKING (LTE Deadzone Survival) ---
            is_deadzone = random.random() < 0.02 # 2% chance per tick to hit a deadzone
            mesh_relay_id = None
            
            if is_deadzone:
                for other_id, pos in airspace_registry.live_radar_feed.items():
                    if other_id != delivery_id and pos["status"] == "IN_TRANSIT":
                        # Check within 5km
                        dist = airspace_registry._calculate_dist((coord[0], coord[1]), (pos["lat"], pos["lon"]))
                        if dist < 5.0:
                            mesh_relay_id = other_id
                            break
                            
                if mesh_relay_id:
                    payload["status"] = f"IN_TRANSIT (MESH RELAY: {mesh_relay_id})"
                    print(f"📡 [MESH NETWORK] {delivery_id} in deadzone! Relaying telemetry through {mesh_relay_id}.")
                else:
                    print(f"📵 [DEADZONE] {delivery_id} lost connection. No nearby relay nodes.")
                    await asyncio.sleep(1.0)
                    continue # Skip broadcasting telemetry to simulate signal loss!
            
            # --- PHASE 16: EMP BLACKOUT PROTOCOL ---
            if random.random() < 0.005:
                print(f"⚡ [EMP BLACKOUT] {delivery_id} hit by electromagnetic pulse! Systems offline.")
                payload["status"] = "SYSTEMS_OFFLINE"
                payload["hardware"]["rotor_rpm"] = 0
                await websocket.send_text(json.dumps(payload))
                
                await asyncio.sleep(3.0) # System hangs
                print(f"🔄 [SYSTEM RECOVERY] {delivery_id} reboot complete. Flight controller stabilized.")
                continue # Skip normal tick sleep, resume next tick
            
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(current_sleep) 
        # --- PHASE 12 & 15: EDGE AI VISION / KINETIC AIRDROPS ---
        final_coord = dynamic_route[-1]
        
        if is_rugged_terrain:
            print(f"🪂 [KINETIC AIRDROP] {delivery_id} in rugged terrain! Deploying payload mid-air.")
            drop_alt = 15.0
            drop_status = "KINETIC_AIRDROP_DEPLOYED"
            kcaa_event = "AIRDROP"
        else:
            final_penalty = weather_monitor.get_weather_penalty(final_coord[0], final_coord[1])
            vision_confidence = 0.95 if final_penalty['status'] in ["CLEAR", "MODERATE"] else 0.42
            safe_to_drop = vision_confidence > 0.8
            
            if not safe_to_drop:
                print(f"👁️ [EDGE AI] Dropzone Obstructed (Confidence: {vision_confidence}). Entering HOVER state for {delivery_id}.")
                for _ in range(10):
                    await websocket.send_text(json.dumps({
                        "delivery_id": delivery_id, 
                        "status": "HOVERING",
                        "telemetry": {"latitude": final_coord[0], "longitude": final_coord[1], "altitude_m": 15.0, "battery": round(battery, 1)}
                    }))
                    await asyncio.sleep(1.0)
                print(f"👁️ [EDGE AI] Dropzone cleared. Executing tactical landing.")
            
            drop_alt = 0.0
            drop_status = "ARRIVED_AT_DROPZONE"
            kcaa_event = "LANDING"
        
        # 📝 KCAA LOG: LANDING AND DB UPDATES
        async with AsyncSessionLocal() as db_update:
            db_update.add(KCAALog(delivery_id=delivery_id, event_type=kcaa_event, latitude=final_coord[0], longitude=final_coord[1], altitude_m=drop_alt))
            
            # Update Delivery Record
            del_res = await db_update.execute(select(DeliveryRecord).where(DeliveryRecord.id == delivery_id))
            del_rec = del_res.scalars().first()
            if del_rec:
                del_rec.status = "ARRIVED_AT_DROPZONE"
                
                # --- PHASE 13: CRYPTOGRAPHIC PROOF OF DELIVERY ---
                import hashlib
                from datetime import datetime
                signature_payload = f"{delivery_id}|{del_rec.destination_lat}|{del_rec.destination_lon}|{del_rec.customer_id}|{datetime.now().isoformat()}"
                del_rec.crypto_signature = hashlib.sha256(signature_payload.encode()).hexdigest()
                print(f"🔐 [LEDGER] Proof of Delivery Generated: {del_rec.crypto_signature}")
                
                # Update Drone Maintenance
                # We assume a naive mapping where the Drone assigned is handled. 
                # Currently we don't strict-bind drones in the telemetry loop, but we can assign miles to a random active drone to simulate wear.
                drone_res = await db_update.execute(select(Drone).where(Drone.status == "EN_ROUTE").limit(1))
                drone = drone_res.scalars().first()
                if not drone:
                    # Fallback to any drone
                    drone_res = await db_update.execute(select(Drone).limit(1))
                    drone = drone_res.scalars().first()
                    
                if drone:
                    # Calculate distance
                    from app.services.a_star_planner import FlightPathPlanner
                    planner = FlightPathPlanner()
                    dist = sum(planner.haversine(dynamic_route[i][0], dynamic_route[i][1], dynamic_route[i+1][0], dynamic_route[i+1][1]) for i in range(len(dynamic_route)-1))
                    
                    drone.distance_flown_km += dist
                    
                    # --- PHASE 15: AUTONOMOUS MAINTENANCE BAYS ---
                    needs_repair = False
                    if drone.distance_flown_km >= 500.0:
                        needs_repair = True
                        
                    if abnormal_drain_events > 5:
                        drone.battery_health_pct -= 0.5
                    elif abnormal_drain_events > 0:
                        drone.battery_health_pct -= 0.1
                        
                    if drone.battery_health_pct < 80.0:
                        needs_repair = True
                        
                    if needs_repair:
                        print(f"🔧 [ROBOTIC BAY ENGAGED] {drone.id} routed to Autonomous Hub. Hot-swapping hardware...")
                        drone.distance_flown_km = 0.0
                        drone.battery_health_pct = 100.0
                        drone.needs_maintenance = False
                        drone.status = "IDLE"
                        print(f"✅ [MAINTENANCE COMPLETE] {drone.id} fully repaired. Returning to active fleet.")
                
                # --- AVENUE 3: B2B WEBHOOK TRIGGER ---
                # Check if the company has a registered webhook
                user_res = await db_update.execute(select(User).where(User.company_id == del_rec.company_id))
                enterprise = user_res.scalars().first()
                if enterprise and enterprise.webhook_url:
                    import httpx
                    import asyncio
                    async def fire_webhook(url: str, payload: dict):
                        try:
                            async with httpx.AsyncClient() as client:
                                await client.post(url, json=payload, timeout=5.0)
                                print(f"🔗 [B2B WEBHOOK] Fired successfully to {url}")
                        except Exception as e:
                            print(f"🔗 [B2B WEBHOOK ERROR] Failed to hit {url}: {e}")
                    
                    asyncio.create_task(fire_webhook(enterprise.webhook_url, {
                        "delivery_id": delivery_id,
                        "status": drop_status,
                        "final_distance_km": del_rec.distance_km
                    }))
                    
                # --- PHASE 11: DECENTRALIZED FRANCHISE PAYOUTS ---
                if enterprise and enterprise.is_franchise:
                    payout = del_rec.estimated_cost * 0.85 # 85% goes to the franchisee
                    enterprise.franchise_earnings += payout
                    print(f"💰 [FRANCHISE PAYOUT] {enterprise.company_id} earned {round(payout, 2)} KES. Tustar Network fee: {round(del_rec.estimated_cost * 0.15, 2)} KES")
                        
            await db_update.commit()

        await websocket.send_text(json.dumps({
            "delivery_id": delivery_id, "status": drop_status,
            "telemetry": {"latitude": final_coord[0], "longitude": final_coord[1], "altitude_m": drop_alt, "battery": round(battery, 1)}
        }))
        await websocket.close()
    except WebSocketDisconnect:
        print(f"Telemetry client disconnected: {delivery_id}")

# --- NEW: WEBRTC SIGNALING SERVER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections and websocket in self.active_connections[room_id]:
            self.active_connections[room_id].remove(websocket)

    async def broadcast(self, message: str, room_id: str, sender: WebSocket):
        for connection in self.active_connections.get(room_id, []):
            if connection != sender:
                await connection.send_text(message)

webrtc_manager = ConnectionManager()

@router.websocket("/webrtc/{drone_id}")
async def webrtc_signaling(websocket: WebSocket, drone_id: str):
    """Introduces the drone camera to the Next.js dashboard."""
    await webrtc_manager.connect(websocket, drone_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Pass the connection data to the other peer in the room
    except WebSocketDisconnect:
        webrtc_manager.disconnect(websocket, drone_id)

# --- NEW: HARDWARE SYNC (MAVLink Bridge) ---
class HardwareTelemetry(BaseModel):
    drone_id: str
    latitude: float
    longitude: float
    altitude_m: float
    battery: float
    status: str

# In-memory storage for active hardware drones
active_hardware_drones = {}

@router.post("/hardware-sync")
async def receive_hardware_telemetry(payload: HardwareTelemetry):
    """
    Receives raw MAVLink telemetry from the Python MAVLink Bridge.
    Allows real physical drones to appear on the Mission Control Dashboard.
    """
    active_hardware_drones[payload.drone_id] = {
        "coords": [payload.latitude, payload.longitude],
        "alt": f"{round(payload.altitude_m)}m",
        "battery": payload.battery,
        "status": payload.status,
        "last_seen": asyncio.get_event_loop().time()
    }
    
    # Optional: Broadcast to WebRTC / Telemetry WebSockets if needed
    
    return {"status": "synced"}