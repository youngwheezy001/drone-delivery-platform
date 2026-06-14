import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, Navigation, Package, AlertCircle } from 'lucide-react';

const ACTIVE_IP = "10.0.13.206"; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${ACTIVE_IP}:8000`;

interface OrderManagerProps {
  hubId: string;
}

export const OrderManager: React.FC<OrderManagerProps> = ({ hubId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/deliveries/seller/active?company_id=${hubId}`);
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [hubId]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/deliveries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="h-64 bg-white/5 rounded-[2rem] animate-pulse" />;
  }

  const getStatusColor = (s: string) => {
    if (s === 'SCHEDULED') return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    if (s === 'PREPARING') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    if (s === 'READY') return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (s === 'DISPATCHED') return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    return 'bg-white/10 text-white border-white/20';
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col gap-6">
       <div className="flex justify-between items-center pb-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-black text-white">Active Queue</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Live Order Management</p>
          </div>
          <div className="px-4 py-2 bg-white/5 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
             {orders.length} Active
          </div>
       </div>

       {orders.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-10 gap-4 opacity-50">
           <Package className="w-10 h-10 text-gray-500" />
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Active Orders</p>
         </div>
       ) : (
         <div className="flex flex-col gap-4">
            {orders.map(order => (
               <div key={order.id} className="bg-black/50 border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-6">
                     <div className={`px-4 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest w-28 text-center ${getStatusColor(order.status)}`}>
                        {order.status}
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Order #{order.id.split('-')[0]}</h4>
                        <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest flex items-center gap-2">
                           <Clock className="w-3 h-3" /> {order.time_elapsed}
                        </p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                     {order.status === 'SCHEDULED' && (
                       <button 
                         onClick={() => updateStatus(order.id, 'PREPARING')}
                         className="px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-yellow-500/20"
                       >
                         Accept & Prepare
                       </button>
                     )}
                     {order.status === 'PREPARING' && (
                       <button 
                         onClick={() => updateStatus(order.id, 'READY')}
                         className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors border border-green-500/20 flex items-center gap-2"
                       >
                         <CheckCircle2 className="w-4 h-4" /> Ready for UAV
                       </button>
                     )}
                     {order.status === 'READY' && (
                       <button 
                         onClick={() => updateStatus(order.id, 'DISPATCHED')}
                         className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                       >
                         <Navigation className="w-4 h-4" /> Request Drone
                       </button>
                     )}
                     {order.status === 'DISPATCHED' && (
                       <div className="flex items-center gap-2 text-cyan-500 px-6 py-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Drone Inbound</span>
                       </div>
                     )}
                  </div>
               </div>
            ))}
         </div>
       )}
    </div>
  );
};
