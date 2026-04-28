import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { User, LogIn, FileText, Wrench } from "lucide-react";
import { colaboradoresData } from "@/lib/logsData";
import RankingFilter from "./RankingFilter";
import CategoriaFilter from "./CategoriaFilter";

const atividadeBadge = {
  alta: { label: "Alta atividade", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  media: { label: "Média", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  baixa: { label: "Baixa", className: "bg-secondary text-muted-foreground border-border/50" },
};

const metricOptions = [
  { value: "acessos", label: "Acessos" },
  { value: "registos", label: "Registos" },
  { value: "correcoes", label: "Correções" },
];

export default function ColaboradoresSection() {
  const [mode, setMode] = useState("top");
  const [metric, setMetric] = useState("acessos");
  const [limit, setLimit] = useState(999);
  const [categoria, setCategoria] = useState("Todas as Categorias");

  const filtered = categoria === "Todas as Categorias"
    ? colaboradoresData
    : colaboradoresData.filter(c => c.categoria === categoria);

  const sorted = [...filtered].sort((a, b) =>
    mode === "top" ? b[metric] - a[metric] : a[metric] - b[metric]
  );
  const items = limit === 999 ? sorted : sorted.slice(0, limit);
  const isTop = mode === "top";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3 px-1">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Atividade por Colaborador</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Desempenho e utilização individual</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <CategoriaFilter value={categoria} onChange={setCategoria} />
          <RankingFilter
            mode={mode} onModeChange={setMode}
            metric={metric} onMetricChange={setMetric}
            metricOptions={metricOptions}
            limit={limit} onLimitChange={setLimit}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((col, i) => {
          const badge = atividadeBadge[col.atividade];
          return (
            <div
              key={i}
              className={`bg-card rounded-xl border p-4 hover:border-primary/20 transition-colors ${
                i === 0
                  ? isTop ? "border-emerald-500/30" : "border-red-500/30"
                  : "border-border/60"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center relative ${
                    i === 0 ? (isTop ? "bg-emerald-500/15" : "bg-red-500/15") : "bg-primary/10"
                  }`}>
                    <User className={`w-4 h-4 ${i === 0 ? (isTop ? "text-emerald-400" : "text-red-400") : "text-primary"}`} />
                    {i === 0 && (
                      <span className={`absolute -top-1 -right-1 text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                        isTop ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                      }`}>{isTop ? "↑" : "↓"}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{col.nome}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {col.categoria} · #{i + 1} por {metricOptions.find(m => m.value === metric)?.label}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] font-normal ${badge.className}`}>
                  {badge.label}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <LogIn className="w-3 h-3 text-muted-foreground" />
                  <div>
                    <p className={`text-sm font-bold ${metric === "acessos" ? (isTop ? "text-emerald-400" : "text-red-400") : "text-foreground"}`}>{col.acessos}</p>
                    <p className="text-[10px] text-muted-foreground">Acessos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  <div>
                    <p className={`text-sm font-bold ${metric === "registos" ? (isTop ? "text-emerald-400" : "text-red-400") : "text-foreground"}`}>{col.registos}</p>
                    <p className="text-[10px] text-muted-foreground">Registos</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="w-3 h-3 text-muted-foreground" />
                  <div>
                    <p className={`text-sm font-bold ${metric === "correcoes" ? (isTop ? "text-emerald-400" : "text-red-400") : "text-foreground"}`}>{col.correcoes}</p>
                    <p className="text-[10px] text-muted-foreground">Correções</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}