'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { UAVControl } from '../components/dashboard/UAVControl';
import { MissionQueue } from '../components/dashboard/MissionQueue';
import { FleetStatus } from '../components/dashboard/FleetStatus';
import { OperationalMap } from '../components/dashboard/OperationalMap';
import { FleetHealthRadar, NetworkYieldDonut, WeatherImpactChart } from '../components/analytics/AnalyticsCharts';
import { GlobalLoadBalancer } from '../components/dashboard/GlobalLoadBalancer';
import { FleetMigrationPanel } from '../components/dashboard/FleetMigrationPanel';
import { HubsManagement } from '../components/dashboard/HubsManagement';
import { HubDetailPanel } from '../components/dashboard/HubDetailPanel';
import { SortieQueue } from '../components/dashboard/SortieQueue';
import { DroneCameraFeed } from '../components/dashboard/DroneCameraFeed';
import { useMissionStore } from '../lib/store';
import { useTelemetry } from '../hooks/useTelemetry';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Zap, Shield, AlertTriangle, ArrowRightCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const NetworkTraffic = dynamic(() => import('../components/dashboard/NetworkTraffic').then(mod => mod.NetworkTraffic), { ssr: false });
const SupportPortal = dynamic(() => import('../components/dashboard/SupportPortal').then(mod => mod.SupportPortal), { ssr: false });
const HubCommissionModal = dynamic(() => import('../components/dashboard/HubCommissionModal').then(mod => mod.HubCommissionModal), { ssr: false });
const LogFeed = dynamic(() => import('../components/dashboard/LogFeed').then(mod => mod.LogFeed), { ssr: false });
const NLPCommandCenter = dynamic(() => import('../components/dashboard/NLPCommandCenter').then(mod => mod.NLPCommandCenter), { ssr: false });

