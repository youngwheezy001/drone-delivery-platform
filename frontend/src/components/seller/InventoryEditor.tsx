import React, { useEffect, useState } from 'react';
import { Store, Edit2, Check, Zap, Image as ImageIcon } from 'lucide-react';

const ACTIVE_IP = "10.0.13.206"; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${ACTIVE_IP}:8000`;

interface InventoryEditorProps {
  token: string;
}

export const InventoryEditor: React.FC<InventoryEditorProps> = ({ token }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/marketplace/my-inventory`, {
         headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [token]);

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setEditForm({ price: p.price, is_trending: p.is_trending });
  };

  const handleSave = async (id: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/v1/marketplace/products/${id}`, {
        method: 'PATCH',
        headers: { 
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(editForm)
      });
      setEditingId(null);
      fetchInventory();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="h-64 bg-white/5 rounded-[2rem] animate-pulse" />;

  return (
    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col gap-6">
       <div className="flex justify-between items-center pb-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-black text-white">Digital Storefront</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Inventory Management</p>
          </div>
          <button className="px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors">
             + Add Item
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-black/50 border border-white/5 rounded-2xl overflow-hidden group hover:border-white/20 transition-all">
               <div className="h-32 bg-gray-900 relative">
                  {p.is_trending && (
                     <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full z-10 flex items-center gap-1">
                       <Zap className="w-3 h-3" /> Trending
                     </div>
                  )}
                  {p.image_url ? (
                     <img src={p.image_url} alt={p.name} className="w-full h-full object-cover opacity-60" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white/10" />
                     </div>
                  )}
               </div>
               
               <div className="p-5 flex flex-col gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{p.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 line-clamp-1">{p.description || "Premium Item"}</p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                     {editingId === p.id ? (
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-black text-gray-500">KES</span>
                           <input 
                             type="number" 
                             value={editForm.price}
                             onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})}
                             className="w-20 bg-white/10 border border-white/20 rounded-md px-2 py-1 text-sm font-black text-cyan-400 focus:outline-none"
                           />
                        </div>
                     ) : (
                        <span className="text-sm font-black text-cyan-400">KES {p.price}</span>
                     )}
                     
                     {editingId === p.id ? (
                        <button onClick={() => handleSave(p.id)} className="w-8 h-8 rounded-full bg-green-500 text-black flex items-center justify-center hover:scale-110 transition-transform">
                           <Check className="w-4 h-4" />
                        </button>
                     ) : (
                        <button onClick={() => handleEdit(p)} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
                           <Edit2 className="w-4 h-4" />
                        </button>
                     )}
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};
