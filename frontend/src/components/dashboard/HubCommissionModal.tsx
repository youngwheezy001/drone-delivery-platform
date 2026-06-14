import React, { useState } from 'react';
import { X, Server, Globe, MapPin, ShieldCheck, Mail, Lock } from 'lucide-react';

interface HubCommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  backendUrl: string;
  authHeader: any;
}

export const HubCommissionModal: React.FC<HubCommissionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  backendUrl,
  authHeader
}) => {
  const generateSecureKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 12 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company_id: '',
    region: 'NAIROBI_CENTRAL',
    latitude: -1.2921,
    longitude: 36.7884
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        password: generateSecureKey(),
        company_id: `HUB_${Math.floor(1000 + Math.random() * 9000)}`
      }));
    }
  }, [isOpen]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${backendUrl}/api/v1/admin/hubs`, {
        method: 'POST',
        headers: {
          ...authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        setError(err.detail || "COMMISSIONREFUSED: GRID_LINK_FAILURE");
      }
    } catch (e) {
      setError("UPLINK_TIMEOUT: CROSS-REGIONAL CONGESTION");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl glass rounded-[2.5rem] border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Permanent Commission</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Deploying Autonomous Logistics Infrastructure</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-3">
              <ShieldCheck className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Identity Section */}
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2">
                         <Mail className="w-3 h-3" /> Grid Identifier (Email)
                      </label>
                      <input 
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-teal-500/50 outline-none transition-all"
                        placeholder="hub@auav-grid.io"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Secure Access Key
                      </label>
                      <input 
                        required
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-teal-500/50 outline-none transition-all"
                        placeholder="••••••••"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2">
                        <Server className="w-3 h-3" /> Hub Formal Name
                      </label>
                      <input 
                        required
                        value={formData.full_name}
                        onChange={e => setFormData({...formData, full_name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-teal-500/50 outline-none transition-all"
                        placeholder="NAIROBI_DISTRO_HQ"
                      />
                   </div>
                </div>

                {/* Logistics Section */}
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Sector (Company ID)
                      </label>
                      <input 
                        required
                        value={formData.company_id}
                        onChange={e => setFormData({...formData, company_id: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-teal-500/50 outline-none transition-all"
                        placeholder="NAIROBI_CENTRAL"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2">
                           <MapPin className="w-3 h-3" /> Latitude
                         </label>
                         <input 
                           required
                           type="number"
                           step="any"
                           value={formData.latitude}
                           onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-teal-500/50 outline-none transition-all"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-gray-500 uppercase flex items-center gap-2">
                           <MapPin className="w-3 h-3" /> Longitude
                         </label>
                         <input 
                           required
                           type="number"
                           step="any"
                           value={formData.longitude}
                           onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white focus:border-teal-500/50 outline-none transition-all"
                         />
                      </div>
                   </div>
                </div>
             </div>

             <button 
               type="submit"
               disabled={loading}
               className={`w-full py-5 rounded-2xl bg-teal-500 text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-4 ${loading && 'opacity-50 cursor-not-allowed'}`}
             >
               {loading ? (
                 <>
                   <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                   Synchronizing Grid...
                 </>
               ) : (
                 'Execute Deployment'
               )}
             </button>
          </form>
        </div>
      </div>
    </div>
  );
};
