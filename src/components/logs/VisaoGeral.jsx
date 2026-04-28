import React, { useState } from "react";
import { Users, LogIn, FilePlus, Wrench, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import RankingFilter from "./RankingFilter";

const iconMap = { Users, LogIn, FilePlus, Wrench, Activity };

function StatCard({ label, value, icon, loading }) {
  const Icon = iconMap[icon];
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/60 p-5 flex items-start gap-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-7 w-16 mb-1" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-card rounded-xl border border-border/60 p-5 flex items-start gap-4 hover:border-primary/30 transition-colors">
      <div className="p-2.5 rounded-lg bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value.toLocaleString("pt-PT")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function RankedListBlock({ title, allItems, columns, metricOptions, loading }) {
  const [mode, setMode] = useState("top");
  const [metric, setMetric] = useState(metricOptions[0].value);
  const [limit, setLimit] = useState(5);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/60">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="divide-y divide-border/40">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sorted = [...allItems].sort((a, b) =>
    mode === "top" ? b[metric] - a[metric] : a[metric] - b[metric]
  );
  const items = limit === 999 ? sorted : sorted.slice(0, limit);
  const isTop = mode === "top";

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <RankingFilter
          mode={mode} onModeChange={setMode}
          metric={metric} onMetricChange={setMetric}
          metricOptions={metricOptions}
          limit={limit} onLimitChange={setLimit}
        />
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">Sem dados no período.</div>
      ) : (
        <div className="divide-y divide-border/40">
          {items.map((item, i) => {
            const val = item[metric];
            const maxVal = Math.max(...allItems.map(x => x[metric]));
            const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
            return (
              <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`text-xs font-bold w-5 shrink-0 ${isTop ? "text-emerald-400" : "text-red-400"}`}>
                    {i + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item[columns[0].key]}</p>
                    <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden w-full max-w-[120px]">
                      <div
                        className={`h-full rounded-full transition-all ${isTop ? "bg-emerald-500/60" : "bg-red-500/60"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-3">
                  {metricOptions.map((opt) => (
                    <div key={opt.value} className="text-right">
                      <p className={`text-sm font-semibold ${opt.value === metric ? (isTop ? "text-emerald-400" : "text-red-400") : "text-foreground"}`}>
                        {item[opt.value]}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{opt.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function VisaoGeral({ statsCards, topCollaborators, topObras, topPages, loading }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statsCards.map((card, i) => (
          <StatCard key={i} {...card} loading={loading} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RankedListBlock
          title="Colaboradores"
          allItems={topCollaborators}
          columns={[{ key: "name" }]}
          metricOptions={[
            { value: "acessos", label: "Acessos" },
            { value: "acoes", label: "Ações" },
          ]}
          loading={loading}
        />
        <RankedListBlock
          title="Obras"
          allItems={topObras}
          columns={[{ key: "name" }]}
          metricOptions={[
            { value: "acessos", label: "Acessos" },
            { value: "registos", label: "Registos" },
          ]}
          loading={loading}
        />
        <RankedListBlock
          title="Páginas"
          allItems={topPages}
          columns={[{ key: "page" }]}
          metricOptions={[{ value: "visitas", label: "Visitas" }]}
          loading={loading}
        />
      </div>
    </div>
  );
}
