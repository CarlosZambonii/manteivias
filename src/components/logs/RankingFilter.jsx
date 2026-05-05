import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RankingFilter({ mode, onModeChange, metric, onMetricChange, metricOptions, limit, onLimitChange }) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      <div className="flex items-center rounded-lg border border-border/60 overflow-hidden bg-secondary h-8">
        <button
          onClick={() => onModeChange("top")}
          className={cn(
            "flex items-center gap-1.5 px-3 h-full text-xs font-medium transition-all duration-200",
            mode === "top"
              ? "bg-emerald-500/15 text-emerald-400 border-r border-emerald-500/20"
              : "text-muted-foreground hover:text-foreground border-r border-border/40"
          )}
        >
          <TrendingUp className="w-3 h-3" />
          Top
        </button>
        <button
          onClick={() => onModeChange("bottom")}
          className={cn(
            "flex items-center gap-1.5 px-3 h-full text-xs font-medium transition-all duration-200",
            mode === "bottom"
              ? "bg-red-500/15 text-red-400"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <TrendingDown className="w-3 h-3" />
          Últimos
        </button>
      </div>

      <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
        <SelectTrigger className="w-16 bg-secondary border-border/60 text-xs h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="3">3</SelectItem>
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="999">Todos</SelectItem>
        </SelectContent>
      </Select>

      {metricOptions && metricOptions.length > 1 && (
        <Select value={metric} onValueChange={onMetricChange}>
          <SelectTrigger className="w-36 bg-secondary border-border/60 text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metricOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
