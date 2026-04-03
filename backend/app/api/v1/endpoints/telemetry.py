from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from typing import Dict, List

router = APIRouter()

from sqlalchemy import select
from app.models.database import AsyncSessionLocal
from app.models.delivery import DeliveryRecord

def interpolate_points(p1, p2, steps=10):
    lat_step = (p2[0] - p1[0]) / steps
    lon_step = (p2[1] - p1[1]) / steps
    return [[p1[0] + (lat_step * i), p1[1] + (lon_step * i)] for i in range(steps)]

@router.websocket("/stream/{delivery_id}")
async def telemetry_stream(websocket: WebSocket, delivery_id: str):
    """
    A synchronized flight simulator that drives the map markers 
    on both the Customer App and the Mission Control Dashboard.
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
        
        dynamic_route = delivery.route_json # This comes from the planning stage!

    try:
        # 2. Start the simulation based on the REAL route
        smooth_path = []
        for i in range(len(dynamic_route) - 1):
            smooth_path.extend(interpolate_points(dynamic_route[i], dynamic_route[i+1], steps=15))
        smooth_path.append(dynamic_route[-1])

        for coord in smooth_path:
            payload = {
                "delivery_id": delivery_id,
                "status": "IN_TRANSIT",
                "telemetry": {
                    "latitude": coord[0], 
                    "longitude": coord[1], 
                    "altitude_m": 45.0, 
                    "speed_ms": 12.5
                }
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(0.5) 
        
        await websocket.send_text(json.dumps({
            "delivery_id": delivery_id, "status": "ARRIVED",
            "telemetry": {"latitude": dynamic_route[-1][0], "longitude": dynamic_route[-1][1], "altitude_m": 0.0}
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
            await webrtc_manager.broadcast(data, drone_id, websocket)
    except WebSocketDisconnect:
        webrtc_manager.disconnect(websocket, drone_id)