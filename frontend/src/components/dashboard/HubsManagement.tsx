import React from 'react';
import { Hub } from '../../types';
import { Layout, Server, Activity, Users, MapPin } from 'lucide-react';

interface HubsManagementProps {
  hubs: Hub[];
  onSelectHub: (id: string) => void;
  selectedHubId: string;
  onOpenCommission: () => void;
  onOpenDetail: (hub: Hub) => void;
}

export const HubsManagement: React.FC<HubsManagementProps> = ({ 
  hubs, 
  onSelectHub, 
  selectedHubId,
  onOpenCommission,
  onOpenDetail
}) => {
  const [provisionedHubs, setProvisionedHubs] = React.useState<Hub[]>([]);

  const handleProvision = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newHub: Hub = {
      id: `V-HUB-${Math.floor(Math.random() * 1000)}`,
      company_id: `VIRTUAL_NODE_${provisionedHubs.length + 1}`,
      full_name: "Simulated Logistics Node (Provisioned)",
      region: "EXTENDED_GRID",
      latitude: -1.2 + (Math.random() * 0.1),
      longitude: 36.7 + (Math.random() * 0.1),
    };
    setProvisionedHubs([...provisionedHubs, newHub]);
  };

  const allHubs = [...hubs, ...provisionedHubs];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tighter">Logistics Infrastructure</h2>
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Regional Hub Management & Strategic Provisioning</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Hubs Grid */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {allHubs.map((hub) => (
            <div 
              key={hub.id}
              onClick={() => {
                onSelectHub(hub.company_id);
                onOpenDetail(hub);
              }}
              className={`glass p-8 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden ${
                selectedHubId === hub.company_id 
                  ? 'border-teal-500/50 bg-teal-500/5 shadow-[0_0_30px_rgba(20,184,166,0.1)]' 
                  : 'border-white/5 hover:border-white/20'
              }`}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🏪</div>
                  <div className="flex items-center gap-2">
                     <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase text-gray-400">
                        {hub.region}
                     </span>
                     {hub.id.startsWith('V-HUB') && (
                        <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[7px] font-black uppercase text-amber-500">
                           VIRTUAL
                        </span>
                     )}
                  </div>
                </div>

                <h3 className="text-xl font-black uppercase text-white mb-1">{hub.company_id}</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-6">{hub.full_name}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Status</p>
                    <p className="text-xs font-black text-teal-400 uppercase">Operational</p>
                  </div>
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-gray-600 uppercase mb-1">Fleet</p>
                    <p className="text-xs font-black text-white">24 Active</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[9px] font-mono">{hub.latitude.toFixed(4)}, {hub.longitude.toFixed(4)}</span>
                   </div>
                   {selectedHubId === hub.company_id && (
                     <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_10px_#14b8a6]"></div>
                   )}
                </div>
              </div>
              
              {/* Tactical Background Overlay */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-[60px] group-hover:bg-white/10 transition-all"></div>
            </div>
          ))}

          {/* Infrastructure Provisioning Actions */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
             <div 
               onClick={handleProvision}
               className="p-8 rounded-[2.5rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-gray-600 hover:border-amber-500/20 hover:text-amber-500/50 transition-all cursor-pointer group"
             >
                <div className="w-10 h-10 rounded-2xl border-2 border-dashed border-current flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
                <p className="text-[9px] font-black uppercase tracking-widest text-center">Commission Virtual Node<br/><span className="text-[7px] opacity-40">(Session Only)</span></p>
             </div>

             <div 
               onClick={(e) => { e.stopPropagation(); onOpenCommission(); }}
               className="p-8 rounded-[2.5rem] border-2 border-dashed border-white/5 bg-teal-500/5 flex flex-col items-center justify-center text-teal-600 hover:border-teal-500/40 hover:text-teal-400 transition-all cursor-pointer group"
             >
                <div className="w-10 h-10 rounded-2xl border-2 border-dashed border-current flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">🏢</div>
                <p className="text-[9px] font-black uppercase tracking-widest text-center">Commission Permanent Hub<br/><span className="text-[7px] opacity-40">(Database Indexed)</span></p>
             </div>
          </div>
        </div>

        {/* Global Statistics Panel */}
        <div className="xl:col-span-4 flex flex-col gap-8">
           <div className="glass p-8 rounded-[2.5rem] border border-white/5">
              <h3 className="text-xs font-black tracking-[0.3em] text-gray-500 uppercase mb-8">Infrastructure Health</h3>
              <div className="space-y-8">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                       <Server className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-white">Central Registry</p>
                       <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Status: SYNCHRONIZED</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20">
                       <Activity className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-white">Telemetry Feedback</p>
                       <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Latency: 12ms</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                       <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                       <p className="text-xs font-black text-white">Operator Load</p>
                       <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">4 Active Dispatchers</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-gradient-to-br from-teal-500/20 to-blue-600/10 border border-teal-500/20 rounded-[2.5rem] p-10 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] text-teal-400 font-black uppercase tracking-[0.4em] mb-4">Total Capacity</p>
                <h2 className="text-5xl font-black text-white tracking-tighter mb-4">98.4%</h2>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                   Current infrastructure is performing at peak efficiency. 0 regional bottlenecks detected.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[60px]"></div>
           </div>
        </div>
      </div>
    </div>
  );
};
