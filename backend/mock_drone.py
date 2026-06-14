import asyncio
import json
import math
import random
import time
import sys
import os
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

MQTT_BROKER_URL = os.getenv("MQTT_BROKER_URL", "broker.hivemq.com")
MQTT_PORT = int(os.getenv("MQTT_PORT", 8883))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")

UAV_ID = "UAV-ALPHA"
TOPIC = f"drones/{UAV_ID}/telemetry"

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("OK: MOCK DRONE: Connected to MQTT Broker!")
    else:
        print(f"ERROR: MOCK DRONE: Connection failed with code {rc}")

def start_telemetry():
    print(f"INFO: MOCK DRONE WAKING UP: Linking to {UAV_ID} via MQTT...")
    
    client = mqtt.Client(client_id=f"tustar-mock-{UAV_ID}", protocol=mqtt.MQTTv5)
    
    if MQTT_USERNAME and MQTT_PASSWORD:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

    if MQTT_PORT == 8883:
        client.tls_set()
        
    client.on_connect = on_connect
    
    try:
        client.connect(MQTT_BROKER_URL, MQTT_PORT, 60)
        client.loop_start()
    except Exception as e:
        print(f"ERROR: Connection error: {e}")
        sys.exit(1)
        
    print("OK: TACTICAL UPLINK SECURED! Injecting Telemetry...")
    
    base_alt = 120.0
    time_t = 0.0
    base_lat = -1.2921
    base_lon = 36.7884
    
    try:
        while True:
            time_t += 0.1
            pitch = math.sin(time_t) * 15 + random.uniform(-1, 1)
            roll = math.cos(time_t * 0.5) * 20 + random.uniform(-2, 2)
            vel = 65.0 + math.sin(time_t * 0.2) * 10
            alt = base_alt + math.cos(time_t * 0.1) * 5
            gforce = 1.0 + abs(math.sin(time_t * 2)) * 0.8
            
            # Simulate flight from JKIA to CBD
            jkia_lat = -1.3321
            jkia_lon = 36.9275
            cbd_lat = -1.2833
            cbd_lon = 36.8167
            
            # Flight progress loop (0.0 to 1.0)
            progress = (time_t * 0.02) % 1.0 
            
            current_lat = jkia_lat + (cbd_lat - jkia_lat) * progress
            current_lon = jkia_lon + (cbd_lon - jkia_lon) * progress
            
            payload = {
                "type": "telemetry",
                "lat": current_lat,
                "lon": current_lon,
                "battery": 85 - int((time_t / 100)), # Battery drains over time
                "data": {
                    "alt": alt,
                    "vel": vel,
                    "gforce": gforce,
                    "pitch": pitch,
                    "roll": roll
                }
            }
            
            client.publish(TOPIC, json.dumps(payload), qos=0)
            time.sleep(0.5) # 2 Hz update rate for MQTT
    except KeyboardInterrupt:
        print("STOP: Engine Shutdown.")
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    t = """
    ======================================
     Nairobi UAV - Mock MQTT Telemetry
    ======================================
    Running this script will stream live
    coordinates and orientation to the 
    MQTT Pipeline!
    ======================================
    """
    print(t)
    start_telemetry()
