import React, { useState } from 'react';
import { ShieldAlert, Terminal, Phone, Zap, WifiOff, Map, AlertOctagon } from 'lucide-react';

export const SupportPortal: React.FC = () => {
  const [protocolActive, setProtocolActive] = useState<string | null>(null);

  const protocols = [
    { id: 'GLOBAL_LAND', name: 'Global Grounding', icon: Map, color: 'text-red-500', desc: 'FORCED LANDING OF ALL 24 UAVs' },
    { id: 'SIGNAL_JAM', name: 'Signal Jam Alert', icon: WifiOff, color: 'text-orange-500', desc: 'BROADCASTING EMERGENCY JAMMING SIGNAL' },
    { id: 'BATT_SAFE', name: 'Battery Preserve', icon: Zap, color: 'text-amber-500', desc: 'MINIMIZING POWER DRAW ACROSS GRID' },
  ];

  const [slaData, setSlaData] = useState<{height: number, isDropped: boolean}[]>([]);

  React.useEffect(() => {
    setSlaData([...Array(40)].map(() => ({
       height: 40 + Math.random() * 60,
       isDropped: Math.random() > 0.95
    })));
  }, []);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tighter text-red-500">Crisis Management Center</h2>
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Emergency Protocols & System Resilience Monitoring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Emergency Overrides */}
        <div className="xl:col-span-4 flex flex-col gap-8">
           <div className="glass p-10 rounded-[2.5rem] border-red-500/20 bg-red-500/5 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-10">
                   <AlertOctagon className="w-8 h-8 text-red-500 animate-pulse" />
                   <h3 className="text-sm font-black tracking-[0.3em] text-red-400 uppercase">Master Overrides</h3>
                </div>

                <div className="space-y-6">
                   {protocols.map((p) => (
                     <button 
                        key={p.id}
                        onClick={() => setProtocolActive(p.id)}
                        className={`w-full p-6 border-2 rounded-3xl flex items-center gap-6 transition-all relative overflow-hidden group/btn ${
                          protocolActive === p.id 
                            ? 'bg-red-500 border-red-400 text-black' 
                            : 'bg-white/5 border-white/5 text-white hover:border-red-500/30'
                        }`}
                     >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${protocolActive === p.id ? 'bg-black text-red-500' : 'bg-red-500/10'}`}>
                           <p.icon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                           <p className="text-xs font-black uppercase tracking-wider">{p.name}</p>
                           <p className={`text-[8px] font-bold uppercase mt-1 opacity-60`}>{p.desc}</p>
                        </div>
                        {protocolActive === p.id && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none"></div>
                        )}
                     </button>
                   ))}
                </div>
                
                <p className="mt-10 text-[9px] text-gray-600 font-bold uppercase text-center tracking-widest leading-loose">
                   ⚠️ ACCESSING THESE PROTOCOLS REQUIRES LEVEL 4 COMMAND CLEARANCE. ALL ACTIONS ARE LOGGED IN THE PERMANENT REGISTRY.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[80px]"></div>
           </div>
        </div>

        {/* System Health & SLA */}
        <div className="xl:col-span-8 flex flex-col gap-10">
           <div className="glass p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                   <div>
                      <h3 className="text-xs font-black tracking-[0.3em] text-gray-500 uppercase flex items-center gap-3">
                         <ShieldAlert className="w-4 h-4 text-teal-400" />
                         Grid SLA Monitoring
                      </h3>
                   </div>
                   <div className="px-4 py-1.5 glass border border-teal-500/30 rounded-full text-[10px] font-black text-teal-400 uppercase tracking-widest">
                      uptime: 99.998%
                   </div>
                </div>

                <div className="h-64 flex items-end gap-1 px-4">
                   {slaData.map((d, i) => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-t-sm transition-all duration-1000 ${d.isDropped ? 'bg-red-500/40 h-10 animate-pulse' : 'bg-teal-500/20 h-[var(--h)] group-hover:bg-teal-500/40'}`} 
                        style={{ '--h': `${d.height}%` } as any}
                      />
                   ))}
                </div>
                <div className="flex justify-between mt-6 text-[8px] font-black text-gray-600 uppercase tracking-widest px-2">
                   <span>24H History</span>
                   <div className="flex gap-4">
                      <span className="text-teal-500/50">NOMINAL</span>
                      <span className="text-red-500/50">ANOMALY DETECTED</span>
                   </div>
                   <span>Now</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-teal-500/[0.02] pointer-events-none" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="glass p-10 rounded-[2.5rem] border-white/5 hover:border-teal-500/20 transition-all group">
                 <div className="flex items-center gap-4 mb-8">
                    <Terminal className="w-5 h-5 text-teal-400" />
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Technical Manuals</h3>
                 </div>
                 <div className="space-y-4">
                    {['UAV-OS Core Protocol', 'PBR Weather Calibration', 'A* Pathing Diagnostics'].map((doc) => (
                      <div key={doc} className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/5 transition-all cursor-pointer flex justify-between items-center group/item">
                         <span className="text-[10px] font-black uppercase text-white group-hover/item:text-teal-400 transition-colors">{doc}</span>
                         <span className="text-[8px] text-teal-500 opacity-0 group-hover/item:opacity-100 transition-opacity font-bold">PDF_SECURE</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="glass p-10 rounded-[2.5rem] border-white/5 hover:border-red-500/20 transition-all group">
                 <div className="flex items-center gap-4 mb-8">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase">Emergency Contacts</h3>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-5 bg-red-500/5 border border-red-500/10 rounded-3xl hover:bg-red-500/10 transition-all">
                       <span className="text-[10px] font-black uppercase text-red-400">Regional Port Authority</span>
                       <span className="text-[10px] font-mono text-white tracking-widest">+254 700 000 000</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/5 transition-all">
                       <span className="text-[10px] font-black uppercase text-gray-400">Aviation Safety Node</span>
                       <span className="text-[10px] font-mono text-white tracking-widest">+254 711 111 111</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
