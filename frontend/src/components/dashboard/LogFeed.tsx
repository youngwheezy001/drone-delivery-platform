import React, { useEffect, useRef } from 'react';
import { useMissionStore, LogEntry } from '../../lib/store';

export const LogFeed: React.FC = () => {
  const { logs } = useMissionStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'text-teal-400';
      case 'WARNING': return 'text-orange-400';
      case 'ERROR': return 'text-red-500 font-black animate-pulse';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/60 border border-white/5 rounded-3xl overflow-hidden font-mono text-[11px] selection:bg-teal-500/30">
      <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></div>
            <span className="font-black uppercase tracking-widest text-gray-500">Live Diagnostic Stream</span>
         </div>
         <span className="text-[9px] text-gray-600">Baud: 115200</span>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-thin scrollbar-thumb-white/10"
      >
        {logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-700 uppercase tracking-tighter">
             No active logs in current session buffer
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-4 group hover:bg-white/5 p-1 rounded transition-colors">
              <span className="text-gray-600 shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]
              </span>
              <span className={`shrink-0 font-black ${getLevelColor(log.level)}`}>
                {log.level}
              </span>
              <span className="text-gray-300 break-all">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex gap-4 text-[9px] text-gray-600 overflow-hidden">
        <span className="shrink-0">LINK_STATE: CONNECTED</span>
        <span className="shrink-0 opacity-50">|</span>
        <span className="shrink-0">ENCRYPTION: AES-256</span>
        <span className="shrink-0 opacity-50">|</span>
        <span className="truncate">SYSTEM_BUFFER: {logs.length}/100</span>
      </div>
    </div>
  );
};
