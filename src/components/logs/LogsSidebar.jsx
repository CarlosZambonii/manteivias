import React from "react";
import { LayoutDashboard, LogIn, MousePointerClick, BarChart3, Users, Building2, HardHat, Radio, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { id: "hoje", label: "Hoje — Tempo Real", icon: Radio, live: true },
  { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  { id: "acessos", label: "Visão Executiva", icon: LogIn },
  { id: "acoes", label: "Ações", icon: MousePointerClick },
  { id: "utilizacao", label: "Utilização", icon: BarChart3 },
  { id: "colaboradores", label: "Colaboradores", icon: Users },
  { id: "obras", label: "Obras", icon: Building2 },
  { id: "subempreiteiros", label: "Subempreiteiros", icon: HardHat },
];

export default function LogsSidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="w-56 shrink-0 hidden lg:block">
      <div className="bg-card rounded-xl border border-border/60 p-2 sticky top-6">
        <nav className="space-y-0.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? item.live
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                      : "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <div className="relative shrink-0">
                  <Icon className={cn("w-4 h-4", isActive && (item.live ? "text-emerald-500" : "text-primary"))} />
                  {item.live && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-3 pt-3 border-t border-border/60">
          <button
            disabled
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
          >
            <FileText className="w-4 h-4 shrink-0" />
            Relatório Mymanteivias
          </button>
        </div>
      </div>
    </aside>
  );
}
