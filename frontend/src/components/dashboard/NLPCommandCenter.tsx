import React, { useState } from 'react';

export const NLPCommandCenter = () => {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<{role: 'user'|'system', text: string}[]>([
    { role: 'system', text: "J.A.R.V.I.S Tactical Uplink Established. Awaiting commands..." }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const userText = command.trim();
    setHistory(prev => [...prev, { role: 'user', text: userText }]);
    setCommand("");
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/nlp/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: userText })
      });
      const data = await res.json();
      
      setHistory(prev => [...prev, { role: 'system', text: data.reply }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'system', text: "Connection error. Unable to reach HQ." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/10 p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <h3 className="text-cyan-400 font-black text-sm tracking-widest uppercase">NLP Command Interface</h3>
        </div>
        <span className="text-[10px] text-gray-500 font-mono tracking-widest">v8.0.1</span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] custom-scrollbar space-y-4">
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-100' 
                : 'bg-black/60 border border-white/10 text-gray-300'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-50">
                <span className="text-[8px] tracking-wider font-bold">
                  {msg.role === 'user' ? 'COMMANDER_INPUT' : 'SYSTEM_RESPONSE'}
                </span>
              </div>
              <p className="leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-black/60 border border-white/10 rounded-lg p-3 text-cyan-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping"></div>
                <span>Processing intent...</span>
             </div>
          </div>
        )}
      </div>

      <form onSubmit={handleCommand} className="p-3 bg-black/60 border-t border-white/10">
        <div className="relative flex items-center">
          <span className="absolute left-4 text-cyan-500 font-black">{'>'}</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type a command (e.g., 'ground all drones')"
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-mono text-cyan-100 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
};
