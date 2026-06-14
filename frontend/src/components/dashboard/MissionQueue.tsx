import React from 'react';
import { DeliveryMission } from '../../types';
import { useMissionStore } from '../../lib/store';
import { Check, Zap, Layers } from 'lucide-react';

interface MissionQueueProps {
  scheduledOrders: DeliveryMission[];
  handleBatchDispatch: (ids: string[]) => void;
}

export const MissionQueue: React.FC<MissionQueueProps> = ({ 
  scheduledOrders,
  handleBatchDispatch
}) => {
  const { selectedMissionIds, toggleMissionSelection, clearMissionSelection } = useMissionStore();

  const isSelected = (id: string) => selectedMissionIds.includes(id);

  return (
    <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden h-full flex flex-col">
      <div className="flex justify-between items-center mb-8 relative z-10 px-2">
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-gray-500" />
          <h3 className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">
            Sortie Output Queue
          </h3>
        </div>
        {selectedMissionIds.length > 0 && (
          <button 
            onClick={clearMissionSelection}
            className="text-[8px] font-bold text-teal-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            Clear Selection
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 relative z-10 overflow-y-auto pr-2 custom-scrollbar">
        {scheduledOrders.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <Zap className="w-12 h-12 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Queue Neutral</p>
           </div>
        ) : (
           scheduledOrders.map(o => (
             <div 
               key={o.id} 
               onClick={() => toggleMissionSelection(o.id)}
               className={`group flex items-center justify-between p-5 rounded-[2rem] border transition-all cursor-pointer ${
                 isSelected(o.id) 
                   ? 'bg-teal-500/10 border-teal-500/50 shadow-[0_0_20px_rgba(45,212,191,0.1)]' 
                   : 'bg-white/5 border-white/5 hover:border-white/10'
               }`}
             >
                <div className="flex items-center gap-5">
                   {/* Custom Checkbox */}
                   <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                     isSelected(o.id) ? 'bg-teal-500 border-teal-500' : 'border-white/10 group-hover:border-white/20'
                   }`}>
                      {isSelected(o.id) && <Check className="w-4 h-4 text-black" />}
                   </div>

                   <div>
                      <p className={`text-[11px] font-black uppercase tracking-tight ${isSelected(o.id) ? 'text-teal-400' : 'text-white'}`}>
                        MISION_ID: {o.id.substring(0,8)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                         <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none">
                            HUB: TUSTAR
                         </p>
                         <div className="w-1 h-1 rounded-full bg-gray-700" />
                         <span className={`text-[8px] font-black uppercase tracking-widest ${
                           (o as any).ai_assessment?.risk_score > 60 ? 'text-red-500' : 'text-teal-500/60'
                         }`}>
                           AI_CONF: {100 - ((o as any).ai_assessment?.risk_score || 0)}%
                         </span>
                      </div>
                   </div>
                </div>
                
                <div className="text-right">
                   {(o as any).ai_assessment?.optimal_delay > 0 && (
                     <p className="text-[7px] text-teal-400 font-black uppercase tracking-widest mb-1 animate-pulse">
                        WIN_ADV: +{(o as any).ai_assessment.optimal_delay}m
                     </p>
                   )}
                   <p className={`text-[10px] font-black uppercase tracking-widest ${(o as any).ai_assessment?.risk_score > 60 ? 'text-red-500' : 'text-gray-600'}`}>
                     {(o as any).ai_assessment?.risk_score > 60 ? 'WEATHER_RISK' : 'READY'}
                   </p>
                </div>
             </div>
           ))
        )}
      </div>

      {/* Floating Batch Control */}
      {selectedMissionIds.length > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-4rem)] animate-in slide-in-from-bottom-4 duration-300">
           <button 
             onClick={() => handleBatchDispatch(selectedMissionIds)}
             className="w-full bg-teal-500 hover:bg-teal-400 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl shadow-2xl shadow-teal-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-xs"
           >
             <Zap className="w-4 h-4 fill-current" />
             MASS DISPATCH [{selectedMissionIds.length}]
           </button>
        </div>
      )}
    </div>
  );
};
