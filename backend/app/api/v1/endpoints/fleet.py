import math
from fastapi import APIRouter, Depends
from typing import List
from pydantic import BaseModel

router = APIRouter()

class DroneResponse(BaseModel):
    id: str
    org: str
    battery: int
    alt: str
    speed: str
    coords: List[float] # [Lat, Lon]
    status: str
    has_conflict: bool = False
    congestion_factor: float = 0.0

def calculate_distance(p1, p2):
    R = 6371.0 # Radius of Earth in km
    lat1, lon1 = map(math.radians, p1)
    lat2, lon2 = map(math.radians, p2)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.get("/status", response_model=List[DroneResponse])
async def get_fleet_status():
    """Fetch the real-time operational status of the entire UAV fleet with AI-Adaptive Speed."""
    base_fleet = [
        {"id": "DRONE-ALPHA", "org": "Tustar Prime", "battery": 92, "alt": "124m", "base_speed": 52, "coords": [-1.2921, 36.7884], "status": "IN_FLIGHT"},
        {"id": "DRONE-BETA", "org": "City Grub", "battery": 45, "alt": "0m", "base_speed": 0, "coords": [-1.2940, 36.7900], "status": "CHARGING"},
        {"id": "DRONE-GAMMA", "org": "Medical-Express", "battery": 78, "alt": "45m", "base_speed": 34, "coords": [-1.2880, 36.8100], "status": "IN_FLIGHT"},
        {"id": "DRONE-OSCAR", "org": "Tustar Security", "battery": 60, "alt": "120m", "base_speed": 50, "coords": [-1.2925, 36.7886], "status": "IN_FLIGHT"}
    ]

    fleet = []
    CONFLICT_THRESHOLD_KM = 0.20 # 200 Meters
    CONGESTION_THRESHOLD_KM = 0.50 # 500 Meters

    for i, drone in enumerate(base_fleet):
        neighbors = 0
        has_conflict = False
        
        for j, other in enumerate(base_fleet):
            if i == j: continue
            dist = calculate_distance(drone['coords'], other['coords'])
            if dist < CONGESTION_THRESHOLD_KM:
                neighbors += 1
            if dist < CONFLICT_THRESHOLD_KM:
                has_conflict = True

        # AI 2.2: Traffic Adaptive Speed Logic
        # Throttles speed based on neighbor density (20% reduction per neighbor)
        congestion_lvl = min(neighbors * 0.25, 1.0)
        speed_factor = max(1.0 - (neighbors * 0.20), 0.1) # Floor at 10%
        final_speed = int(drone['base_speed'] * speed_factor) if drone['base_speed'] > 0 else 0
        
        # Ensure a 'Safe Crawl' floor of 8 km/h for active flight in congestion
        if drone['status'] == "IN_FLIGHT" and final_speed < 8:
            final_speed = 8

        fleet.append({
            "id": drone['id'],
            "org": drone['org'],
            "battery": drone['battery'],
            "alt": drone['alt'],
            "speed": f"{final_speed} km/h",
            "coords": drone['coords'],
            "status": drone['status'],
            "has_conflict": has_conflict,
            "congestion_factor": float(congestion_lvl)
        })

    return fleet
