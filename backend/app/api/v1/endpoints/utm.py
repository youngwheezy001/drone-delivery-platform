from fastapi import APIRouter
from typing import Dict, Any
from app.services.airspace_registry import airspace_registry

router = APIRouter()

@router.get("/broadcast", response_model=Dict[str, Any])
async def get_utm_broadcast():
    """
    AVENUE 2: UTM Interoperability API
    Broadcasts the live location of all active drones in the Tustar network.
    Formatted as a standard GeoJSON FeatureCollection for ingestion by National Airspace Radars (e.g., KCAA, FAA).
    """
    features = []
    
    for mission_id, pos in airspace_registry.live_radar_feed.items():
        if pos.get("status") == "IN_TRANSIT":
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [pos["lon"], pos["lat"]] # GeoJSON expects [longitude, latitude]
                },
                "properties": {
                    "drone_id": mission_id,
                    "altitude_m": pos["altitude"],
                    "status": pos["status"],
                    "updated_at": pos["updated_at"]
                }
            })
            
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    return geojson
