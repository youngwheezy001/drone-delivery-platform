import math
from typing import Dict

class StrategicPricingEngine:
    """
    Economic Intelligence Layer.
    Calculates dynamic srucharges based on network congestion indices.
    """
    def __init__(self, base_cost: float = 100.0, per_km_rate: float = 50.0):
        self.base_cost = base_cost
        self.per_km_rate = per_km_rate
        self.capacity_threshold = 10 # missions before surge
        
    def calculate_mission_cost(self, distance_km: float, active_missions: int, regional_congestion: float = 0.0, fleet_utilization: float = 0.0) -> Dict:
        """
        Computes the total mission yield including compound hub/regional congestion multipliers.
        """
        raw_cost = self.base_cost + (distance_km * self.per_km_rate)
        
        # --- HUB SURGE LOGIC ---
        congestion_index = min(active_missions / self.capacity_threshold, 1.0)
        surge_multiplier = 1.0 + (congestion_index * 0.30)
        
        # --- REGIONAL SURGE LOGIC ---
        # regional_congestion expect 0.0 to 1.0
        regional_surge = 1.0 + (regional_congestion * 0.20) # Max 20% regional surcharge
        
        # --- GLOBAL SURGE LOGIC (Phase 10) ---
        global_surge = 1.0
        if fleet_utilization > 0.75:
            global_surge = 1.5
        elif fleet_utilization > 0.90:
            global_surge = 2.0
            
        final_cost = round(raw_cost * surge_multiplier * regional_surge * global_surge, 2)
        surcharge = round(final_cost - raw_cost, 2)
        
        return {
            "base_cost": round(raw_cost, 2),
            "hub_surge_multiplier": round(surge_multiplier, 2),
            "regional_surge_multiplier": round(regional_surge, 2),
            "global_surge_multiplier": round(global_surge, 2),
            "total_yield": final_cost,
            "surcharge_impact": surcharge
        }

# Singleton instance for high-fidelity pricing
pricing_engine = StrategicPricingEngine()
