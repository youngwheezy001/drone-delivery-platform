import paho.mqtt.client as mqtt
import os
import json
from dotenv import load_dotenv

load_dotenv()

MQTT_BROKER_URL = os.getenv("MQTT_BROKER_URL", "broker.hivemq.com") # Default to public HiveMQ for testing if none provided
MQTT_PORT = int(os.getenv("MQTT_PORT", 8883))
MQTT_USERNAME = os.getenv("MQTT_USERNAME")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD")

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("OK: [MQTT] Connected to Tustar Telemetry Broker!")
        # Subscribe to all drone telemetry
        client.subscribe("drones/+/telemetry", qos=1)
        print("OK: [MQTT] Subscribed to drones/+/telemetry")
    else:
        print(f"ERROR: [MQTT] Connection failed with code {rc}")

def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode())
        drone_id = topic.split('/')[1]
        
        # Here we would normally ingest this into PostGIS
        print(f"INFO: [MQTT INGEST] {drone_id} -> Lat: {payload.get('lat')}, Lon: {payload.get('lon')}, Batt: {payload.get('battery')}%")
        
    except Exception as e:
        print(f"WARN: [MQTT ERROR] Failed to process message: {e}")

# Initialize Client
# We use protocol v5 for modern HiveMQ Cloud compatibility
client = mqtt.Client(client_id="tustar-backend-core", protocol=mqtt.MQTTv5)

if MQTT_USERNAME and MQTT_PASSWORD:
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

# HiveMQ Cloud requires TLS
if MQTT_PORT == 8883:
    client.tls_set()

client.on_connect = on_connect
client.on_message = on_message

def start_mqtt_client():
    """Starts the MQTT loop in a background thread."""
    print(f"INFO: [MQTT] Connecting to broker at {MQTT_BROKER_URL}:{MQTT_PORT}...")
    try:
        client.connect(MQTT_BROKER_URL, MQTT_PORT, 60)
        client.loop_start()
    except Exception as e:
        print(f"ERROR: [MQTT] Could not connect to broker: {e}")
