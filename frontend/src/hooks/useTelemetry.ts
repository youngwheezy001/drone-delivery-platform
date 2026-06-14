import { useEffect, useRef } from 'react';
import { useMissionStore } from '../lib/store';
import { MissionStatus } from '../types';

export const useTelemetry = (wsUrl: string, activeDeliveryId: string | null) => {
  const updateDroneTelemetry = useMissionStore((state) => state.updateDroneTelemetry);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!activeDeliveryId) {
      if (ws.current) ws.current.close();
      return;
    }

    const fullUrl = `${wsUrl}/api/v1/telemetry/stream/${activeDeliveryId}`;
    console.log(`🛰️ Dashboard Connecting: ${fullUrl}`);
    
    ws.current = new WebSocket(fullUrl);

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        updateDroneTelemetry(data.delivery_id, data.telemetry);
      } catch (err) {
        console.error("Dashboard Telemetry Parse Error", err);
      }
    };

    ws.current.onerror = (e) => console.log("Dashboard Telemetry Error", e);
    ws.current.onclose = () => console.log("Dashboard Telemetry Link Terminated");

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [wsUrl, activeDeliveryId, updateDroneTelemetry]);
};

