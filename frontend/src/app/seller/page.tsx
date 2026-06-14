'use client';

import React, { useState, useEffect } from 'react';
import { Store, LogOut, Navigation, Package } from 'lucide-react';
import { OrderManager } from '../../components/seller/OrderManager';
import { InventoryEditor } from '../../components/seller/InventoryEditor';
import { EarningsBoard } from '../../components/seller/EarningsBoard';
import { useRouter } from 'next/navigation';

// Mock Auth Flow for demonstration
const SellerAuthWall = ({ onLogin }: { onLogin: (token: string, hubId: string, name: string) => void }) => {
  return (
    <div className="flex flex-col h-screen bg-black p-6 justify-center items-center">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <Store className="w-10 h-10 text-cyan-500" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Merchant</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Tustar Network</p>
        </div>
        
        <div className="flex flex-col gap-4 mt-8">
          <button 
            onClick={() => onLogin("mock-token", "user_tustar_hq", "Tustar HQ Node")}
            className="bg-white/10 border border-white/20 text-white font-black p-4 rounded-2xl uppercase tracking-widest hover:bg-cyan-500 hover:border-cyan-400 hover:text-black transition-all"
          >
            Sign In as Tustar HQ
          </button>
          <button 
            onClick={() => onLogin("mock-token", "user_megascript_hub", "Megascript Logistics")}
            className="bg-white/10 border border-white/20 text-white font-black p-4 rounded-2xl uppercase tracking-widest hover:bg-purple-500 hover:border-purple-400 hover:text-black transition-all"
          >
            Sign In as Megascript Hub
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SellerPortal() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [hubId, setHubId] = useState<string | null>(null);
  const [hubName, setHubName] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'INVENTORY'>('ORDERS');

  useEffect(() => {
    const t = localStorage.getItem('tustar_seller_token');
    const h = localStorage.getItem('tustar_seller_hub');
    const n = localStorage.getItem('tustar_seller_name');
    if (t && h) {
      setToken(t);
      setHubId(h);
      setHubName(n);
    }
  }, []);

  const handleLogin = (t: string, h: string, n: string) => {
    localStorage.setItem('tustar_seller_token', t);
    localStorage.setItem('tustar_seller_hub', h);
    localStorage.setItem('tustar_seller_name', n);
    setToken(t);
    setHubId(h);
    setHubName(n);
  };

  const handleLogout = () => {
    localStorage.removeItem('tustar_seller_token');
    localStorage.removeItem('tustar_seller_hub');
    localStorage.removeItem('tustar_seller_name');
    setToken(null);
    setHubId(null);
    setHubName(null);
  };

  if (!token || !hubId) {
    return <SellerAuthWall onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden bg-[radial-gradient(circle_at_50%_0%,_rgba(34,_211,_238,_0.05)_0%,_transparent_50%)]">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/5 flex flex-col justify-between hidden md:flex p-6">
         <div>
            <div className="flex items-center gap-3 mb-12">
               <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-black" />
               </div>
               <div>
                  <h1 className="text-lg font-black text-white uppercase tracking-tighter">Tustar</h1>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Merchant Portal</p>
               </div>
            </div>

            <nav className="flex flex-col gap-2">
               <button 
                 onClick={() => setActiveTab('ORDERS')}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ORDERS' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
               >
                  <Store className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Active Queue</span>
               </button>
               <button 
                 onClick={() => setActiveTab('INVENTORY')}
                 className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'INVENTORY' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
               >
                  <Package className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Inventory</span>
               </button>
            </nav>
         </div>

         <button 
           onClick={handleLogout}
           className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
         >
            <LogOut className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
         </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
         {/* Top Header */}
         <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 shrink-0">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">{activeTab.replace('_', ' ')}</h2>
            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active Node</p>
                  <p className="text-sm font-black text-white">{hubName}</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
               </div>
            </div>
         </header>

         {/* Scrollable Dashboard */}
         <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-10">
            <EarningsBoard hubId={hubId} />

            {activeTab === 'ORDERS' && <OrderManager hubId={hubId} />}
            {activeTab === 'INVENTORY' && <InventoryEditor token={token} />}
         </div>
      </main>
    </div>
  );
}
