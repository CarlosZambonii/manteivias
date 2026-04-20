import React from 'react';

const styles = {
  Erro:             "bg-red-500/15 text-red-300 border-red-500/25",
  Ajuda:            "bg-blue-500/15 text-blue-300 border-blue-500/25",
  Melhoria:         "bg-violet-500/15 text-violet-300 border-violet-500/25",
  Atualização:      "bg-blue-600/15 text-blue-200 border-blue-600/25",
  Baixa:            "bg-slate-500/10 text-slate-300 border-slate-500/20",
  Média:            "bg-amber-500/15 text-amber-300 border-amber-500/25",
  Alta:             "bg-red-500/20 text-red-300 border-red-500/30",
  Novo:             "bg-blue-500/15 text-blue-300 border-blue-500/25",
  "Em análise":     "bg-amber-500/15 text-amber-300 border-amber-500/25",
  "Em desenvolvimento": "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
  Resolvido:        "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Recebido:         "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  Planeado:         "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25",
  Aplicado:         "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  Módulo:           "bg-slate-700/30 text-slate-300 border-slate-600/20",
};

export default function Badge({ children, variant }) {
  const cls = styles[variant] || styles["Módulo"];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${cls}`}>
      {children}
    </span>
  );
}