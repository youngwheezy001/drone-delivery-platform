export interface Order {
  id: string;
  customer_id: string;
  status: string;
  estimated_cost?: number;
  progress?: number;
  scheduled_at?: string;
}

export interface Metrics {
  flightsToday: number;
  revenueToday: string;
  avgPrepTime: string;
}
