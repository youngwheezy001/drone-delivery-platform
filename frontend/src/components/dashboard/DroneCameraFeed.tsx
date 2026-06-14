import React, { useEffect, useRef, useState } from 'react';
import { Drone } from '../../types';

interface FeedProps {
  fleet: Drone[];
  selectedDroneId: string;
  onSelectDrone: (id: string) => void;
}

export const DroneCameraFeed = ({ fleet, selectedDroneId, onSelectDrone }: FeedProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLinked, setIsLinked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [errMsgs, setErrMsgs] = useState("");
  const [webrtcStatus, setWebrtcStatus] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  // Tactical Multiplexer State
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");

  const initializeFeed = async (deviceId?: string) => {
    setIsLinked(true);
    setErrMsgs("");
    try {
      const constraints = deviceId 
        ? { video: { deviceId: { exact: deviceId }, width: 1280, height: 720 }, audio: false }
        : { video: { width: 1280, height: 720 }, audio: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);

      // Map hardware after permission is granted
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (!deviceId && videoDevices.length > 0) {
         const currentTrack = stream.getVideoTracks()[0];
         const currentDev = videoDevices.find(d => d.label === currentTrack.label);
         if (currentDev) setActiveDeviceId(currentDev.deviceId);
      } else if (deviceId) {
         setActiveDeviceId(deviceId);
      }

      // Establish WebRTC Signaling Simulation
      setWebrtcStatus("ESTABLISHING WEBRTC SIGNAL...");
      const wsUrl = `ws://${process.env.NEXT_PUBLIC_API_URL?.replace('http://', '') || 'localhost:8000'}/api/v1/telemetry/webrtc/${selectedDroneId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
         setWebrtcStatus("NEGOTIATING ICE CANDIDATES...");
         ws.send(JSON.stringify({ type: 'offer', sdp: 'mock-sdp-offer' }));
      };
      
      ws.onmessage = (event) => {
         // Mock handling of signaling
         setWebrtcStatus("WebRTC SECURE TUNNEL ACTIVE");
      };

    } catch (err: any) {
      setErrMsgs(err.message);
      setHasPermission(false);
    }
  };

  const handleSwitchCamera = (id: string) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    initializeFeed(id);
  };

  useEffect(() => {
    if (hasPermission && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [hasPermission, selectedDroneId]); 

  // Emergency link termination
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 group">
      
      {/* 🚀 TOP ROW FLEET MATRIX - FAST SWITCH */}
      <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-40 flex items-center justify-between pointer-events-none">
        <div className="flex gap-2 pointer-events-auto overflow-x-auto custom-scrollbar pb-2 max-w-[80%]">
          {fleet.map((d) => (
            <button
              key={d.id}
              onClick={() => onSelectDrone(d.id)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                selectedDroneId === d.id 
                  ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
                  : 'border-white/10 bg-black/50 text-gray-500 hover:border-white/30 hover:text-white'
              }`}
            >
              {d.id} [{d.battery}%]
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full backdrop-blur-md">
           <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_red] ${hasPermission ? 'bg-red-500 animate-pulse' : 'bg-red-900 duration-1000'}`}></div>
           <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">{hasPermission ? 'LIVE REC' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* 📹 HARDWARE MULTIPLEXER (Only show if multiple sources detected) */}
      {hasPermission && devices.length > 1 && (
        <div className="absolute top-20 right-6 z-50">
           <select 
             value={activeDeviceId}
             onChange={(e) => handleSwitchCamera(e.target.value)}
             className="bg-black/60 border border-white/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl cursor-pointer backdrop-blur-xl focus:outline-none focus:border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:bg-black/80 transition-all max-w-[200px]"
           >
             {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId} className="bg-gray-900 text-cyan-400">
                   {d.label || `OPTICAL NODE: ${d.deviceId.slice(0,5)}`}
                </option>
             ))}
           </select>
        </div>
      )}

      {/* 🎥 THE ACTUAL FEED */}
      {!isLinked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10">
           <button 
             onClick={() => initializeFeed()}
             className="px-8 py-4 bg-cyan-500/10 border-2 border-cyan-500 text-cyan-400 font-black uppercase tracking-[0.4em] text-xs rounded-xl hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)]"
           >
             Initialize Hardware Access
           </button>
           <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-6 text-center max-w-sm">
             Awaiting Commander Authorization to pipe local hardware feed into the Payload Optical Array.
           </p>
        </div>
      ) : hasPermission ? (
        <>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover scale-x-[-1] absolute inset-0 z-0"
          />
          <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-4 py-1.5 rounded-full border border-cyan-500/30 z-20">
             <span className="text-[9px] font-mono text-cyan-400 font-bold">{webrtcStatus || 'STREAMING'}</span>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10">
          <div className="w-10 h-10 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em]">
            {errMsgs ? `OPTICAL FAILURE: ${errMsgs}` : "NEGOTIATING I/O PERMISSIONS..."}
          </p>
        </div>
      )}

      {/* 🎯 TACTICAL TARGETING OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6 pt-24">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-full flex items-center justify-center">
            <div className="w-32 h-32 border border-cyan-500/30 rounded-full flex items-center justify-center relative">
              <div className="w-1 h-3 bg-cyan-500/50 absolute top-[-5px]"></div>
              <div className="w-1 h-3 bg-cyan-500/50 absolute bottom-[-5px]"></div>
              <div className="w-3 h-1 bg-cyan-500/50 absolute left-[-5px]"></div>
              <div className="w-3 h-1 bg-cyan-500/50 absolute right-[-5px]"></div>
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_red]"></div>
            </div>
         </div>

         <div className="absolute top-20 left-10 w-12 h-12 border-t-2 border-l-2 border-cyan-500/50"></div>
         <div className="absolute top-20 right-10 w-12 h-12 border-t-2 border-r-2 border-cyan-500/50"></div>
         <div className="absolute bottom-10 left-10 w-12 h-12 border-b-2 border-l-2 border-cyan-500/50"></div>
         <div className="absolute bottom-10 right-10 w-12 h-12 border-b-2 border-r-2 border-cyan-500/50"></div>

         <div className="mt-auto flex justify-between items-end">
            <div className="p-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1">Target Drone Payload</p>
                <p className="text-[14px] text-cyan-400 font-black uppercase tracking-[0.2em]">{selectedDroneId}</p>
            </div>
            
            <div className="text-right p-4 bg-black/50 backdrop-blur-md border border-white/10 rounded-xl">
                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-1">Grid Telemetry</p>
                <p className="text-[12px] font-mono text-white">LAT: -1.2921°</p>
                <p className="text-[12px] font-mono text-white mt-0.5">LON: 36.7884°</p>
            </div>
         </div>
      </div>
      
      {/* 📺 Atmosphere Filters */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-screen pointer-events-none z-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")' }}></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-teal-900/40 z-30"></div>
    </div>
  );
};
