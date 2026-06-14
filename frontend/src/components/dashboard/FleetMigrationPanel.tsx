import React, { useState } from 'react';
import { Send, ArrowRightLeft, Shield, Zap, Info } from 'lucide-react';

import { Hub } from '../../types';

interface FleetMigrationPanelProps {
  hubs: Hub[];
  onMigrate: (source: string, target: string, quantity: number) => Promise<void>;
}

export const FleetMigrationPanel: React.FC<FleetMigrationPanelProps> = ({ hubs, onMigrate }) => {
  const [sourceHub, setSourceHub] = useState('');
  const [targetHub, setTargetHub] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isMigrating, setIsMigrating] = useState(false);

  const handleMigration = async () => {
    if (!sourceHub || !targetHub || sourceHub === targetHub) return;
    setIsMigrating(true);
    try {
      await onMigrate(sourceHub, targetHub, quantity);
      setQuantity(1);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="glass p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-8">
           <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
              <ArrowRightLeft className="w-6 h-6" />
           </div>
           <div>
              <h3 className="text-xl font-black tracking-tighter text-white">Batch Fleet Migration</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sector Redistribution Protocol</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Source Hub</label>
            <select 
              value={sourceHub}
              onChange={(e) => setSourceHub(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-all appearance-none"
            >
              <option value="">Select Origin</option>
              {hubs.map(hub => (
                <option key={hub.id} value={hub.company_id}>{hub.company_id} ({hub.region})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Target Hub</label>
            <select 
              value={targetHub}
              onChange={(e) => setTargetHub(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold text-white outline-none focus:border-blue-500/50 transition-all appearance-none"
            >
              <option value="">Select Destination</option>
              {hubs.map(hub => (
                <option key={hub.id} value={hub.company_id}>{hub.company_id} ({hub.region})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Mission Payload (UAVs)</label>
            <div className="flex gap-2">
              {[1, 3, 5, 10].map(val => (
                <button
                  key={val}
                  onClick={() => setQuantity(val)}
                  className={`flex-1 p-4 rounded-2xl text-xs font-black transition-all border ${
                    quantity === val ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 mb-8 flex gap-4 items-start">
           <Info className="w-5 h-5 text-blue-400 shrink-0 mt-1" />
           <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
             <span className="text-blue-400 font-bold block mb-1">ECONOMY MODE ACTIVE</span>
             Drones will be marked as <span className="text-white">MIGRATING</span> during transit. This redistribution will take approximately 60 seconds to finalize on the target grid.
           </p>
        </div>

        <button
          onClick={handleMigration}
          disabled={isMigrating || !sourceHub || !targetHub || sourceHub === targetHub}
          className="w-full p-5 bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all shadow-xl shadow-blue-500/10 group"
        >
          {isMigrating ? (
            <div className="flex items-center gap-3 animate-pulse">
               <Zap className="w-4 h-4 animate-bounce" />
               Initiating Redistribution...
            </div>
          ) : (
            <>
              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Execute Regional Migration
            </>
          )}
        </button>
      </div>

      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none" />
    </div>
  );
};
