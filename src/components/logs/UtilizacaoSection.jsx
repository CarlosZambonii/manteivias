import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import RankingFilter from "./RankingFilter";

const metricOptions = [
  { value: "visitas", label: "Visitas" },
  { value: "utilizadores", label: "Utilizadores" },
  { value: "percentagem", label: "% Utilização" },
];

export default function UtilizacaoSection({ utilizacaoData = [], loading }) {
  const [mode, setMode] = useState("top");
  const [metric, setMetric] = useState("visitas");
  const [limit, setLimit] = useState(999);

  const sorted = [...utilizacaoData].sort((a, b) =>
    mode === "top" ? b[metric] - a[metric] : a[metric] - b[metric]
  );
  const items = limit === 999 ? sorted : sorted.slice(0, limit);
  const isTop = mode === "top";
  const maxVal = Math.max(...utilizacaoData.map(x => x[metric]), 1);

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Utilização por Página</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Métricas de utilização de cada módulo</p>
        </div>
        <RankingFilter
          mode={mode} onModeChange={setMode}
          metric={metric} onMetricChange={setMetric}
          metricOptions={metricOptions}
          limit={limit} onLimitChange={setLimit}
        />
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[440px]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-muted-foreground w-8">#</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Página / Módulo</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right">Visitas</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right">Utilizadores</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground w-40">% Utilização</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  Sem dados no período.
                </TableCell>
              </TableRow>
            ) : items.map((row, i) => {
              const pct = maxVal > 0 ? (row[metric] / maxVal) * 100 : 0;
              return (
                <TableRow key={i} className={`border-border/30 hover:bg-secondary/30 ${i === 0 ? (isTop ? "bg-emerald-500/5" : "bg-red-500/5") : ""}`}>
                  <TableCell>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      i === 0
                        ? isTop ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        : "bg-secondary text-muted-foreground"
                    }`}>{i + 1}</div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{row.pagina}</TableCell>
                  <TableCell className={`text-sm text-right font-mono ${metric === "visitas" ? (isTop ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold") : "text-muted-foreground"}`}>
                    {row.visitas}
                  </TableCell>
                  <TableCell className={`text-sm text-right font-mono ${metric === "utilizadores" ? (isTop ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold") : "text-muted-foreground"}`}>
                    {row.utilizadores}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden flex-1">
                        <div
                          className={`h-full rounded-full transition-all ${isTop ? "bg-emerald-500/60" : "bg-red-500/60"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono w-8 text-right ${metric === "percentagem" ? (isTop ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold") : "text-muted-foreground"}`}>
                        {row.percentagem}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
