import React, { useEffect, useRef } from 'react';
import { Drone } from '../../types';
import { useWebRTC } from '../../hooks/useWebRTC';

const ACTIVE_IP = "10.0.10.0"; 
const WEBRTC_URL = `ws://${ACTIVE_IP}:8000/api/v1/telemetry/webrtc`;

interface UAVControlProps {
  selectedDrone: Drone;
  fleet: Drone[];
  onSelectDrone: (id: string) => void;
  manualDroneIds: string[];
  toggleManualMission: (id: string) => void;
}

export const UAVControl: React.FC<UAVControlProps> = ({ 
  selectedDrone, 
  fleet,
  onSelectDrone,
  manualDroneIds, 
  toggleManualMission 
}) => {
  const isDroneManual = selectedDrone && manualDroneIds.includes(selectedDrone.id);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Rules of Hooks: Call at top level with safety
  const { remoteStream, connectionStatus, sendCommand, telemetry } = useWebRTC(
    WEBRTC_URL, 
    selectedDrone?.id || null
  );

  // Tactical Guard: Prevent rendering complex HUD if no drone is selected
  if (!selectedDrone) {
    return (
      <div className="glass p-6 rounded-3xl border border-white/10 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-4"></div>
        <p className="text-[10px] text-teal-500/50 font-black uppercase tracking-[0.2em]">
          Searching for Tactical Link...
        </p>
      </div>
    );
  }

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle Keyboard Overrides (Swarm Broadcast)
  useEffect(() => {
    if (!isDroneManual) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (['W', 'A', 'S', 'D', ' '].includes(key)) {
        e.preventDefault();
        // 🛰️ TACTICAL BROADCAST: Send to current link
        sendCommand(key === ' ' ? 'SPACE' : key);
        
        // Log swarm activity if multiple drones are controlled
        if (manualDroneIds.length > 1) {
           console.log(`🐝 Swarm Command [${key}] Broadcast to ${manualDroneIds.length} units.`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDroneManual, sendCommand, manualDroneIds.length]);

  return (
    <div className="glass p-6 rounded-3xl overflow-hidden border border-white/10 relative">
      <div className="scanline"></div>
      <div className="flex flex-col gap-4 mb-6 relative z-10">
        <div className="flex items-center justify-between">
           <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.3em]">
             Tactical UAV Roster
           </p>
           <div className="flex items-center gap-3">
              <div className="text-right">
                 <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Signal Integrity</p>
                 <p className="text-[10px] font-black text-cyan-500">98.4%</p>
              </div>
              <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)] ${
                connectionStatus === 'connected' ? (isDroneManual ? 'bg-orange-500 animate-pulse' : 'bg-cyan-500') : 'bg-red-500'
              } `}></div>
           </div>
        </div>

        {/* DRONE MATRIX SELECTION */}
        <div className="grid grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
          {fleet.map((d) => {
            const isSelected = selectedDrone.id === d.id;
            const isManual = manualDroneIds.includes(d.id);
            return (
              <button 
                key={d.id}
                onClick={() => onSelectDrone(d.id)}
                className={`flex flex-col p-3 rounded-xl border transition-all text-left group ${
                  isSelected 
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'border-white/5 bg-gray-900/50 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                   <p className={`text-[10px] font-black uppercase tracking-widest transform transition-transform group-hover:translate-x-1 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                     {d.id}
                   </p>
                   {isManual && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />}
                </div>
                
                <div className="flex items-end justify-between w-full">
                  <div>
                    <p className="text-[7px] text-gray-500 font-bold mb-0.5 uppercase tracking-widest">PWR</p>
                    <p className={`text-[12px] font-black leading-none ${d.battery < 25 ? 'text-red-500' : isSelected ? 'text-cyan-400' : 'text-teal-500'}`}>
                      {d.battery}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] text-gray-500 font-bold mb-0.5 uppercase tracking-widest">MODE</p>
                    <p className={`text-[9px] font-black uppercase tracking-widest leading-none ${isManual ? 'text-orange-400' : 'text-gray-500'}`}>
                      {isManual ? 'OVRR' : 'AUTO'}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* FPV Visual Overlay */}
      <div className="aspect-video w-full bg-black rounded-2xl relative overflow-hidden border border-white/5 mb-6 group cursor-crosshair">
        {remoteStream ? (
           <video 
             ref={videoRef}
             autoPlay 
             playsInline 
             className={`w-full h-full object-cover transition-all duration-300 ${
               isDroneManual ? 'grayscale-0 scale-105 opacity-100' : 'grayscale opacity-40 blur-[1px]'
             }`}
             style={{
                transform: `rotate(${telemetry.roll}deg) translateY(${telemetry.pitch * 2}px)`
             }}
           />
        ) : (
          <div className="w-full h-full relative bg-gray-950 overflow-hidden flex flex-col items-center justify-center">
            {/* Tactical Grid Panning Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,255,204,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px', transform: 'perspective(500px) rotateX(60deg) scale(2)', transformOrigin: 'top', animation: 'panGrid 8s linear infinite' }} />
            
            {/* FPV White Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-screen bg-repeat" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            <div className="relative z-10 flex flex-col items-center gap-4 bg-black/40 px-6 py-4 rounded-2xl backdrop-blur-md border border-white/5">
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                 <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.3em] font-mono shadow-black drop-shadow-md">
                    SIMULATED OPTICAL FEED
                 </p>
              </div>
              <p className="text-[7px] text-orange-500/60 font-mono tracking-widest text-center">AWAITING BROADBAND WEBRTC UPLINK</p>
            </div>
            <style>{`
              @keyframes panGrid {
                0% { transform: perspective(500px) rotateX(60deg) scale(2) translateY(0); }
                100% { transform: perspective(500px) rotateX(60deg) scale(2) translateY(30px); }
              }
            `}</style>
          </div>
        )}
        
        {/* TACTICAL HUD OVERLAYS */}
        <div className="absolute inset-0 flex items-center justify-between px-10 pointer-events-none overflow-hidden">
          
          {/* VELOCITY TAPE (LEFT) */}
          <div className="flex flex-col items-end gap-2">
            <div className="text-[8px] font-black text-teal-400 bg-black/40 px-2 py-1 border-l-2 border-teal-500">VEL (km/h)</div>
            <div className="h-40 w-12 glass overflow-hidden relative border-l border-white/10">
               <div className="absolute w-full text-center transition-all duration-200" style={{ bottom: `${(telemetry.vel % 100)}%` }}>
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-8 text-[9px] font-mono text-teal-500/40 border-b border-white/5 flex items-center justify-center">
                      {(i * 10)}
                    </div>
                  ))}
               </div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-teal-500 text-black font-black text-[12px] px-1 rounded shadow-lg">{Math.round(telemetry.vel)}</div>
               </div>
            </div>
          </div>

          {/* CENTER HORIZON / PITCH LADDER */}
          <div className="flex-1 flex items-center justify-center relative scale-150">
             <div className="w-40 h-px bg-teal-500/20 absolute"></div>
             <div className="w-px h-10 bg-teal-500/20 absolute"></div>
             <div className="w-10 h-10 border border-teal-500/30 rounded-full absolute"></div>
             {/* Dynamic Pitch Lines */}
             <div className="transition-all duration-200" style={{ transform: `translateY(${telemetry.pitch * 2}px)` }}>
                <div className="w-20 h-[2px] bg-teal-500/40 border-b border-teal-500"></div>
             </div>
          </div>

          {/* ALTITUDE TAPE (RIGHT) */}
          <div className="flex flex-col items-start gap-2">
            <div className="text-[8px] font-black text-teal-400 bg-black/40 px-2 py-1 border-r-2 border-teal-500">ALT (m)</div>
            <div className="h-40 w-16 glass overflow-hidden relative border-r border-white/10">
               <div className="absolute w-full text-center transition-all duration-300" style={{ bottom: `${(telemetry.alt % 100)}%` }}>
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-8 text-[9px] font-mono text-teal-500/40 border-b border-white/5 flex items-center justify-center">
                      {(i * 50)} 
                    </div>
                  ))}
               </div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-teal-500 text-black font-black text-[12px] px-1 rounded shadow-lg">{Math.round(telemetry.alt)}</div>
               </div>
            </div>
          </div>
        </div>

        {/* TOP HUD: STATUS & G-FORCE */}
        <div className="absolute top-4 inset-x-4 flex justify-between items-start pointer-events-none">
          <div className="space-y-2">
             <div className="p-2 glass text-[8px] font-mono text-teal-400 flex items-center gap-2">
                <div className="w-1 h-1 bg-red-500 animate-ping rounded-full"></div>
                LINK-RSSI: {connectionStatus === 'connected' ? '-42dBm' : 'N/A'}
             </div>
             <div className="p-2 glass text-[10px] font-black text-orange-400 border border-orange-500/20">
                G-LOAD: {telemetry.gforce.toFixed(1)}G
             </div>
          </div>
          <div className="p-2 glass text-[8px] font-mono text-teal-400 flex flex-col items-end">
             <span>SENSORS: NOMINAL</span>
             <span>FPS: 60.0</span>
          </div>
        </div>

        {/* BOTTOM HUD: MODE & REC */}
        <div className="absolute bottom-4 inset-x-4 flex justify-between items-end pointer-events-none">
          <div className="p-2 glass text-[8px] font-mono text-red-500 font-black flex items-center gap-2">
             <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
             REC ● LIVE
          </div>
          <div className="p-2 glass text-[8px] font-mono text-teal-400 uppercase font-black tracking-widest">
            UAV_ID: {selectedDrone.id}
          </div>
        </div>

        {(!isDroneManual) && (
          <div className="absolute inset-0 bg-teal-900/10 pointer-events-none mix-blend-overlay"></div>
        )}
      </div>

      <div className="flex flex-col items-center gap-8 relative z-10">
        <div className="flex flex-col items-center gap-6">
           <div className="flex gap-4">
              <kbd className="w-14 h-14 glass flex items-center justify-center rounded-2xl text-cyan-400 font-black border-2 border-white/5 shadow-lg group-hover:border-cyan-500/50 transition-all text-xl">W</kbd>
           </div>
           <div className="flex gap-4">
              <kbd className="w-14 h-14 glass flex items-center justify-center rounded-2xl text-cyan-400 font-black border-2 border-white/5 shadow-lg group-hover:border-cyan-500/50 transition-all text-xl">A</kbd>
              <kbd className="w-14 h-14 glass flex items-center justify-center rounded-2xl text-cyan-400 font-black border-2 border-white/5 shadow-lg group-hover:border-cyan-500/50 transition-all text-xl">S</kbd>
              <kbd className="w-14 h-14 glass flex items-center justify-center rounded-2xl text-cyan-400 font-black border-2 border-white/5 shadow-lg group-hover:border-cyan-500/50 transition-all text-xl">D</kbd>
           </div>
        </div>

        <button 
          onClick={() => toggleManualMission(selectedDrone.id)}
          disabled={connectionStatus !== 'connected'}
          className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all border shadow-2xl ${
            isDroneManual 
              ? 'bg-orange-500 text-black border-orange-400 shadow-orange-500/20' 
              : connectionStatus === 'connected' 
                ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/50'
                : 'bg-gray-900 text-gray-700 border-transparent cursor-not-allowed'
          }`}
        >
          {isDroneManual ? 'DISENGAGE_MANUAL_LINK' : 'INITIALIZE_TACTICAL_OVERRIDE'}
        </button>
      </div>
      
      {isDroneManual && (
        <div className="mt-6 p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 animate-pulse flex items-center justify-center gap-3">
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
          <p className="text-[9px] text-orange-400 font-black text-center uppercase tracking-widest">
            {manualDroneIds.length > 1 ? `SWARM_BROADCAST_ACTIVE [${manualDroneIds.length} UAVs]` : 'LOCAL_INPUT_ACTIVE [WASD]'}
          </p>
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
        </div>
      )}
    </div>
  );
};


