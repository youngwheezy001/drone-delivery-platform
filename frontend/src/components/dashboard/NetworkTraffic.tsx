import React from 'react';
import { Activity, Zap, Wifi, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const NetworkTraffic: React.FC = () => {
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [stats, setStats] = React.useState<{uplink: number[], downlink: number[]} | null>(null);

  React.useEffect(() => {
    setStats({
      uplink: [...Array(15)].map(() => 20 + Math.random() * 80),
      downlink: [...Array(15)].map(() => 40 + Math.random() * 60)
    });
    setIsHydrated(true);
  }, []);

  return (
    <div className="glass p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden bg-gradient-to-br from-cyan-500/5 to-transparent">
      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
          <h3 className="text-xs font-black tracking-[0.3em] text-cyan-400 uppercase flex items-center gap-3">
             <Activity className="w-4 h-4 animate-pulse" />
             Active Network Traffic
          </h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Grid Sync: 0.8ms Latency</p>
        </div>
        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[8px] font-black text-cyan-400 uppercase tracking-widest">
           Encrypted Link
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-10 relative z-10">
         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <ArrowUpRight className="w-5 h-5 text-cyan-500" />
               <div>
                  <p className="text-[8px] font-black text-gray-600 uppercase">Uplink Throughput</p>
                  <p className="text-xl font-black text-white">42.8 <span className="text-[10px] text-gray-500">MB/S</span></p>
               </div>
            </div>
            <div 
               className="flex gap-1 h-8 items-end transition-opacity duration-1000" 
               style={{ opacity: isHydrated ? 1 : 0 }}
            >
               {isHydrated && stats ? stats.uplink.map((h, i) => (
                 <div 
                   key={i} 
                   className="flex-1 bg-cyan-500/20 rounded-t-sm animate-pulse" 
                   style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                 />
               )) : null}
            </div>
         </div>

         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <ArrowDownLeft className="w-5 h-5 text-purple-500" />
               <div>
                  <p className="text-[8px] font-black text-gray-600 uppercase">Downlink Stream</p>
                  <p className="text-xl font-black text-white">128.4 <span className="text-[10px] text-gray-500">MB/S</span></p>
               </div>
            </div>
            <div 
               className="flex gap-1 h-8 items-end transition-opacity duration-1000" 
               style={{ opacity: isHydrated ? 1 : 0 }}
            >
               {isHydrated && stats ? stats.downlink.map((h, i) => (
                 <div 
                   key={i} 
                   className="flex-1 bg-purple-500/20 rounded-t-sm animate-pulse" 
                   style={{ height: `${h}%`, animationDelay: `${i * 150}ms` }}
                 />
               )) : null}
            </div>
         </div>
      </div>

      <div className="space-y-6 relative z-10">
         <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-cyan-500/20 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-cyan-500" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wider">Primary GCS Uplink</p>
                  <p className="text-[8px] font-bold text-gray-500 uppercase">Signal Stability: 98%</p>
               </div>
            </div>
            <p className="text-[10px] font-mono text-cyan-500 font-bold">-4dBm</p>
         </div>

         <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:border-purple-500/20 transition-all">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-500" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wider">Swarm Relay Node 04</p>
                  <p className="text-[8px] font-bold text-gray-500 uppercase">Latency: 12ms</p>
               </div>
            </div>
            <p className="text-[10px] font-mono text-purple-500 font-bold">ACTIVE</p>
         </div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20"></div>
    </div>
  );
};
