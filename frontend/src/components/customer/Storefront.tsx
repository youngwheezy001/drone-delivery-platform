import React, { useEffect, useState } from 'react';
import { Search, MapPin, Store, Star, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

const ACTIVE_IP = "10.0.13.206"; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${ACTIVE_IP}:8000`;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  weight_kg: number;
  is_trending: boolean;
  image_url: string;
}

interface Hub {
  id: string;
  name: string;
  company_id: string;
  region: string;
  products: Product[];
}

interface StorefrontProps {
  onAddToCart: (product: Product, hub: Hub) => void;
}

export const Storefront: React.FC<StorefrontProps> = ({ onAddToCart }) => {
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/marketplace/discovery`);
        if (res.ok) {
          const data = await res.json();
          setHubs(data);
        }
      } catch (err) {
        console.error("Discovery API Error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscovery();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
         {[1, 2, 3].map(i => (
           <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse"></div>
         ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Search Bar */}
      <div className="px-6">
        <div className="relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
           <input 
             type="text"
             placeholder="Search food, groceries, electronics..."
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="w-full bg-white/10 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder-gray-500 font-bold"
           />
        </div>
      </div>

      {/* Promoted Categories (Static for visual polish) */}
      <div className="px-6 flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
         {['🍔 Fast Food', '💊 Pharmacy', '💻 Electronics', '🍎 Groceries'].map((cat, i) => (
           <div key={i} className="flex-shrink-0 bg-white/5 px-6 py-3 rounded-full border border-white/5 whitespace-nowrap">
             <span className="text-sm font-bold text-white">{cat}</span>
           </div>
         ))}
      </div>

      {/* Active Hubs & Products */}
      <div className="px-6 flex flex-col gap-10">
        {hubs.filter(h => h.products.length > 0).map(hub => (
          <div key={hub.id} className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center">
                    <Store className="w-5 h-5 text-cyan-400" />
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-white leading-tight">{hub.name}</h3>
                   <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span>4.9 Excellent • {hub.region}</span>
                   </div>
                 </div>
               </div>
               <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                 <ArrowRight className="w-4 h-4 text-white" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {hub.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(product => (
                 <div key={product.id} className="bg-white/5 rounded-[2rem] overflow-hidden border border-white/5 relative group">
                   {product.is_trending && (
                     <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full z-10 flex items-center gap-1">
                       <Zap className="w-3 h-3" /> Trending
                     </div>
                   )}
                   <div className="h-32 bg-gray-900 relative">
                     {/* Placeholder if no image */}
                     {product.image_url ? (
                       <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-80" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center">
                         <Store className="w-10 h-10 text-white/10" />
                       </div>
                     )}
                   </div>
                   <div className="p-4 flex flex-col gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{product.name}</h4>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1 line-clamp-1">{product.description || "Premium Item"}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                         <span className="text-sm font-black text-cyan-400">KES {product.price}</span>
                         <button 
                           onClick={() => onAddToCart(product, hub)}
                           className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                         >
                           <span className="font-black">+</span>
                         </button>
                      </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
