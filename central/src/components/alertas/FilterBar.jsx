import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

const SelectBtn = ({ label }) => (
  <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] text-xs text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors">
    {label}
    <ChevronDown className="w-3 h-3 text-slate-500" />
  </button>
);

export default function FilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          placeholder="Pesquisar..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>
      <SelectBtn label="Tipo" />
      <SelectBtn label="Estado" />
      <SelectBtn label="Prioridade" />
      <SelectBtn label="Módulo" />
      <SelectBtn label="Data" />
    </div>
  );
}