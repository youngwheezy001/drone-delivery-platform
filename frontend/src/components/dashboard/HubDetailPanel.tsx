import React from 'react';
import { X, Activity, Box, Zap, Navigation, Clock, ShieldAlert } from 'lucide-react';
import { Hub, Drone, DeliveryMission } from '../../types';

interface HubDetailPanelProps {
  hub: Hub | null;
  isOpen: boolean;
  onClose: () => void;
  fleet: Drone[];
  missions: DeliveryMission[];
}

export const HubDetailPanel: React.FC<HubDetailPanelProps> = ({ 
  hub, 
  isOpen,
  onClose,
  fleet,
  missions
}) => {
  if (!isOpen || !hub) return null;

  const hubFleet = fleet.filter(d => d.org === hub.company_id);
  const hubMissions = missions.filter(m => m.company_id === hub.company_id);

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl z-[120] animate-in slide-in-from-right duration-500 ease-out">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative h-full bg-gray-950 border-l border-white/10 flex flex-col shadow-2xl">
        {/* Tactical Header */}
        <div className="p-10 border-b border-white/5 bg-gradient-to-br from-teal-500/5 to-transparent">
           <div className="flex justify-between items-start mb-8">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl">🏪</div>
              <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group">
                 <X className="w-5 h-5 text-gray-500 group-hover:text-white" />
              </button>
           </div>
           
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white">{hub.company_id}</h2>
           <p className="text-[10px] text-teal-400 font-bold uppercase tracking-[0.3em] mt-2">{hub.region} • Operational Sector</p>
           <p className="text-sm font-medium text-gray-500 mt-4 leading-relaxed">{hub.full_name}</p>
        </div>

        {/* Scrollable Intelligence Feed */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
           {/* Hub Statistics Matrix */}
           <div className="grid grid-cols-2 gap-6">
              <div className="glass p-6 rounded-3xl border-white/5">
                 <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-3">Service Uptime</p>
                 <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-white">99.98%</span>
                    <Activity className="w-4 h-4 text-teal-400 opacity-30" />
                 </div>
              </div>
              <div className="glass p-6 rounded-3xl border-white/5">
                 <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-3">Sortie Success</p>
                 <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-white">100%</span>
                    <ShieldAlert className="w-4 h-4 text-blue-400 opacity-30" />
                 </div>
              </div>
           </div>

           {/* Fleet Status Summary */}
           <div>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-black tracking-widest text-gray-500 uppercase flex items-center gap-3">
                    <Navigation className="w-4 h-4" /> Assigned Fleet
                 </h3>
                 <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black text-gray-400">{hubFleet.length} UAVs</span>
              </div>
              <div className="space-y-4">
                 {hubFleet.length === 0 ? (
                    <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center text-[10px] font-black text-gray-600 uppercase">No Tactical Assets Assigned</div>
                 ) : (
                    hubFleet.map((drone, i) => (
                      <div key={drone.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${drone.status === 'READY' ? 'bg-teal-500' : 'bg-orange-500 animate-pulse'}`} />
                            <div>
                               <p className="text-xs font-black text-white">SORTIE-{(i+1).toString().padStart(2, '0')}</p>
                               <p className="text-[8px] text-gray-500 font-bold uppercase">{drone.status}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-mono text-teal-400">{drone.battery}%</p>
                            <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">Power Cell</p>
                         </div>
                      </div>
                    ))
                 )}
              </div>
           </div>

           {/* Active Mission Feed */}
           <div>
              <div className="flex items-center gap-3 mb-6">
                 <Box className="w-4 h-4 text-gray-500" />
                 <h3 className="text-xs font-black tracking-widest text-gray-500 uppercase">Tactical Airspace Traffic</h3>
              </div>
              <div className="space-y-4">
                 {hubMissions.length === 0 ? (
                   <div className="p-10 border border-dashed border-white/5 rounded-3xl text-center text-[10px] font-black text-gray-600 uppercase">Airspace Clear</div>
                 ) : (
                   hubMissions.map(mission => (
                     <div key={mission.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black text-white uppercase">#{mission.id.substring(0,8)}</span>
                           <span className="text-[9px] font-black text-blue-400 uppercase">{mission.status}</span>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 text-[9px] font-bold uppercase">
                           <Clock className="w-3 h-3" /> 
                           <span>ETA: 12m</span>
                           <Zap className="w-3 h-3 ml-auto" />
                           <span>PRIORITY: HIGH</span>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>

           {/* Mission History (Historical Ledger) */}
           <div>
              <div className="flex items-center gap-3 mb-6">
                 <Clock className="w-4 h-4 text-purple-500" />
                 <h3 className="text-xs font-black tracking-widest text-gray-500 uppercase">Mission History Ledger</h3>
              </div>
              <div className="space-y-4 opacity-70">
                 {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/5 transition-all">
                       <div>
                          <p className="text-[10px] font-black text-white uppercase">SORTIE_ARCHIVE_0{i}</p>
                          <p className="text-[8px] text-gray-600 font-bold uppercase mt-1">COMPLETED • 1{i}h ago</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-mono text-purple-400">KES 12,400</p>
                          <p className="text-[7px] text-gray-700 font-bold uppercase">YIELD</p>
                       </div>
                    </div>
                 ))}
                 <button className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[8px] font-black text-gray-600 uppercase hover:text-white hover:border-white/20 transition-all">
                    Load Master Ledger (244 entries)
                 </button>
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-10 border-t border-white/5 bg-gray-900/50">
           <button className="w-full py-5 bg-teal-500 text-black font-black text-xs uppercase tracking-[0.4em] rounded-2xl shadow-xl shadow-teal-500/20 hover:bg-teal-400 transition-all">
              Initiate Regional Swarm Sync
           </button>
        </div>
      </div>
    </div>
  );
};
