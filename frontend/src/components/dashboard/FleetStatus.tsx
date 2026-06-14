import React from 'react';
import { Drone } from '../../types';

interface FleetStatusProps {
  fleet: Drone[];
  selectedDroneId: string | null;
  setSelectedDroneId: (id: string | null) => void;
  manualDroneIds: string[];
  toggleManualDrone: (id: string) => void;
}

export const FleetStatus: React.FC<FleetStatusProps> = ({ 
  fleet, 
  selectedDroneId, 
  setSelectedDroneId,
  manualDroneIds,
  toggleManualDrone
}) => {
  return (
    <div className="glass p-8 rounded-3xl">
      <h3 className="text-xs font-black tracking-widest text-gray-500 uppercase mb-8">
        Fleet Capacity
      </h3>
      <div className="space-y-4">
         {fleet.map((drone, i) => {
           const isManual = manualDroneIds.includes(drone.id);
           const isTransit = drone.status === 'IN_TRANSIT';
           return (
             <div 
               key={drone.id} 
               onClick={() => setSelectedDroneId(drone.id)}
               className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group ${
                 selectedDroneId === drone.id 
                   ? 'border-cyan-500 bg-cyan-500/5 shadow-[0_0_30px_rgba(34,211,238,0.1)]' 
                   : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
               }`}
             >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                           isManual ? 'bg-orange-500' : isTransit ? 'bg-blue-500' : 'bg-teal-500'
                         }`} />
                         <p className="text-xs font-black uppercase text-white tracking-widest">
                           SORTIE-{(i + 1).toString().padStart(2, '0')}
                         </p>
                      </div>
                      <p className="text-[8px] text-gray-500 font-bold uppercase mt-1 tracking-widest px-3">
                         {drone.status} • v4.2.1-TAC
                      </p>
                    </div>
                    <div className="text-right">
                       <p className={`text-xs font-mono font-black ${drone.battery < 20 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                          {drone.battery}%
                       </p>
                       <p className="text-[7px] text-gray-600 font-black uppercase">POWER_CELL</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                     <div>
                        <p className="text-[7px] font-black text-gray-600 uppercase">Signal</p>
                        <p className="text-[9px] font-mono text-white text-shadow">-42dBm</p>
                     </div>
                     <div>
                        <p className="text-[7px] font-black text-gray-600 uppercase">Alt</p>
                        <p className="text-[9px] font-mono text-white text-shadow">120m</p>
                     </div>
                     <div className="flex justify-end">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleManualDrone(drone.id); }}
                          className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase border transition-all ${
                            isManual ? 'bg-orange-500 text-black border-orange-400' : 'bg-white/5 text-gray-500 border-white/10'
                          }`}
                        >
                          {isManual ? 'MANUAL' : 'AUTO'}
                        </button>
                     </div>
                  </div>
                </div>
                
                {/* Tactical Accent Glow */}
                <div className={`absolute -bottom-12 -right-12 w-24 h-24 blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity ${
                  isManual ? 'bg-orange-500' : isTransit ? 'bg-blue-500' : 'bg-teal-500'
                }`} />
             </div>
           );
         })}
      </div>
    </div>
  );
};

