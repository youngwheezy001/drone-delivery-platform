import time
from typing import List, Dict, Tuple, Optional
from datetime import datetime

class AirspaceRegistry:
    """
    SWARM INTELLIGENCE V3: TACTICAL AIRSPACE REGISTRY
    Tracks reserved spatio-temporal waypoints to prevent mid-air collisions in high-density sectors.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AirspaceRegistry, cls).__new__(cls)
            cls._instance.reservations = {} # mission_id -> List[Tuple(lat, lon, timestamp)]
            cls._instance.safety_buffer_km = 0.05 # 50 meters
            cls._instance.live_radar_feed = {} # mission_id -> {lat, lon, alt, status}
        return cls._instance

    def update_live_radar(self, mission_id: str, lat: float, lon: float, altitude: float, status: str):
        """Updates the live position of a drone on the global radar."""
        self.live_radar_feed[mission_id] = {
            "lat": lat,
            "lon": lon,
            "altitude": altitude,
            "status": status,
            "updated_at": time.time()
        }

    def is_collision_imminent(self, my_mission_id: str, my_lat: float, my_lon: float) -> bool:
        """Detects if any other drone is occupying the same immediate airspace."""
        for other_id, pos in self.live_radar_feed.items():
            if other_id != my_mission_id and pos["status"] == "IN_TRANSIT":
                dist = self._calculate_dist((my_lat, my_lon), (pos["lat"], pos["lon"]))
                if dist < self.safety_buffer_km:
                    return True
        return False

    def reserve_path(self, mission_id: str, path: List[Tuple[float, float]], start_time: datetime):
        """Reserves a space-time corridor for a new mission."""
        waypoints = []
        # Simulate time-at-waypoint based on 60km/h (1km per minute)
        current_time = start_time.timestamp()
        
        last_p = path[0]
        for p in path:
            dist = self._calculate_dist(last_p, p)
            travel_time = (dist / 60.0) * 3600 # seconds
            current_time += travel_time
            waypoints.append((p[0], p[1], current_time))
            last_p = p
            
        self.reservations[mission_id] = waypoints

    def clear_mission(self, mission_id: str):
        """Releases airspace after mission completion."""
        if mission_id in self.reservations:
            del self.reservations[mission_id]
        if mission_id in self.live_radar_feed:
            del self.live_radar_feed[mission_id]

    def get_dynamic_obstacles(self, at_timestamp: float) -> List[Dict]:
        """Returns estimated drone positions at a specific timestamp as circular geofences."""
        obstacles = []
        for mid, waypoints in self.reservations.items():
            # Find the closest waypoint for this time
            for i in range(len(waypoints) - 1):
                w1 = waypoints[i]
                w2 = waypoints[i+1]
                if w1[2] <= at_timestamp <= w2[2]:
                    # Interpolate position
                    t = (at_timestamp - w1[2]) / (w2[2] - w1[2]) if w2[2] != w1[2] else 0
                    lat = w1[0] + (w2[0] - w1[0]) * t
                    lon = w1[1] + (w2[1] - w1[1]) * t
                    obstacles.append({
                        "id": mid,
                        "lat": lat,
                        "lon": lon,
                        "radius_km": self.safety_buffer_km
                    })
                    break
        return obstacles

    def _calculate_dist(self, p1, p2):
        lat1, lon1 = map(float, p1)
        lat2, lon2 = map(float, p2)
        # Haversine approximation
        return math.sqrt((lat1-lat2)**2 + (lon1-lon2)**2) * 111.0 # Rough km

import math
airspace_registry = AirspaceRegistry()
