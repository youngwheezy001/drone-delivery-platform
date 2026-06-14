export type MissionStatus = 'PREPARING' | 'IN_TRANSIT' | 'ARRIVED' | 'DELIVERED' | 'SCHEDULED' | 'ROUTE_CALCULATED' | 'DISPATCHED';

export interface DeliveryMission {
  id: string;
  customer_id: string;
  company_id: string;
  status: MissionStatus;
  scheduled_at?: string;
  created_at: string;
  package_weight_kg: number;
  route_json?: [number, number][];
}

export interface GlobalStats {
  total_missions: number;
  active_hubs: number;
  total_revenue: number;
  success_rate: number;
}
