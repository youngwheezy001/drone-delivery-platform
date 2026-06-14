import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Package, MapPin, Navigation, Clock } from 'lucide-react';

const ACTIVE_IP = "10.0.13.206"; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${ACTIVE_IP}:8000`;
const WS_URL = BACKEND_URL.replace('http', 'ws');

// Using the same Mapbox token as OperationalMap
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface LiveTrackerProps {
  deliveryId: string | null;
}

export const LiveTracker: React.FC<LiveTrackerProps> = ({ deliveryId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const droneMarker = useRef<mapboxgl.Marker | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const [status, setStatus] = useState("PREPARING");
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [36.7884, -1.2921], // Tustar HQ Default
      zoom: 14,
      pitch: 60,
      bearing: -20,
    });

    const el = document.createElement('div');
    el.className = 'w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.5)] border-2 border-black';
    el.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>';

    droneMarker.current = new mapboxgl.Marker({ element: el })
      .setLngLat([36.7884, -1.2921])
      .addTo(map.current);

    return () => map.current?.remove();
  }, []);

  // Poll for delivery status to get the route and overall status
  useEffect(() => {
    if (!deliveryId) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/deliveries/history/user_master_admin`); 
        // Note: For real prod we would fetch by delivery_id directly.
      } catch (e) {}
    };
    
    // Connect to Telemetry WebSocket
    const fullUrl = `${WS_URL}/api/v1/telemetry/stream/${deliveryId}`;
    ws.current = new WebSocket(fullUrl);

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const { lat, lon, status: droneStatus, eta_seconds } = data.telemetry;
        
        setStatus(droneStatus);
        setEta(eta_seconds);

        if (droneMarker.current && map.current) {
          droneMarker.current.setLngLat([lon, lat]);
          map.current.flyTo({ center: [lon, lat], speed: 0.5, zoom: 15 });
        }
      } catch (err) {}
    };

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [deliveryId]);

  if (!deliveryId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4 mt-20">
         <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-600" />
         </div>
         <h2 className="text-xl font-black text-white">No active deliveries</h2>
         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest max-w-[200px]">When you place an order, track it live here.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Top Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      
      {/* HUD Panel */}
      <div className="absolute bottom-28 left-6 right-6">
         <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col gap-6">
            
            <div className="flex justify-between items-center pb-6 border-b border-white/5">
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status === 'IN_FLIGHT' ? 'bg-cyan-500/10' : 'bg-yellow-500/10'}`}>
                     <Navigation className={`w-6 h-6 ${status === 'IN_FLIGHT' ? 'text-cyan-400' : 'text-yellow-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                       {status.replace('_', ' ')}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">UAV-ALPHA • Order #{deliveryId.split('-')[0]}</p>
                  </div>
               </div>
               
               {eta !== null && (
                 <div className="text-right">
                    <p className="text-2xl font-black text-white">{Math.ceil(eta / 60)}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">MINS</p>
                 </div>
               )}
            </div>

            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                 <Package className="w-4 h-4 text-gray-400" />
               </div>
               <div className="flex-1">
                 <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full w-1/2 animate-pulse" />
                 </div>
               </div>
               <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                 <MapPin className="w-4 h-4 text-cyan-400" />
               </div>
            </div>

         </div>
      </div>
    </div>
  );
};
