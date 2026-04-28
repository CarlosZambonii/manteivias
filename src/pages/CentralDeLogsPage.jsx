import React, { useState } from "react";
import { ScrollText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogsData } from "@/hooks/useLogsData";

import LogsSidebar from "@/components/logs/LogsSidebar";
import LogsMobileNav from "@/components/logs/LogsMobileNav";
import LogsFilters from "@/components/logs/LogsFilters";
import VisaoGeral from "@/components/logs/VisaoGeral";
import AcessosSection from "@/components/logs/AcessosSection";
import AcoesSection from "@/components/logs/AcoesSection";
import UtilizacaoSection from "@/components/logs/UtilizacaoSection";
import ColaboradoresSection from "@/components/logs/ColaboradoresSection";
import ObrasSection from "@/components/logs/ObrasSection";
import SubempreiteirosSection from "@/components/logs/SubempreiteirosSection";

const sectionTitles = {
  "visao-geral": "Visão Geral",
  "acessos": "Acessos",
  "acoes": "Ações (Auditoria)",
  "utilizacao": "Utilização",
  "colaboradores": "Colaboradores",
  "obras": "Obras",
  "subempreiteiros": "Subempreiteiros",
};

export default function CentralDeLogsPage() {
  const [activeSection, setActiveSection] = useState("visao-geral");
  const [filters, setFilters] = useState({
    obra_id: 'todas',
    period: 'mes_atual',
    tipo_acao: 'todos',
    perfil: 'todos-perfis',
    search: '',
  });

  const {
    acessosData, acoesData, statsCards,
    utilizacaoData, colaboradoresData, obrasData, subempreiteirosData,
    topCollaborators, topObras, topPages,
    obrasDisponiveis, loading, refresh,
  } = useLogsData(filters);

  const renderSection = () => {
    const search = filters.search || '';
    switch (activeSection) {
      case "visao-geral":
        return <VisaoGeral statsCards={statsCards} topCollaborators={topCollaborators} topObras={topObras} topPages={topPages} loading={loading} />;
      case "acessos":
        return <AcessosSection acessosData={acessosData} loading={loading} search={search} />;
      case "acoes":
        return <AcoesSection acoesData={acoesData} loading={loading} search={search} />;
      case "utilizacao":
        return <UtilizacaoSection utilizacaoData={utilizacaoData} loading={loading} />;
      case "colaboradores":
        return <ColaboradoresSection colaboradoresData={colaboradoresData} loading={loading} search={search} />;
      case "obras":
        return <ObrasSection obrasData={obrasData} loading={loading} />;
      case "subempreiteiros":
        return <SubempreiteirosSection subempreiteirosData={subempreiteirosData} loading={loading} />;
      default:
        return <VisaoGeral statsCards={statsCards} topCollaborators={topCollaborators} topObras={topObras} topPages={topPages} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-primary/[0.01] pointer-events-none" />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          <Button
            variant="outline" size="sm"
            className="gap-2 border-border/60 text-muted-foreground hover:text-foreground hidden sm:flex"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <LogsFilters
          obras={obrasDisponiveis}
          filters={filters}
          onFiltersChange={setFilters}
          loading={loading}
          onRefresh={refresh}
        />

        <LogsMobileNav activeSection={activeSection} onSectionChange={setActiveSection} />

        <div className="flex gap-5">
          <LogsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

          <main className="flex-1 min-w-0">
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
