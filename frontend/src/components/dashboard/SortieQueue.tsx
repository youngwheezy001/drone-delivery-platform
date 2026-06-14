import React from 'react';
import { Rocket, Clock, Package, MapPin, ChevronRight } from 'lucide-react';
import { DeliveryMission } from '../../types';

interface SortieQueueProps {
  missions: DeliveryMission[];
}

export const SortieQueue: React.FC<SortieQueueProps> = ({ missions }) => {
  const pendingMissions = missions.filter(m => m.status === 'PENDING' || m.status === 'SCHEDULED');

  return (
    <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden flex flex-col h-full bg-gradient-to-br from-purple-500/5 to-transparent">
      {/* Dynamic Header */}
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h3 className="text-xs font-black tracking-[0.3em] text-purple-400 uppercase flex items-center gap-3">
             <Rocket className="w-4 h-4 animate-bounce" />
             Sortie Output Queue
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">{pendingMissions.length} UNITS_IN_TRANSITION</p>
        </div>
        <div className="px-4 py-1.5 glass border border-purple-500/30 rounded-full text-[10px] font-black text-purple-400 uppercase tracking-widest animate-pulse">
           Queue Neutral
        </div>
      </div>

      {/* Marquee Background Effect */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.02] rotate-12 select-none pointer-events-none">
         <p className="text-9xl font-black italic tracking-tighter">DEPARTING</p>
      </div>

      {/* List Container */}
      <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar relative z-10">
        {pendingMissions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
             <Package className="w-12 h-12" />
             <p className="text-[10px] font-black uppercase tracking-widest text-center leading-loose">
                No active launch windows detected.<br/>Awaiting tactical dispatch.
             </p>
          </div>
        ) : (
          pendingMissions.map((m, i) => (
            <div key={m.id} className="p-5 bg-white/5 border border-white/5 rounded-3xl group hover:border-purple-500/30 transition-all cursor-pointer">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                     <span className="text-[9px] font-mono text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">#{m.id.substring(0,6).toUpperCase()}</span>
                     <span className="text-[10px] font-black text-white uppercase">MISSION_QUEUED</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                     <Clock className="w-3 h-3" /> 
                     {(i + 1) * 2}:45m
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-gray-600 uppercase">Mass</p>
                     <p className="text-xs font-black text-white">{m.package_weight_kg} KG</p>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-gray-600 uppercase">Vector</p>
                     <p className="text-xs font-black text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-purple-400" /> NAI_SEC_4
                     </p>
                  </div>
               </div>

               <div className="relative h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-purple-500 animate-[shimmer_2s_infinite] transition-all duration-1000" 
                    style={{ width: `${60 - (i * 15)}%` }}
                  />
               </div>
            </div>
          ))
        )}
      </div>

      <button className="mt-8 py-4 w-full glass border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-purple-500 hover:text-black transition-all group flex items-center justify-center gap-3">
         Open Master Scheduler
         <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};
