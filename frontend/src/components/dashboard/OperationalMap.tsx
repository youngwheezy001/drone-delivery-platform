import React, { useMemo, useState, useEffect } from 'react';
import Map, { Marker, Layer, Source, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Hub, Drone, DeliveryMission } from '../../types';
import mqtt from 'mqtt';

interface OperationalMapProps {
  hqLocation: [number, number];
  hubs: Hub[];
  fleet: Drone[];
  activeOrders: DeliveryMission[];
  heatmapPoints: { lat: number; lon: number; intensity?: number }[];
  heatmapMode: boolean;
  setHeatmapMode: (mode: boolean) => void;
  setSelectedDroneId: (id: string | null) => void;
}

// 🛰️ TACTICAL CONFIG: Using OpenFreeMap (Vibrant Liberty Style for High Contrast)
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export const OperationalMap: React.FC<OperationalMapProps> = ({
  hqLocation,
  hubs,
  fleet,
  activeOrders,
  heatmapPoints,
  heatmapMode,
  setHeatmapMode,
  setSelectedDroneId,
}) => {
  const [dashOffset, setDashOffset] = useState(0);
  const [weatherOffset, setWeatherOffset] = useState(0);
  const [hoveredDrone, setHoveredDrone] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState({
    longitude: hqLocation[1],
    latitude: hqLocation[0],
    zoom: 13
  });
  const [mqttFleet, setMqttFleet] = useState<Record<string, { lat: number, lon: number, battery: number }>>({});

  // MQTT Integration
  useEffect(() => {
    const brokerUrl = `wss://${process.env.NEXT_PUBLIC_MQTT_BROKER_URL}:${process.env.NEXT_PUBLIC_MQTT_PORT}/mqtt`;
    const client = mqtt.connect(brokerUrl, {
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      protocol: 'wss'
    });

    client.on('connect', () => {
      client.subscribe('drones/+/telemetry');
    });

    client.on('message', (topic, message) => {
      try {
        const droneId = topic.split('/')[1];
        const payload = JSON.parse(message.toString());
        setMqttFleet(prev => ({
          ...prev,
          [droneId]: { lat: payload.lat, lon: payload.lon, battery: payload.battery }
        }));
      } catch (err) {}
    });

    return () => {
      if (client) client.end();
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 🛰️ TACTICAL SEARCH GEODECODER
    const query = searchQuery.toUpperCase();
    let newCoords: [number, number] | null = null;

    if (query.includes(',') && query.split(',').length === 2) {
       const [lat, lon] = query.split(',').map(s => parseFloat(s.trim()));
       if (!isNaN(lat) && !isNaN(lon)) newCoords = [lat, lon];
    } else if (query === 'JKIA') newCoords = [-1.3321, 36.9275];
    else if (query === 'CBD') newCoords = [-1.2833, 36.8167];
    else if (query === 'WESTLANDS') newCoords = [-1.2633, 36.8033];
    else if (query === 'WILSON') newCoords = [-1.3216, 36.8147];

    if (newCoords) {
      setViewState({ ...viewState, latitude: newCoords[0], longitude: newCoords[1], zoom: 14 });
    }
  };

  // 🔄 TACTICAL ANIMATION: Driving flow and weather
  useEffect(() => {
    let requestRef: number;
    const animate = () => {
      setDashOffset(prev => (prev + 0.05) % 2);
      setWeatherOffset(prev => (prev + 0.001) % 1);
      requestRef = requestAnimationFrame(animate);
    };
    requestRef = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef);
  }, []);

  // 🛰️ DATA TRANSFORM: Missions -> GeoJSON Corridors
  const routeData = useMemo(() => {
    const features = activeOrders
      .filter(m => m.route_json && m.route_json.length > 0)
      .map(m => ({
        type: 'Feature',
        properties: { id: m.id },
        geometry: {
          type: 'LineString',
          coordinates: m.route_json?.map(coord => [coord[1], coord[0]]) // GL uses [Lon, Lat]
        }
      }));

    return { type: 'FeatureCollection', features };
  }, [activeOrders]);

  // 🌩️ TACTICAL WEATHER: Procedural Radar Overlay
  const weatherData = useMemo(() => {
    const center = [hqLocation[1] + (weatherOffset * 0.1), hqLocation[0] + (weatherOffset * 0.05)];
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [center[0] - 0.04, center[1] - 0.04],
          [center[0] + 0.04, center[1] - 0.02],
          [center[0] + 0.05, center[1] + 0.03],
          [center[0] - 0.03, center[1] + 0.04],
          [center[0] - 0.04, center[1] - 0.04]
        ]]
      }
    };
  }, [hqLocation, weatherOffset]);

  return (
    <>
      <div className="absolute top-6 left-6 z-[400] flex items-center gap-4">
        <div className="bg-gray-950/90 backdrop-blur-md px-8 py-5 rounded-[1.5rem] flex items-center gap-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-white/20">
          <div className="flex items-center gap-4 border-r border-white/10 pr-8">
            <div className="w-2.5 h-2.5 bg-red-500 animate-pulse rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-white">
              Situational Awareness Active
            </p>
          </div>
          <div className="space-y-1">
             <p className="text-[10px] text-cyan-400 font-black tracking-widest uppercase">
               LAT: {viewState.latitude.toFixed(4)}
             </p>
             <p className="text-[10px] text-cyan-400 font-black tracking-widest uppercase">
               LON: {viewState.longitude.toFixed(4)}
             </p>
          </div>
        </div>

        {/* 🛰️ STRATEGIC COMMAND SEARCH */}
        <div className="relative group">
           <form onSubmit={handleSearch}>
              <input 
                type="text"
                value={searchQuery}
                onFocus={() => {}} 
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH SECTOR OR COORDS..."
                className="bg-gray-950/90 backdrop-blur-md px-8 py-5 rounded-[1.5rem] border border-white/20 text-[11px] font-black uppercase tracking-[0.2em] text-white placeholder:text-gray-500 focus:border-cyan-500/80 outline-none w-[400px] transition-all shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
              />
           </form>
           
           {/* QUICK SECTORS */}
           <div className="absolute top-full left-0 right-0 mt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-[-10px] group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
              {['JKIA', 'CBD', 'WILSON', 'WESTLANDS'].map(s => (
                <button 
                  key={s}
                  onClick={() => { setSearchQuery(s); const fakeEvent = { preventDefault: () => {} } as any; handleSearch(fakeEvent); }}
                  className="px-5 py-2.5 bg-gray-900 border border-white/20 rounded-full text-[9px] font-black text-white hover:text-cyan-400 hover:border-cyan-500/50 transition-all uppercase shadow-2xl"
                >
                  {s}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-[400]">
        <button 
          onClick={() => setHeatmapMode(!heatmapMode)}
          className={`px-6 py-3 rounded-[1.25rem] border-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_12px_40px_rgba(0,0,0,0.4)] ${
            heatmapMode 
              ? 'bg-orange-600 border-orange-400 text-white shadow-orange-500/30' 
              : 'bg-gray-950/90 backdrop-blur-md border-white/20 text-white hover:border-cyan-500/50'
          }`}
        >
          {heatmapMode ? '🔥 Strategic Heat-Mode ON' : '🛰️ Standard Telemetry'}
        </button>
      </div>

      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
      >
        {/* Animated Weather Radar Layer */}
        {!heatmapMode && (
          <Source id="weather-radar" type="geojson" data={weatherData}>
            <Layer
              id="weather-fill"
              type="fill"
              paint={{
                'fill-color': '#3b82f6',
                'fill-opacity': 0.15,
                'fill-outline-color': '#3b82f6'
              }}
            />
          </Source>
        )}

        {/* Render Advanced 3D Tactical Corridors */}
        {!heatmapMode && (
          <Source id="flight-routes" type="geojson" data={routeData}>
            {/* Layer 1: Atmospheric Glow (Deep blur) */}
            <Layer
              id="route-glow-outer"
              type="line"
              paint={{
                'line-color': '#00ffcc',
                'line-width': 12,
                'line-opacity': 0.05,
                'line-blur': 15
              }}
            />
            {/* Layer 2: Vector Glow (Sharp blur) */}
            <Layer
              id="route-glow-inner"
              type="line"
              paint={{
                'line-color': '#22d3ee',
                'line-width': 4,
                'line-opacity': 0.4,
                'line-blur': 2
              }}
            />
            {/* Layer 3: Energy Pulse Core */}
            <Layer
              id="route-pulse-core"
              type="line"
              paint={{
                'line-color': '#fff',
                'line-width': 1.5,
                'line-opacity': 0.9,
                'line-dasharray': [2, 3]
              }}
            />
            {/* Layer 4: Tactical Waypoint Nodes */}
            <Layer
              id="route-nodes"
              type="circle"
              paint={{
                'circle-radius': 4,
                'circle-color': '#22d3ee',
                'circle-opacity': 1,
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#fff'
              }}
            />
          </Source>
        )}

        {/* Render Logistics Hubs */}
        {!heatmapMode && hubs.map(h => (
          <Marker key={h.id} longitude={h.longitude} latitude={h.latitude}>
             <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center text-[12px] cursor-pointer hover:scale-125 transition-transform shadow-[0_0_20px_rgba(250,204,21,0.6)]">
               🏪
             </div>
          </Marker>
        ))}

        {/* Render Fleet */}
        {!heatmapMode && fleet.map((drone) => {
          // Override with MQTT live data if available
          const liveData = mqttFleet[drone.id];
          const lat = liveData ? liveData.lat : drone.coords[0];
          const lon = liveData ? liveData.lon : drone.coords[1];
          const battery = liveData ? liveData.battery : drone.battery;
          
          return (
          <Marker
            key={drone.id}
            latitude={lat}
            longitude={lon}
            anchor="center"
          >
            <div 
              className="relative cursor-pointer group"
              onMouseEnter={() => setHoveredDrone(drone.id)}
              onMouseLeave={() => setHoveredDrone(null)}
              onClick={() => setSelectedDroneId(drone.id)}
            >
              {/* 🚨 CONFLICT RING: Pulse red if has_conflict is true */}
              {drone.has_conflict && (
                <div className="absolute -inset-4 border-2 border-red-500 rounded-full animate-ping opacity-75"></div>
              )}

              {/* 🚨 CRITICAL TAG */}
              {drone.has_conflict && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-600 text-[8px] font-black text-white px-2 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-bounce whitespace-nowrap">
                  CRITICAL_PROXIMITY
                </div>
              )}

              <div className={`relative w-8 h-8 flex items-center justify-center group-hover:scale-125 transition-transform duration-300 z-10`}>
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className={`w-full h-full object-contain filter ${
                    drone.has_conflict ? 'text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,1)]' : 
                    drone.status === "IN_TRANSIT" ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,1)]' : 
                    'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                  }`}
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              
              {/* Hover HUD */}
              {hoveredDrone === drone.id && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 glass p-3 rounded-xl min-w-[140px] z-50 animate-in fade-in zoom-in duration-200">
                  <div className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-1">{drone.id}</div>
                  <div className="text-[9px] text-gray-400 mb-2">{drone.org}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-bold">
                      <span className="text-gray-500">BATTERY</span>
                      <span className={battery < 20 ? 'text-red-500' : 'text-white'}>{battery}%</span>
                    </div>
                    <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${battery < 20 ? 'bg-red-500' : 'bg-teal-500'}`} 
                        style={{ width: `${battery}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-bold mt-2">
                      <span className="text-gray-500">STATUS</span>
                      <span className={`uppercase ${drone.status === "IN_TRANSIT" ? "text-amber-500 animate-pulse font-black" : "text-white"}`}>
                        {drone.status === "IN_TRANSIT" ? "Relocating" : drone.status}
                      </span>
                    </div>
                    {drone.has_conflict && (
                      <div className="mt-2 pt-2 border-t border-red-500/30 text-[8px] font-black text-red-500">
                          ⚠️ PROXIMITY_CONFLICT_ACTIVE
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Marker>
          );
        })}

        {/* Strategic Heatmap Layer */}
        {heatmapMode && (
          <Source id="heatmap" type="geojson" data={{
            type: 'FeatureCollection',
            features: heatmapPoints.map(p => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
              properties: { weight: p.intensity || 1.0 }
            }))
          }}>
            <Layer 
              id="heatmap-layer"
              type="heatmap"
              paint={{
                'heatmap-weight': ['get', 'weight'],
                'heatmap-intensity': 1.5,
                'heatmap-color': [
                  'interpolate', ['linear'], ['heatmap-density'],
                  0, 'rgba(0, 0, 0, 0)',
                  0.2, 'rgba(0, 255, 204, 0.2)',
                  0.4, 'rgba(0, 255, 204, 0.4)',
                  0.6, 'rgba(251, 146, 60, 0.6)',
                  1, 'rgba(251, 146, 60, 0.8)'
                ],
                'heatmap-radius': 50,
                'heatmap-opacity': 0.6
              }}
            />
          </Source>
        )}
      </Map>
    </>
  );
};




