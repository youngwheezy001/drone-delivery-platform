import math
import time
from typing import Tuple, Dict

class WeatherService:
    """
    Environmental Navigation Service.
    Synchronizes backend physics with the frontend procedural radar.
    """
    def __init__(self, hq_lat: float, hq_lon: float):
        self.hq_lat = hq_lat
        self.hq_lon = hq_lon
        self.storm_radius_km = 4.5 # ~0.04 degrees approx
        
    def get_storm_center(self) -> Tuple[float, float]:
        """
        Calculates the storm center based on a 1000-second loop.
        Matches the frontend 'weatherOffset' procedural logic.
        """
        # Frontend: weatherOffset = (prev + 0.001) % 1 every frame (~16ms)
        # So it completes a loop in ~1000 frames * 16ms = 16 seconds?
        # Let's use a 60-second loop for stability.
        loop_duration = 60.0
        offset = (time.time() % loop_duration) / loop_duration
        
        # Match OperationalMap.tsx: 
        # center = [hqLocation[1] + (weatherOffset * 0.1), hqLocation[0] + (weatherOffset * 0.05)]
        storm_lon = self.hq_lon + (offset * 0.1)
        storm_lat = self.hq_lat + (offset * 0.05)
        
        return storm_lat, storm_lon

    def haversine(self, lat1, lon1, lat2, lon2):
        R = 6371.0
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def get_weather_penalty(self, drone_lat: float, drone_lon: float) -> Dict:
        """
        Returns multipliers for battery drain and speed based on storm proximity.
        """
        s_lat, s_lon = self.get_storm_center()
        dist = self.haversine(drone_lat, drone_lon, s_lat, s_lon)
        
        if dist < self.storm_radius_km:
            # 🌩️ INSIDE STORM: Extreme degradation
            return {
                "in_storm": True,
                "drain_multiplier": 2.5,
                "speed_multiplier": 0.6,
                "status": "ENVIRONMENTAL_TURBULENCE: HIGH",
                "intensity": 0.8
            }
        
        return {
            "in_storm": False,
            "drain_multiplier": 1.0,
            "speed_multiplier": 1.0,
            "status": "OPERATIONAL_CLIMATE: CLEAR",
            "intensity": 0.1
        }

# Singleton instance
from app.core.config import settings
weather_monitor = WeatherService(settings.HQ_LAT, settings.HQ_LON)
