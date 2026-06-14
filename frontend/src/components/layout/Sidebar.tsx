import React from 'react';

type ViewMode = "OPERATIONS" | "HUBS" | "GLOBAL" | "ANALYTICS" | "LOGS" | "SUPPORT";

interface SidebarProps {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const menuItems: { id: ViewMode; icon: string; color: string }[] = [
    { id: "OPERATIONS", icon: "🌐", color: "text-cyan-400" },
    { id: "HUBS", icon: "🏪", color: "text-purple-400" },
    { id: "GLOBAL", icon: "⚖️", color: "text-blue-400" },
    { id: "ANALYTICS", icon: "📊", color: "text-amber-400" },
    { id: "LOGS", icon: "📜", color: "text-teal-400" },
    { id: "SUPPORT", icon: "🚨", color: "text-red-400" },
  ];

  return (
    <nav className="w-16 md:w-28 bg-gray-950 border-r border-white/5 flex flex-col items-center py-10 sticky top-0 h-screen z-50 shadow-[20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-cyan-500/20 group cursor-pointer hover:rotate-12 transition-all mb-12 shrink-0">
         <span className="text-2xl group-hover:scale-110 transition-transform">🛰️</span>
      </div>
      
      {/* 📜 SCROLLABLE TACTICAL MENU */}
      <div className="flex flex-col gap-8 flex-1 overflow-y-auto w-full items-center px-4 custom-scrollbar pb-10">
        {menuItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveView(item.id)}
            className={`p-4 rounded-2xl transition-all relative group flex items-center justify-center shrink-0 w-full ${
              activeView === item.id 
                ? 'bg-white/5 shadow-[0_0_30px_rgba(255,255,255,0.05)] border border-white/10 scale-110' 
                : 'text-gray-600 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <span className={`text-2xl block transition-all duration-300 group-hover:drop-shadow-[0_0_8px_currentColor] ${activeView === item.id ? item.color : 'text-gray-500'}`}>
               {item.icon}
            </span>
            
            {/* Active Indicator Glow */}
            {activeView === item.id && (
               <div className={`absolute -right-4 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-l-full shadow-[0_0_15px_currentColor] animate-pulse ${item.color.replace('text-', 'bg-')}`} />
            )}

            {/* Tooltip on Hover */}
            <div className="absolute left-full ml-6 px-3 py-1 bg-black border border-white/10 rounded-lg text-[8px] font-black uppercase text-white tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-2xl">
               {item.id}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-auto py-8 shrink-0">
         <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_10px_#14b8a6] opacity-30" />
      </div>
    </nav>
  );
};
