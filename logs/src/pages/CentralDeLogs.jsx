import React, { useState } from "react";
import { ScrollText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import LogsSidebar from "@/components/central-logs/LogsSidebar";
import LogsMobileNav from "@/components/central-logs/LogsMobileNav";
import LogsFilters from "@/components/central-logs/LogsFilters";
import VisaoGeral from "@/components/central-logs/VisaoGeral";
import AcessosSection from "@/components/central-logs/AcessosSection";
import AcoesSection from "@/components/central-logs/AcoesSection";
import UtilizacaoSection from "@/components/central-logs/UtilizacaoSection";
import ColaboradoresSection from "@/components/central-logs/ColaboradoresSection";
import ObrasSection from "@/components/central-logs/ObrasSection";
import SubempreiteirosSection from "@/components/central-logs/SubempreiteirosSection";

const sectionTitles = {
  "visao-geral": "Visão Geral",
  "acessos": "Acessos",
  "acoes": "Ações (Auditoria)",
  "utilizacao": "Utilização",
  "colaboradores": "Colaboradores",
  "obras": "Obras",
  "subempreiteiros": "Subempreiteiros",
};

export default function CentralDeLogs() {
  const [activeSection, setActiveSection] = useState("visao-geral");

  const renderSection = () => {
    switch (activeSection) {
      case "visao-geral": return <VisaoGeral />;
      case "acessos": return <AcessosSection />;
      case "acoes": return <AcoesSection />;
      case "utilizacao": return <UtilizacaoSection />;
      case "colaboradores": return <ColaboradoresSection />;
      case "obras": return <ObrasSection />;
      case "subempreiteiros": return <SubempreiteirosSection />;
      default: return <VisaoGeral />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.01] pointer-events-none" />
      
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <ScrollText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Central de Logs</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Monitorização de acessos, ações e utilização da aplicação.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 border-border/60 text-muted-foreground hover:text-foreground hidden sm:flex">
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </Button>
        </div>

        {/* Filters */}
        <LogsFilters />

        {/* Mobile nav */}
        <LogsMobileNav activeSection={activeSection} onSectionChange={setActiveSection} />

        {/* Main content with sidebar */}
        <div className="flex gap-5">
          <LogsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          
          <main className="flex-1 min-w-0">
            {/* Section title */}
            <div className="mb-4 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-primary" />
              <h2 className="text-base font-semibold text-foreground">{sectionTitles[activeSection]}</h2>
            </div>
            
            {renderSection()}
          </main>
        </div>
      </div>
    </div>
  );
}