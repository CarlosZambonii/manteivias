import React from "react";
import { 
  LayoutDashboard, LogIn, MousePointerClick, BarChart3, 
  Users, Building2, HardHat 
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  { id: "acessos", label: "Acessos", icon: LogIn },
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
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive && "text-primary")} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}