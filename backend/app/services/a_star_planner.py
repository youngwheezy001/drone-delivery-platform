import math
from typing import List, Tuple, Dict, Optional

class FlightPathPlanner:
    """
    Calculates direct flight vectors for drones, ensuring the path 
    does not intersect any KCAA exclusion zones.
    """
    def __init__(self):
        self.earth_radius_km = 6371.0

    def haversine(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates distance between GPS coordinates."""
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return self.earth_radius_km * c

    def is_collision(self, point: Tuple[float, float], obstacles: List[Dict]) -> bool:
        """Checks if a coordinate breaches a geofence radius."""
        for obs in obstacles:
            if self.haversine(point[0], point[1], obs['lat'], obs['lon']) < obs['radius_km']:
                return True
        return False

    async def calculate_optimal_path(
        self, start: Tuple[float, float], goal: Tuple[float, float], obstacles: List[Dict]
    ) -> Optional[List[Tuple[float, float]]]:
        """
        Generates a straight-line flight path and checks it against KCAA zones.
        """
        steps = 20 # Divide the flight into 20 segments
        lat_step = (goal[0] - start[0]) / steps
        lon_step = (goal[1] - start[1]) / steps
        
        path = []
        for i in range(steps + 1):
            waypoint = (start[0] + (lat_step * i), start[1] + (lon_step * i))
            
            # If the direct line clips an exclusion zone at any point, ground the drone!
            if self.is_collision(waypoint, obstacles):
                return None
                
            path.append((round(waypoint[0], 5), round(waypoint[1], 5)))
            
        return path