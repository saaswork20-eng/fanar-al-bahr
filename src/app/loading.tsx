import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#070a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">Loading Fanar Store...</p>
      </div>
    </div>
  );
}
