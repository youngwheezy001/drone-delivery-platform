import time
import requests
from pymavlink import mavutil
import logging

logging.basicConfig(level=logging.INFO)

# Tustar Command Platform Backend
BACKEND_URL = "http://127.0.0.1:8000"
DRONE_ID = "DRONE-ALPHA"  # Which platform drone this hardware corresponds to

def start_mavlink_bridge(connection_string="udp:127.0.0.1:14550"):
    """
    Connects to a physical MAVLink drone (or SITL simulator) via UDP/Serial
    and forwards its telemetry to the Tustar Mission Control API.
    """
    logging.info(f"🛸 [MAVLink Bridge] Connecting to {connection_string}...")
    
    # Start MAVLink Connection
    master = mavutil.mavlink_connection(connection_string)
    
    # Wait for the first heartbeat to confirm connection
    master.wait_heartbeat()
    logging.info(f"❤️ [MAVLink Bridge] Heartbeat received from system {master.target_system} component {master.target_component}")
    
    while True:
        try:
            # Request GLOBAL_POSITION_INT (GPS + Altitude)
            msg = master.recv_match(type='GLOBAL_POSITION_INT', blocking=True, timeout=5.0)
            if not msg:
                continue
                
            # Parse MAVLink telemetry
            lat = msg.lat / 1e7
            lon = msg.lon / 1e7
            alt_m = msg.relative_alt / 1000.0  # mm to meters
            
            # Fetch Battery (SYS_STATUS)
            bat_msg = master.recv_match(type='SYS_STATUS', blocking=False)
            battery = bat_msg.battery_remaining if bat_msg else 100.0
            
            # Forward to FastAPI Backend
            payload = {
                "drone_id": DRONE_ID,
                "latitude": lat,
                "longitude": lon,
                "altitude_m": alt_m,
                "battery": battery,
                "status": "HARDWARE_UPLINK"
            }
            
            # (Requires adding this endpoint to the backend)
            # res = requests.post(f"{BACKEND_URL}/api/v1/telemetry/hardware-sync", json=payload)
            logging.info(f"📡 [MAVLink Sync] Lat: {lat}, Lon: {lon}, Alt: {alt_m}m, Bat: {battery}%")
            
            time.sleep(1.0) # 1Hz Telemetry Sync Rate
            
        except Exception as e:
            logging.error(f"❌ [MAVLink Error] {e}")
            time.sleep(2)

if __name__ == "__main__":
    start_mavlink_bridge()
