import React from 'react';
import { Hub, GlobalStats } from '../../types';

interface NavbarProps {
  activeView: string;
  stats: GlobalStats;
  hubs: Hub[];
  selectedHub: string;
  setSelectedHub: (hub: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeView, 
  stats, 
  hubs, 
  selectedHub, 
  setSelectedHub 
}) => {
  return (
    <header className="flex items-center justify-between px-10 py-8 glass border-b border-white/5 sticky top-0 z-[40] bg-black/40 backdrop-blur-3xl">
      <div className="relative group">
        <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">
           MISSION CONTROL_{activeView}
        </h1>
        <div className="flex items-center gap-3 mt-2">
           <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
           <p className="text-[10px] text-gray-500 font-bold tracking-[0.4em] uppercase">
             Alpha-Node_GRID-01 • v4.2.1_TACTICAL
           </p>
        </div>
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 blur-xl group-hover:via-cyan-500/10 transition-all pointer-events-none" />
      </div>

      <div className="flex gap-8 items-center">
        <div className="hidden xl:flex gap-10 border-r border-white/10 pr-10">
           <div className="text-right">
             <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Global_Sorties</p>
             <p className="text-lg font-mono font-black text-cyan-400 text-shadow-cyan">{stats.total_missions}</p>
           </div>
           <div className="text-right">
             <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Network_Yield</p>
             <p className="text-lg font-mono font-black text-purple-400 text-shadow-purple">KES {stats.total_revenue.toLocaleString()}</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 pl-4 group hover:border-cyan-500/30 transition-all">
           <span className="text-xs">🌐</span>
           <select 
             className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer pr-4"
             value={selectedHub}
             onChange={e => setSelectedHub(e.target.value)}
           >
             <option value="ALL_NETWORK">GLOBAL_FLEET_VIEW</option>
             {hubs.map(h => (
               <option key={h.id} value={h.company_id} className="bg-gray-950 font-sans">
                 {h.company_id.toUpperCase()}
               </option>
             ))}
           </select>
        </div>

        <div className="relative group">
           <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-500"></div>
           <button className="relative bg-black border border-white/10 text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.3em] uppercase transition-all active:scale-95">
             ADMIN_SEC_LINK
           </button>
        </div>
      </div>
    </header>
  );
};
