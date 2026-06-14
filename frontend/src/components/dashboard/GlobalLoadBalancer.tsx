import React from 'react';
import { Activity, Shield, Zap } from 'lucide-react';

interface LoadBalanceEntry {
  hub_id: string;
  active_missions: number;
  capacity: number;
  congestion_index: number;
  region: string;
}

interface GlobalLoadBalancerProps {
  data: LoadBalanceEntry[];
}

export const GlobalLoadBalancer: React.FC<GlobalLoadBalancerProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {data.length === 0 ? (
        <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-20">
           <Activity className="w-12 h-12 mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em]">Grid Status: Neutral</p>
        </div>
      ) : (
        data.map((hub) => (
          <div key={hub.hub_id} className="glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-black tracking-tighter text-white mb-1">{hub.hub_id}</h3>
                  <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                    Sector: {hub.region}
                  </p>
                </div>
                <div className={`p-2 rounded-xl ${hub.congestion_index > 0.7 ? 'bg-red-500/10 text-red-500' : 'bg-teal-500/10 text-teal-400'}`}>
                  {hub.congestion_index > 0.7 ? <Shield className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                    <span className="text-gray-400">Sortie Load</span>
                    <span className={hub.active_missions >= hub.capacity ? 'text-red-500' : 'text-white'}>
                      {hub.active_missions} / {hub.capacity}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        hub.active_missions >= hub.capacity ? 'bg-red-500' : 'bg-teal-500 shadow-[0_0_10px_rgba(0,255,204,0.5)]'
                      }`}
                      style={{ width: `${(hub.active_missions / hub.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                   <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Grid Health</p>
                      <p className="text-sm font-black text-white">{Math.round((1 - hub.congestion_index) * 100)}%</p>
                   </div>
                   <div className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mb-1">Congestion</p>
                      <p className={`text-sm font-black ${hub.congestion_index > 0.7 ? 'text-red-500' : 'text-teal-400'}`}>
                        {Math.round(hub.congestion_index * 100)}%
                      </p>
                   </div>
                </div>

                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">
                  Rebalance Tactical Fleet
                </button>
              </div>
            </div>

            {/* Background Glow */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[80px] opacity-10 ${
              hub.congestion_index > 0.7 ? 'bg-red-500' : 'bg-teal-500'
            }`} />
          </div>
        ))
      )}
    </div>
  );
};
