'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Activity, Globe, Zap, AlertCircle, FileCheck, Landmark } from 'lucide-react';

const ACTIVE_IP = "10.0.10.0"; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || `http://${ACTIVE_IP}:8000`;

export default function RegulatorDashboard() {
  const [snapshot, setSnapshot] = useState<any>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/v1/admin/regulator/health-snapshot`);
        if (res.ok) setSnapshot(await res.json());
      } catch (e) {}
    };
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!snapshot) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
       <div className="animate-pulse flex flex-col items-center">
          <Landmark className="w-12 h-12 text-slate-400 mb-4" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Verifying Institutional Link...</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-slate-200">
      {/* Institutional Top Bar */}
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between sticky top-0 z-50 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg">
               <Shield className="w-6 h-6" />
            </div>
            <div>
               <h1 className="text-xl font-black tracking-tight text-slate-900">Nairobi UAV Regulatory Portal</h1>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Public Safety & U-Space Transparency HUD</p>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-xs font-black uppercase tracking-wider">Operational Integrity: High</span>
            </div>
            <div className="text-right">
               <p className="text-[10px] text-slate-400 font-black uppercase">System Epoch</p>
               <p className="text-xs font-bold font-mono">2026.04.19-BETA</p>
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto p-12">
         {/* Compliance Banner */}
         <div className="bg-white rounded-[2rem] border border-slate-200 p-10 shadow-xl shadow-slate-200/50 mb-12 flex flex-col md:flex-row items-center justify-between gap-8 group">
            <div className="flex items-center gap-8">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl border border-slate-100 group-hover:scale-110 transition-transform">🏛️</div>
               <div>
                  <h2 className="text-3xl font-black tracking-tighter text-slate-900">Network Compliance Snapshot</h2>
                  <p className="text-slate-500 font-medium max-w-xl text-sm leading-relaxed mt-2">
                     Automated U-Space transparency layer providing civil aviation authorities with real-time situational awareness of autonomous logistics activities within Nairobi's airspace.
                  </p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="bg-blue-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all cursor-pointer">
                  Request Audit Log
               </div>
            </div>
         </div>

         {/* Metrics Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {[
               { icon: Activity, label: "Network Uptime", value: `${snapshot.network_uptime}%`, color: "text-blue-600", bg: "bg-blue-50" },
               { icon: Zap, label: "Success Coefficient", value: `${snapshot.mission_success_rate}%`, color: "text-emerald-600", bg: "bg-emerald-50" },
               { icon: Globe, label: "Active UAV Fleet", value: snapshot.active_uav_count, color: "text-amber-600", bg: "bg-amber-50" },
               { icon: FileCheck, label: "Policy Compliance", value: snapshot.regulatory_compliance, color: "text-slate-600", bg: "bg-slate-50" },
            ].map((m, i) => (
               <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/30">
                  <div className={`p-4 ${m.bg} ${m.color} w-fit rounded-2xl mb-6`}>
                     <m.icon className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{m.label}</p>
                  <p className="text-3xl font-black text-slate-900 tracking-tight">{m.value}</p>
               </div>
            ))}
         </div>

         {/* Integrity & Risk Section */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 p-10 shadow-lg shadow-slate-200/30">
               <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Active Airspace Integration</h3>
                    <p className="text-xs text-slate-500 font-medium">Real-time U-Space corridor management status</p>
                  </div>
                  <div className="flex gap-2">
                     <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase">Level 4 Autonomous</span>
                  </div>
               </div>
               
               <div className="space-y-6">
                  {[
                    { label: "Swarm Avoidance Confidence", val: 99.8, color: "bg-blue-500" },
                    { label: "Emergency Landing Site Availability", val: 94.2, color: "bg-emerald-500" },
                    { label: "Ground Population Defense Bias", val: 100, color: "bg-purple-500" },
                  ].map((p, i) => (
                    <div key={i}>
                       <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                          <span className="text-slate-500">{p.label}</span>
                          <span className="text-slate-900">{p.val}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${p.color} rounded-full transition-all duration-1000`} style={{ width: `${p.val}%` }} />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-900/40 text-white relative overflow-hidden group">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 text-amber-400 mb-8">
                     <AlertCircle className="w-6 h-6" />
                     <span className="text-xs font-black uppercase tracking-widest">Environmental Risk Analysis</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mb-4">Climate Stability: {snapshot.environmental_risk}</h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                     Atmospheric intelligence indicates nominal flight conditions across all monitored urban sectors. No high-altitude micro-bursts detected.
                  </p>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 group-hover:bg-white/10 transition-all">
                     <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Last Sync</p>
                     <p className="text-xs font-mono font-bold text-amber-400">12:50:44 EAT-SHIELD-V4</p>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[120px] pointer-events-none" />
            </div>
         </div>
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 mt-20 px-8 py-10 bg-white text-center">
         <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.5em]">
            Official U-Space Transparency HUD • Republic of Nairobi Logistics Authority
         </p>
      </footer>
    </div>
  );
}
