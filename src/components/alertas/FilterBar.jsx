import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

const selectCls = "appearance-none pl-3 pr-7 py-2 rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] text-xs text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors focus:outline-none focus:border-blue-500/50 cursor-pointer";

function FilterSelect({ label, options, value, onChange }) {
  return (
    <div className="relative">
      <select className={selectCls} value={value || ''} onChange={onChange}>
        <option value="">{label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
    </div>
  );
}

export default function FilterBar({ filters = {}, onChange }) {
  const set = (key) => (e) => onChange?.({ ...filters, [key]: e.target.value });

  const hasFilters = filters.search || filters.tipo || filters.estado || filters.prioridade || filters.modulo;

  return (
    <div className="flex flex-col gap-2">
      {/* Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={set('search')}
          placeholder="Pesquisar..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>

      {/* Filtros — scroll horizontal no mobile */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
        <FilterSelect
          label="Tipo"
          options={["Erro", "Ajuda", "Melhoria", "Futuro"]}
          value={filters.tipo}
          onChange={set('tipo')}
        />
        <FilterSelect
          label="Estado"
          options={["Recebido", "Em análise", "Planeado", "Em desenvolvimento", "Resolvido"]}
          value={filters.estado}
          onChange={set('estado')}
        />
        <FilterSelect
          label="Prioridade"
          options={["Baixa", "Média", "Alta"]}
          value={filters.prioridade}
          onChange={set('prioridade')}
        />
        <FilterSelect
          label="Módulo"
          options={["Registos","Férias","Exportação","Notificações","Perfis & Acessos","Validações","Frotas","Obras","Outro"]}
          value={filters.modulo}
          onChange={set('modulo')}
        />
        {hasFilters && (
          <button
            onClick={() => onChange?.({ search: '', tipo: '', estado: '', prioridade: '', modulo: '' })}
            className="flex-shrink-0 px-3 py-2 rounded-lg border border-[#1e2a3a] text-xs text-slate-500 hover:text-white hover:border-slate-500 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}
