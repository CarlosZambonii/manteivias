import React from 'react';

export default function StatCard({ label, value, color = "text-blue-400" }) {
  return (
    <div className="rounded-xl border border-[#1e2a3a] bg-[#0f1b2d] p-3 sm:p-4 flex flex-col gap-0.5 hover:border-blue-500/30 transition-colors">
      <p className="text-xl sm:text-2xl font-semibold text-white">{value}</p>
      <p className="text-[10px] sm:text-xs text-slate-400 leading-tight">{label}</p>
    </div>
  );
}