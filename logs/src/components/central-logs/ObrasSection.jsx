import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, TrendingUp, TrendingDown } from "lucide-react";
import { obrasData } from "@/lib/logsData";
import RankingFilter from "./RankingFilter";

const metricOptions = [
  { value: "registos", label: "Registos" },
  { value: "acessos", label: "Acessos" },
  { value: "colaboradores", label: "Colaboradores" },
];

export default function ObrasSection() {
  const [mode, setMode] = useState("top");
  const [metric, setMetric] = useState("registos");
  const [limit, setLimit] = useState(999);

  const sorted = [...obrasData].sort((a, b) =>
    mode === "top" ? b[metric] - a[metric] : a[metric] - b[metric]
  );
  const items = limit === 999 ? sorted : sorted.slice(0, limit);
  const isTop = mode === "top";
  const maxVal = Math.max(...obrasData.map(x => x[metric]));

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Utilização por Obra</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Acessos e registos por obra ativa</p>
        </div>
        <RankingFilter
          mode={mode} onModeChange={setMode}
          metric={metric} onMetricChange={setMetric}
          metricOptions={metricOptions}
          limit={limit} onLimitChange={setLimit}
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-muted-foreground w-8">#</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Nome da Obra</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right">Acessos</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right">Registos</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right">Colaboradores</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground w-32">Barra</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row, i) => {
              const pct = maxVal > 0 ? (row[metric] / maxVal) * 100 : 0;
              return (
                <TableRow key={i} className={`border-border/30 hover:bg-secondary/30 ${i === 0 ? (isTop ? "bg-emerald-500/5" : "bg-red-500/5") : ""}`}>
                  <TableCell>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      i === 0
                        ? isTop ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Building2 className={`w-4 h-4 ${i === 0 ? (isTop ? "text-emerald-400" : "text-red-400") : "text-muted-foreground"}`} />
                      <span className="text-sm font-medium text-foreground">{row.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className={`text-sm text-right font-mono ${metric === "acessos" ? (isTop ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold") : "text-muted-foreground"}`}>
                    {row.acessos}
                  </TableCell>
                  <TableCell className={`text-sm text-right font-mono ${metric === "registos" ? (isTop ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold") : "text-muted-foreground"}`}>
                    {row.registos}
                  </TableCell>
                  <TableCell className={`text-sm text-right font-mono ${metric === "colaboradores" ? (isTop ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold") : "text-muted-foreground"}`}>
                    {row.colaboradores}
                  </TableCell>
                  <TableCell>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden w-full">
                      <div
                        className={`h-full rounded-full transition-all ${isTop ? "bg-emerald-500/60" : "bg-red-500/60"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}