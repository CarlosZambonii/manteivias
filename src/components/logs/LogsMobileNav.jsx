import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutDashboard, LogIn, MousePointerClick, BarChart3, Users, Building2, HardHat, Radio } from "lucide-react";

const menuItems = [
  { id: "hoje", label: "Hoje — Tempo Real", icon: Radio },
  { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
  { id: "acessos", label: "Resumo Executivo", icon: LogIn },
  { id: "acoes", label: "Ações", icon: MousePointerClick },
  { id: "utilizacao", label: "Utilização", icon: BarChart3 },
  { id: "colaboradores", label: "Colaboradores", icon: Users },
  { id: "obras", label: "Obras", icon: Building2 },
  { id: "subempreiteiros", label: "Subempreiteiros", icon: HardHat },
];

export default function LogsMobileNav({ activeSection, onSectionChange }) {
  return (
    <div className="lg:hidden mb-4">
      <Select value={activeSection} onValueChange={onSectionChange}>
        <SelectTrigger className="bg-card border-border/60 text-sm h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
