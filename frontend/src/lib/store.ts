export type LogLevel = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
}

interface MissionState {
  // Data
  hubs: Hub[];
  activeOrders: DeliveryMission[];
  scheduledOrders: DeliveryMission[];
  stats: GlobalStats;
  fleet: Drone[];
  logs: LogEntry[];
  
  // Auth
  accessToken: string | null;
  isAuthenticated: boolean;

  // HUD / UI State
  selectedHub: string;
  heatmapMode: boolean;
  manualDroneIds: string[];
  selectedDroneId: string | null;
  selectedMissionIds: string[];

  // Actions
  setHubs: (hubs: Hub[]) => void;
  setActiveOrders: (orders: DeliveryMission[]) => void;
  setScheduledOrders: (orders: DeliveryMission[]) => void;
  setStats: (stats: GlobalStats) => void;
  setFleet: (fleet: Drone[]) => void;
  addLog: (message: string, level: LogLevel) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
  
  setSelectedHub: (id: string) => void;
  toggleHeatmap: () => void;
  toggleManualDrone: (id: string) => void;
  setSelectedDroneId: (id: string | null) => void;
  toggleMissionSelection: (id: string) => void;
  clearMissionSelection: () => void;

  // Live Telemetry Sync
  updateDroneTelemetry: (deliveryId: string, telemetry: DroneTelemetry) => void;
}

import { create } from 'zustand';
import { Hub, GlobalStats, DeliveryMission, Drone, DroneTelemetry } from '../types';

export const useMissionStore = create<MissionState>((set) => ({
  hubs: [],
  activeOrders: [],
  scheduledOrders: [],
  stats: { total_missions: 0, active_hubs: 0, total_revenue: 0, success_rate: 98.5 },
  fleet: [
    { id: "UAV-ALPHA", org: "TUSTAR_HQ", battery: 84, alt: "120m", speed: "65km/h", coords: [-1.2900, 36.7880], status: 'IN_FLIGHT' },
    { id: "UAV-BRAVO", org: "TUSTAR_HQ", battery: 42, alt: "80m", speed: "40km/h", coords: [-1.2940, 36.7850], status: 'IN_FLIGHT' },
    { id: "UAV-CHARLIE", org: "MED_RESPONSE", battery: 98, alt: "0m", speed: "0km/h", coords: [-1.2910, 36.7900], status: 'READY' },
    { id: "UAV-DELTA", org: "TUSTAR_HQ", battery: 15, alt: "45m", speed: "50km/h", coords: [-1.3000, 36.7800], status: 'IN_FLIGHT' },
    { id: "UAV-ECHO", org: "LOGISTICS_N", battery: 100, alt: "0m", speed: "0km/h", coords: [-1.2850, 36.7900], status: 'CHARGING' },
  ],
  logs: [],

  accessToken: typeof window !== 'undefined' ? localStorage.getItem('mission_token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('mission_token') : false,
  
  selectedHub: 'ALL_NETWORK',
  heatmapMode: false,
  manualDroneIds: [],
  selectedDroneId: null,
  selectedMissionIds: [],

  setHubs: (hubs) => set({ hubs }),
  setActiveOrders: (activeOrders) => set({ activeOrders }),
  setScheduledOrders: (scheduledOrders) => set({ scheduledOrders }),
  setStats: (stats) => set({ stats }),
  setFleet: (fleet) => set({ fleet }),

  setAccessToken: (token) => {
     if (typeof window !== 'undefined') {
       if (token) localStorage.setItem('mission_token', token);
       else localStorage.removeItem('mission_token');
     }
     set({ accessToken: token, isAuthenticated: !!token });
  },

  logout: () => {
     if (typeof window !== 'undefined') localStorage.removeItem('mission_token');
     set({ accessToken: null, isAuthenticated: false });
  },
  
  addLog: (message, level) => set((state) => ({
    logs: [
      {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        level,
        message
      },
      ...state.logs
    ].slice(0, 100)
  })),

  setSelectedHub: (selectedHub) => set({ selectedHub }),
  toggleHeatmap: () => set((state) => ({ heatmapMode: !state.heatmapMode })),
  toggleManualDrone: (id) => set((state) => ({
    manualDroneIds: state.manualDroneIds.includes(id)
      ? state.manualDroneIds.filter(mid => mid !== id)
      : [...state.manualDroneIds, id]
  })),
  setSelectedDroneId: (selectedDroneId) => set({ selectedDroneId }),

  toggleMissionSelection: (id) => set((state) => ({
    selectedMissionIds: state.selectedMissionIds.includes(id)
      ? state.selectedMissionIds.filter(mid => mid !== id)
      : [...state.selectedMissionIds, id]
  })),

  clearMissionSelection: () => set({ selectedMissionIds: [] }),

  updateDroneTelemetry: (deliveryId, telemetry) => set((state) => ({
    activeOrders: state.activeOrders.map(o => 
      o.id === deliveryId ? { ...o, lastTelemetry: telemetry } : o
    )
  }))
}));