const HQ_LOCATION: [number, number] = [-1.2921, 36.7884];
const ACTIVE_IP = "10.0.13.206"; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${ACTIVE_IP}:8000`;

export default function MissionControlPortal() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<any>("OPERATIONS");
  
  const { 
    hubs, setHubs,
    stats, setStats,
    activeOrders, setActiveOrders,
    scheduledOrders, setScheduledOrders,
    selectedHub, setSelectedHub,
    heatmapMode, toggleHeatmap,
    fleet, setFleet,
    logs, addLog,
    accessToken, isAuthenticated, logout,
    manualDroneIds, toggleManualDrone,
    selectedDroneId, setSelectedDroneId,
    clearMissionSelection
  } = useMissionStore();

  const authHeader = useMemo(() => ({
    'Authorization': `Bearer ${accessToken}`
  }), [accessToken]);

  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);
  const [fleetHealth, setFleetHealth] = useState<any[]>([]);
  const [yieldMatrix, setYieldMatrix] = useState<any[]>([]);

  const [globalLoad, setGlobalLoad] = useState<any[]>([]);
  const [weatherImpact, setWeatherImpact] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [autoRebalance, setAutoRebalance] = useState(true);
  const [weatherState, setWeatherState] = useState<any>(null);

  // Hub Management State
  const [isCommissionOpen, setIsCommissionOpen] = useState(false);
  const [selectedHubDetail, setSelectedHubDetail] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleBatchDispatch = async (ids: string[]) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/deliveries/queue/batch-dispatch`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(ids)
      });
      if (res.ok) {
        const data = await res.json();
        addLog(`MASS_DISPATCH SUCCESS: [${data.promoted_count}] MISSIONS ACTIVE`, "SUCCESS");
        clearMissionSelection();
        const activeRes = await fetch(`${BACKEND_URL}/api/v1/deliveries/seller/active?company_id=${encodeURIComponent(selectedHub)}`, { headers: authHeader });
        const queueRes = await fetch(`${BACKEND_URL}/api/v1/deliveries/queue/scheduled`, { headers: authHeader });
        if (activeRes.ok) setActiveOrders(await activeRes.json());
        if (queueRes.ok) setScheduledOrders(await queueRes.json());
      }
    } catch (e) {
      addLog("BATCH_DISPATCH_FAILURE: LINK INTERRUPTED", "ERROR");
    }
  };

  const handleMigrationBatch = async (source: string, target: string, quantity: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/fleet/migrate-batch`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_hub_id: source, target_hub_id: target, quantity })
      });
      if (res.ok) {
        addLog(`STRATEGIC REDISTRIBUTION: [${quantity}] UAVs MIGRATING -> ${target}`, "SUCCESS");
      } else {
        const err = await res.json();
        addLog(`MIGRATION REFUSED: ${err.detail}`, "ERROR");
      }
    } catch (e) {
      addLog("MIGRATION_LINK_DROP: COMMAND TIMEOUT", "ERROR");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    else {
      addLog("MISSION_CONTROL_BOOT: UNAV_OS v4.2.1-TACTICAL", "SUCCESS");
    }
  }, [isAuthenticated, router, addLog]);

  // AI 2.5: Strategic Intelligence Fetching
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        // Always fetch global stats and tactical health for the Navbar & Weather
        const [statsRes, tactHealthRes] = await Promise.all([
           fetch(`${BACKEND_URL}/api/v1/admin/global-stats`, { headers: authHeader }),
           fetch(`${BACKEND_URL}/api/v1/health/tactical`, { headers: authHeader })
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (tactHealthRes.ok) {
           const tactData = await tactHealthRes.json();
           setWeatherState(tactData.weather);
        }

        if (activeView === "ANALYTICS" || activeView === "OPERATIONS" || heatmapMode) {
          const hubData = hubs.find(h => h.company_id === selectedHub);
          const regionParam = hubData?.region ? `?region=${hubData.region}` : "";
          
          const [heatRes, healthRes, yieldRes, weatherRes, suggestRes] = await Promise.all([
            fetch(`${BACKEND_URL}/api/v1/admin/analytics/heatmap${regionParam}`, { headers: authHeader }),
            fetch(`${BACKEND_URL}/api/v1/admin/analytics/fleet-health`, { headers: authHeader }),
            fetch(`${BACKEND_URL}/api/v1/admin/analytics/yield-matrix`, { headers: authHeader }),
            fetch(`${BACKEND_URL}/api/v1/admin/analytics/weather-impact`, { headers: authHeader }),
            fetch(`${BACKEND_URL}/api/v1/admin/analytics/predictive-suggestions`, { headers: authHeader })
          ]);
          if (heatRes.ok) setHeatmapPoints(await heatRes.json());
          if (healthRes.ok) setFleetHealth(await healthRes.json());
          if (yieldRes.ok) setYieldMatrix(await yieldRes.json());
          if (weatherRes.ok) setWeatherImpact(await weatherRes.json());
          if (suggestRes.ok) setAiSuggestions(await suggestRes.json());
        }
      } catch (e) {}
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [activeView, heatmapMode, isAuthenticated, authHeader, setHeatmapPoints, setFleetHealth, setYieldMatrix, hubs, selectedHub, setStats]);

  useEffect(() => {
    if (!isAuthenticated || activeView !== "GLOBAL") return;

    const fetchGlobalLoad = async () => {
      try {
        const hubData = hubs.find(h => h.company_id === selectedHub);
        const regionParam = hubData?.region ? `?region=${hubData.region}` : "";
        
        const res = await fetch(`${BACKEND_URL}/api/v1/admin/analytics/global-load${regionParam}`, { headers: authHeader });
        if (res.ok) setGlobalLoad(await res.json());
      } catch (e) {
         addLog("GLOBAL_LOAD_FETCH_FAILURE: CROSS-CITY UPLINK DROPPED", "ERROR");
      }
    };
    fetchGlobalLoad();
    const interval = setInterval(fetchGlobalLoad, 5000); // 5s Tactical Refresh
    return () => clearInterval(interval);
  }, [activeView, isAuthenticated, authHeader, addLog, selectedHub, hubs]);

  const handleProcessQueue = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/deliveries/queue/process`, { method: 'POST', headers: authHeader });
      if (res.ok) {
        addLog("MISSION QUEUE PROCESS TRIGGERED. PROMOTING SORTIES.", "SUCCESS");
      }
    } catch (e) {
       addLog("QUEUE PROCESS FAILED: DATABASE_LOCKED", "ERROR");
    }
  };

  const selectedDrone = fleet.find(d => d.id === selectedDroneId) || fleet[0];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-teal-500 selection:text-black flex font-sans bg-grid">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <Navbar 
          activeView={activeView} 
          stats={stats} 
          hubs={hubs} 
          selectedHub={selectedHub} 
          setSelectedHub={setSelectedHub} 
        />

        {/* ⛈️ GLOBAL WEATHER GROUNDING BANNER */}
        {weatherState?.is_grounded && (
          <div className="w-full bg-red-600 border-b border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.5)] px-6 py-4 flex items-center justify-between z-50 animate-pulse">
             <div className="flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-white" />
                <div>
                   <h2 className="text-white font-black text-lg tracking-widest uppercase shadow-black drop-shadow-md">NETWORK PAUSED DUE TO WEATHER</h2>
                   <p className="text-red-100 text-xs font-bold tracking-widest">
                     Condition: {weatherState.status} | Wind: {weatherState.wind_speed_kmh} km/h | Rain: {weatherState.precipitation_mm} mm
                   </p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-white text-xs font-black tracking-widest opacity-80">AUTO-DISPATCH ENGINE HELD</p>
                <p className="text-red-200 text-[10px] font-bold tracking-widest">Awaiting Weather Clearance...</p>
             </div>
          </div>
        )}

        <main className="flex-1 p-10 overflow-y-auto space-y-12 bg-[radial-gradient(circle_at_50%_0%,_rgba(34,_211,_238,_0.05)_0%,_transparent_50%)]">
          {activeView === "OPERATIONS" && (
            <div className="flex flex-col gap-10 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* 🗺️ STRATEGIC INTELLIGENCE LAYER (MAP) */}
                <div className="xl:col-span-8 group relative h-[600px]">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-[2.5rem] blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
                  <OperationalMap 
                    hqLocation={HQ_LOCATION} 
                    hubs={hubs} 
                    fleet={fleet} 
                    activeOrders={activeOrders}
                    heatmapPoints={heatmapPoints}
                    heatmapMode={heatmapMode}
                    setHeatmapMode={toggleHeatmap}
                    setSelectedDroneId={setSelectedDroneId}
                  />
                </div>

                {/* 🐝 SORTIE OUTPUT QUEUE */}
                <div className="xl:col-span-4 h-[600px]">
                   <SortieQueue missions={activeOrders} />
                </div>
              </div>

              {/* 🎥 CINEMATIC OPTICAL PAYLOAD FEED (MOCK TEST BED) */}
              <div className="glass p-8 rounded-[2.5rem] my-10 relative overflow-hidden group border border-white/5 shadow-[0_0_50px_rgba(34,211,238,0.05)]">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="text-xs font-black tracking-[0.3em] text-cyan-400 uppercase">Live Optical Payload</h3>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Simulated Direct Webcam Uplink</p>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
                       <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]"></div>
                       <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Recording</span>
                    </div>
                 </div>
                 <DroneCameraFeed 
                    fleet={fleet} 
                    selectedDroneId={selectedDrone?.id || "NO_LINK"} 
                    onSelectDrone={setSelectedDroneId} 
                 />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* 🕹️ UAV CONTROL TERMINAL */}
                <div className="xl:col-span-4 flex flex-col gap-8">
                  <UAVControl 
                    selectedDrone={selectedDrone} 
                    fleet={fleet}
                    onSelectDrone={setSelectedDroneId}
                    manualDroneIds={manualDroneIds}
                    toggleManualMission={toggleManualDrone}
                  />

                  {/* 📡 ACTIVE NETWORK TRAFFIC */}
                  <NetworkTraffic />
                  
                  {/* 🤖 NLP COMMAND CENTER */}
                  <div className="h-[300px]">
                     <NLPCommandCenter />
                  </div>
                </div>

                {/* 📊 GRID TELEMETRY */}
                <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8 h-fit">
                   <div className="md:col-span-2 glass p-10 rounded-[2.5rem] border-white/5 bg-gradient-to-r from-teal-500/5 to-transparent relative overflow-hidden group">
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          <h3 className="text-xs font-black tracking-[0.3em] text-gray-500 uppercase">Strategic Grid Health</h3>
                          <p className="text-[10px] text-teal-400 font-bold mt-2 uppercase tracking-[0.2em]">98.4% Efficiency • Low Latency</p>
                        </div>
                        <div className="flex gap-3">
                           {[1,2,3,4,5,6,7].map(i => (
                             <div key={i} className="w-1.5 h-4 bg-teal-500/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                           ))}
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/5 blur-[80px] group-hover:bg-teal-500/10 transition-all pointer-events-none" />
                   </div>
                   <FleetHealthRadar data={fleetHealth} />
                   <NetworkYieldDonut data={yieldMatrix} />
                   <div className="md:col-span-2">
                      <WeatherImpactChart data={weatherImpact} />
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "GLOBAL" && (
            <div className="animate-in slide-in-from-right-10 duration-700 flex flex-col gap-10">
               <div className="flex justify-between items-end">
                  <div>
                     <h2 className="text-3xl font-black uppercase tracking-tighter">Global Dispatch Grid</h2>
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Cross-City Load Balancing & Swarm Orchestration</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 flex flex-col gap-10">
                     <GlobalLoadBalancer data={globalLoad} />
                  </div>
                  <div className="lg:col-span-4">
                     <FleetMigrationPanel hubs={hubs} onMigrate={handleMigrationBatch} />
                  </div>
               </div>
            </div>
          )}

          {activeView === "ANALYTICS" && (
            <div className="animate-in slide-in-from-right-10 duration-700 flex flex-col gap-10">
              <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-3xl font-black uppercase tracking-tighter">Strategic Intelligence</h2>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">AI-Driven Capacity Forecasting & Predictive Yield</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 {/* Predictive Suggestions HUD */}
                 <div className="lg:col-span-1 glass p-10 rounded-[2.5rem] border-blue-500/10 flex flex-col relative overflow-hidden group">
                    <div className="relative z-10">
                       <div className="flex items-center justify-between mb-10">
                           <div className="flex items-center gap-3">
                              <BrainCircuit className="w-5 h-5 text-blue-400" />
                              <h3 className="text-xs font-black tracking-[0.3em] text-gray-500 uppercase">AI Suggestions</h3>
                           </div>
                           <button 
                             onClick={() => setAutoRebalance(!autoRebalance)}
                             className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border transition-all ${
                               autoRebalance ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-gray-500 border-white/10'
                             }`}
                           >
                             {autoRebalance ? '🤖 AUTONOMOUS ON' : '👤 MANUAL OVERRIDE'}
                           </button>
                       </div>

                       <div className="space-y-6">
                          {aiSuggestions.slice(0, 3).map((s, i) => (
                             <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:border-blue-500/30 transition-all cursor-pointer group/item">
                                <div className="flex justify-between items-start mb-3">
                                   <div>
                                      <p className="text-[9px] text-gray-500 font-black uppercase">{s.hub_id}</p>
                                      <p className="text-xs font-black text-white">{s.region}</p>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[9px] text-blue-400 font-black uppercase">Optimal</p>
                                      <p className="text-lg font-black text-blue-400">{s.current_optimal} UAVs</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2 text-[8px] font-bold text-gray-400 uppercase">
                                   <Zap className="w-3 h-3 text-amber-500" />
                                   {s.rationale}
                                </div>
                             </div>
                          ))}
                       </div>

                       <button className="w-full mt-10 p-4 border border-blue-500/20 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-3">
                          <ArrowRightCircle className="w-4 h-4" />
                          Apply Global Balancing
                       </button>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[80px] group-hover:bg-blue-500/10 transition-all" />
                 </div>

                 <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="glass p-10 rounded-[2.5rem] flex flex-col">
                       <h3 className="text-xs font-black tracking-[0.3em] text-gray-500 uppercase mb-6">Fleet Health Matrix</h3>
                       <div className="flex-1 flex items-center justify-center min-h-[400px]">
                          <FleetHealthRadar data={fleetHealth} />
                       </div>
                    </div>
                    <div className="glass p-10 rounded-[2.5rem] flex flex-col">
                       <h3 className="text-xs font-black tracking-[0.3em] text-gray-500 uppercase mb-6">Network Yield Matrix</h3>
                       <div className="flex-1 flex items-center justify-center min-h-[400px]">
                          <NetworkYieldDonut data={yieldMatrix} />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="glass p-10 rounded-[2.5rem] flex flex-col mt-10 animate-in slide-in-from-bottom-10 duration-1000">
                 <h3 className="text-xs font-black tracking-[0.3em] text-gray-500 uppercase mb-6">Environmental Yield Correlation</h3>
                 <p className="text-[10px] text-gray-600 font-bold uppercase mb-10">Correlation of Storm Intensity (White) vs Network Revenue (Cyan)</p>
                 <div className="flex-1 min-h-[400px]">
                    <WeatherImpactChart data={weatherImpact} />
                 </div>
              </div>
            </div>
          )}

          {activeView === "LOGS" && (
            <div className="h-[70vh] animate-in fade-in duration-700">
               <LogFeed />
            </div>
          )}

          {activeView === "HUBS" && (
            <HubsManagement 
               hubs={hubs} 
               onSelectHub={setSelectedHub} 
               selectedHubId={selectedHub}
               onOpenCommission={() => setIsCommissionOpen(true)}
               onOpenDetail={(hub) => {
                 setSelectedHubDetail(hub);
                 setIsDetailOpen(true);
               }}
            />
          )}

          {activeView === "SUPPORT" && (
            <SupportPortal />
          )}
        </main>
      </div>

      {/* TACTICAL OVERLAYS */}
      <HubCommissionModal 
        isOpen={isCommissionOpen}
        onClose={() => setIsCommissionOpen(false)}
        onSuccess={async () => {
          // Refresh Hubs after successful commission
          const res = await fetch(`${BACKEND_URL}/api/v1/admin/hubs`, { headers: authHeader });
          if (res.ok) setHubs(await res.json());
          addLog("PERMANENT INFRASTRUCTURE DEPLOYED: DATABASE INDEXED", "SUCCESS");
        }}
        backendUrl={BACKEND_URL}
        authHeader={authHeader}
      />

      <HubDetailPanel 
        hub={selectedHubDetail}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        fleet={fleet}
        missions={activeOrders}
      />
    </div>
  );
}
// Cache invalidation trigger