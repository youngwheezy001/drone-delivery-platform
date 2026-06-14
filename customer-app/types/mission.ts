export interface MissionPlan {
  estimated_distance_km: number;
  eta_minutes: number;
  route_waypoints: [number, number][];
  total_cost?: number;
  estimated_price_kes?: number;
}
