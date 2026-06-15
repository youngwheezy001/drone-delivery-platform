'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMissionStore } from '../../lib/store';
import { Lock, User, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAccessToken } = useMissionStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mfaStage, setMfaStage] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Bypassing Backend for Presentation Purposes
      setTimeout(() => {
        setMfaStage(true);
        sessionStorage.setItem('__temp_token', "MOCK_PRESENTATION_TOKEN");
      }, 500);
    } catch (err) {
      setError('COMM_LINK_FAILURE: BACKEND UNREACHABLE');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaComplete = () => {
    setIsScanning(true);
    setTimeout(() => {
      const token = sessionStorage.getItem('__temp_token');
      if (token) setAccessToken(token);
      router.push('/');
    }, 2000);
  };

  if (mfaStage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-grid">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="glass p-12 rounded-[3rem] border border-white/5 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-teal-500/50"></div>
            
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Biometric Uplink</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-12">Tier-2 Authentication Required</p>

            <div className="relative w-48 h-64 mx-auto mb-12 group cursor-pointer" onClick={handleMfaComplete}>
               {/* Handprint Silhouette */}
               <div className="absolute inset-0 border-2 border-dashed border-teal-500/20 rounded-3xl flex items-center justify-center group-hover:border-teal-500/50 transition-colors">
                  <ShieldCheck className={`w-24 h-24 ${isScanning ? 'text-teal-400 animate-pulse' : 'text-gray-800'}`} />
               </div>
               
               {/* Scanner Line */}
               {isScanning && (
                 <div className="absolute top-0 left-0 w-full h-0.5 bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.8)] animate-scan"></div>
               )}

               <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-teal-500/50 uppercase tracking-[0.2em]">
                  {isScanning ? 'SCANNING_OS' : 'PLACE HAND TO INITIATE'}
               </div>
            </div>

            <p className="text-[10px] text-gray-600 font-medium italic">
               Waiting for operator biometric signature...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-grid selection:bg-teal-500">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-700">
        <div className="glass p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
          {/* Tactical Decor */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 blur-[100px] rounded-full"></div>
          
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-500">
               <ShieldCheck className="w-8 h-8 text-teal-400" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Secure Uplink</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Nairobi UAV Network Command</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Operator Identifier</label>
               <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-teal-400 transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@mission.os"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-gray-700 focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.08] transition-all"
                    required
                  />
               </div>
            </div>

            <div className="space-y-2">
               <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Tactical Keyphrase</label>
               <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-teal-400 transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-gray-700 focus:outline-none focus:border-teal-500/50 focus:bg-white/[0.08] transition-all"
                    required
                  />
               </div>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-pulse">
                 <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                 <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? 'ESTABLISHING LINK...' : 'INITIATE UPLINK'}
            </button>
          </form>

          <div className="mt-8 flex justify-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-teal-500 rounded-full"></div>
                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">RSA-4096</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-teal-500 rounded-full"></div>
                <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">MFA_READY</span>
             </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-gray-700 font-bold uppercase tracking-widest">
           Proprietary OS v4.2 © 2026 Tustar Defense Systems
        </p>
      </div>
    </div>
  );
}
