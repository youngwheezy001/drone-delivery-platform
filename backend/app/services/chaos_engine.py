import asyncio
import random
import time
from typing import List, Dict

class ChaosEngine:
    """
    Simulates dynamic, unpredictable events in the airspace.
    Generates temporary 'No-Fly Zones' (VIP movement) or 'Micro-Storms'.
    """
    def __init__(self):
        self.active_zones: List[Dict] = []
        self._task = None

    def start(self):
        if not self._task:
            self._task = asyncio.create_task(self._loop())

    async def _loop(self):
        # Base bounds for Nairobi operations
        min_lat, max_lat = -1.35, -1.20
        min_lon, max_lon = 36.70, 36.90
        
        while True:
            # Clean expired zones
            current_time = time.time()
            self.active_zones = [z for z in self.active_zones if z["expires_at"] > current_time]
            
            # 20% chance every 30s to spawn a new chaos zone
            if random.random() < 0.20 and len(self.active_zones) < 3:
                lat = random.uniform(min_lat, max_lat)
                lon = random.uniform(min_lon, max_lon)
                radius_km = random.uniform(0.5, 2.0)
                
                zone_type = random.choice(["NO_FLY_ZONE", "MICRO_STORM"])
                duration = random.randint(60, 300) # 1 to 5 minutes
                
                self.active_zones.append({
                    "id": f"ZON-{random.randint(1000,9999)}",
                    "type": zone_type,
                    "latitude": lat,
                    "longitude": lon,
                    "radius_km": radius_km,
                    "expires_at": current_time + duration
                })
                print(f"🌪️ [CHAOS ENGINE] New {zone_type} detected at {lat:.4f}, {lon:.4f} (Radius: {radius_km:.1f}km)")

            await asyncio.sleep(30)

    def get_zones(self):
        return self.active_zones

chaos_engine = ChaosEngine()
