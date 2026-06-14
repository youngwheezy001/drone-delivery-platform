'use client';

import React, { useState, useEffect } from 'react';
import { Home, ShoppingBag, Map, User as UserIcon, Navigation } from 'lucide-react';
import { Storefront } from '../../components/customer/Storefront';
import { CartCheckout } from '../../components/customer/CartCheckout';
import { LiveTracker } from '../../components/customer/LiveTracker';

const ACTIVE_IP = "10.0.13.206"; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${ACTIVE_IP}:8000`;

// Mock Auth Flow for demonstration
const AuthWall = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [email, setEmail] = useState('');
  
  return (
    <div className="flex flex-col h-[100dvh] bg-black p-6 justify-center items-center">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <Navigation className="w-10 h-10 text-cyan-500" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Tustar</h1>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Delivery, Elevated.</p>
        </div>
        
        <div className="flex flex-col gap-4 mt-8">
          <input 
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <button 
            onClick={() => onLogin({ id: email || "guest@tustar.io", name: "Guest User" })}
            className="bg-white text-black font-black p-4 rounded-2xl uppercase tracking-widest hover:bg-cyan-400 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CustomerPortal() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'HOME' | 'CART' | 'TRACK'>('HOME');
  const [cart, setCart] = useState<any[]>([]);
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for mock user and active delivery
    const saved = localStorage.getItem('tustar_customer');
    if (saved) setUser(JSON.parse(saved));
    
    const savedDel = localStorage.getItem('tustar_active_delivery');
    if (savedDel) setActiveDeliveryId(savedDel);
  }, []);

  const handleLogin = (u: any) => {
    localStorage.setItem('tustar_customer', JSON.stringify(u));
    setUser(u);
  };

  const handleAddToCart = (product: any, hub: any) => {
    setCart(prev => [...prev, { product, hub }]);
    // Flash a little notification
  };

  const handleClearCart = () => setCart([]);

  const handleCheckoutSuccess = (deliveryId: string) => {
    setActiveDeliveryId(deliveryId);
    localStorage.setItem('tustar_active_delivery', deliveryId);
    setActiveTab('TRACK');
  };

  if (!user) {
    return <AuthWall onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-black">
      {/* Dynamic Header */}
      {activeTab !== 'TRACK' && (
        <header className="px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10 sticky top-0 backdrop-blur-md">
           <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Delivering to</p>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-sm font-black text-white">Current Location</p>
                   <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                 <UserIcon className="w-5 h-5 text-white" />
              </div>
           </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
         {activeTab === 'HOME' && (
           <div className="pt-6">
              <Storefront onAddToCart={handleAddToCart} />
           </div>
         )}
         {activeTab === 'CART' && (
           <div>
              <CartCheckout 
                cart={cart} 
                user={user} 
                onClearCart={handleClearCart} 
                onCheckoutSuccess={handleCheckoutSuccess} 
              />
           </div>
         )}
         {activeTab === 'TRACK' && (
           <div className="h-full relative">
              <LiveTracker deliveryId={activeDeliveryId} />
           </div>
         )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/5 px-6 py-4 pb-safe flex justify-between items-center z-50">
        <button 
          onClick={() => setActiveTab('HOME')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'HOME' ? 'text-cyan-400' : 'text-gray-500'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('CART')}
          className={`flex flex-col items-center gap-1 transition-colors relative ${activeTab === 'CART' ? 'text-cyan-400' : 'text-gray-500'}`}
        >
          <div className="relative">
             <ShoppingBag className="w-6 h-6" />
             {cart.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-[9px] font-black text-black">
                   {cart.length}
                </div>
             )}
          </div>
          <span className="text-[10px] font-bold uppercase">Cart</span>
        </button>
        <button 
          onClick={() => setActiveTab('TRACK')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'TRACK' ? 'text-cyan-400' : 'text-gray-500'}`}
        >
          <Map className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Track</span>
        </button>
      </nav>
    </div>
  );
}
