import time
import math
from typing import List, Dict, Tuple
from app.services.weather_service import weather_monitor

class MissionValidator:
    """
    AI LOGISTICS ENGINE: Predictive Mission Analysis.
    Calculates mission feasibility by projecting future storm trajectories
    against planned flight paths.
    """
    def __init__(self):
        self.drone_speed_kmh = 50.0 # Average flight speed
        self.base_drain_per_min = 1.0 # 1% battery per minute base
        self.storm_radius_km = weather_monitor.storm_radius_km

    def get_future_storm_center(self, minutes_from_now: float) -> Tuple[float, float]:
        """
        Predicts where the storm will be in N minutes.
        Matches the 60s looping logic of WeatherService.
        """
        loop_duration = 60.0
        # Time is in seconds, minutes_from_now to seconds
        future_time = time.time() + (minutes_from_now * 60.0)
        offset = (future_time % loop_duration) / loop_duration
        
        storm_lon = weather_monitor.hq_lon + (offset * 0.1)
        storm_lat = weather_monitor.hq_lat + (offset * 0.05)
        
        return storm_lat, storm_lon

    def validate_route_risk(self, route: List[List[float]], start_delay_min: float = 0) -> Dict:
        """
        Simulates a flight across the route coordinates.
        Checks for storm overlap at each waypoint's arrival time.
        """
        if not route:
            return {"risk_score": 0, "status": "NO_ROUTE"}

        total_est_drain = 0.0
        elapsed_min = start_delay_min
        storm_hits = 0
        total_dist_km = 0.0

        for i in range(len(route) - 1):
            p1 = route[i]
            p2 = route[i+1]
            dist = weather_monitor.haversine(p1[0], p1[1], p2[0], p2[1])
            total_dist_km += dist
            
            # Travel time to next waypoint
            # We start with base speed, but if we're in a storm we slow down
            current_s_lat, current_s_lon = self.get_future_storm_center(elapsed_min)
            d_to_storm = weather_monitor.haversine(p1[0], p1[1], current_s_lat, current_s_lon)
            
            in_storm = d_to_storm < self.storm_radius_km
            speed_mult = 0.6 if in_storm else 1.0
            drain_mult = 2.5 if in_storm else 1.0
            
            if in_storm: storm_hits += 1
            
            leg_time_min = (dist / (self.drone_speed_kmh * speed_mult)) * 60.0
            total_est_drain += (leg_time_min * self.base_drain_per_min * drain_mult)
            elapsed_min += leg_time_min

        # Calculate Risk Score (0-100)
        # Score increases based on storm overlap and total battery requirements
        risk_score = min(100, int((total_est_drain / 80.0) * 100)) # Assuming 80% is the soft safety limit
        
        status = "NOMINAL"
        if risk_score > 70: status = "CRITICAL_RISK"
        elif risk_score > 40: status = "WEATHER_ADVISORY"
        elif storm_hits > 0: status = "TURBULENCE_DETECTED"

        return {
            "risk_score": risk_score,
            "status": status,
            "est_battery_drain": round(total_est_drain, 1),
            "est_flight_time_min": round(elapsed_min - start_delay_min, 1),
            "storm_overlap_points": storm_hits
        }

    def calculate_optimal_window(self, route: List[List[float]]) -> Dict:
        """
        Scans the next 60 minutes for the best dispatch window.
        """
        windows = []
        for delay in range(0, 61, 5): # Check every 5 mins
            analysis = self.validate_route_risk(route, start_delay_min=delay)
            windows.append({
                "delay_min": delay,
                "risk_score": analysis['risk_score'],
                "status": analysis['status']
            })
        
        # Sort by lowest risk score
        recommendation = min(windows, key=lambda x: x['risk_score'])
        return {
            "best_departure_delay": recommendation['delay_min'],
            "predicted_risk": recommendation['risk_score'],
            "all_windows": windows
        }

# Singleton instance
ai_logistics = MissionValidator()
