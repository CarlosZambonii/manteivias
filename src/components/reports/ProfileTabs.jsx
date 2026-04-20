import { cn } from "@/lib/utils";
import { ShieldCheck, HardHat } from "lucide-react";

export default function ProfileTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: "admin",       label: "Administração", icon: ShieldCheck },
    { id: "encarregado", label: "Operacional",   icon: HardHat },
  ];

  return (
    <div className="flex gap-2 bg-secondary/50 p-1 rounded-xl">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
              isActive
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
