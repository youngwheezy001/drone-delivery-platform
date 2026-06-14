import React, { useEffect, useState } from 'react';
import { DollarSign, Package, Activity, TrendingUp } from 'lucide-react';

const ACTIVE_IP = "10.0.13.206"; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${ACTIVE_IP}:8000`;

interface EarningsBoardProps {
  hubId: string;
}

export const EarningsBoard: React.FC<EarningsBoardProps> = ({ hubId }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/deliveries/seller/stats?company_id=${hubId}`);
        if (res.ok) setStats(await res.json());
      } catch (e) {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [hubId]);

  if (!stats) {
    return <div className="h-40 bg-white/5 rounded-[2rem] animate-pulse" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
       <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex items-center gap-4 group hover:border-cyan-500/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center shrink-0">
             <DollarSign className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Revenue Today</p>
             <h3 className="text-2xl font-black text-white mt-1">KES {stats.revenueToday}</h3>
          </div>
       </div>

       <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex items-center gap-4 group hover:border-purple-500/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
             <Package className="w-6 h-6 text-purple-400" />
          </div>
          <div>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Flights Today</p>
             <h3 className="text-2xl font-black text-white mt-1">{stats.flightsToday}</h3>
          </div>
       </div>

       <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex items-center gap-4 group hover:border-green-500/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
             <Activity className="w-6 h-6 text-green-400" />
          </div>
          <div>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Avg Prep Time</p>
             <h3 className="text-2xl font-black text-white mt-1">{stats.avgPrepTime}</h3>
          </div>
       </div>
    </div>
  );
};
