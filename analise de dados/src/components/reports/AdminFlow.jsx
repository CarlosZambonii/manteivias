/**
 * AdminFlow — Fluxo de exportação para Administração
 *
 * RELATÓRIOS GERADOS:
 *  A) Folha de Ponto (Justificações)         → FolhaPontoPreview / FolhaPontoTemplate
 *  B) Resumo Mensal Pessoal — Obras          → ResumoPessoalObrasPreview / ResumoPessoalObrasTemplate
 *  C) Resumo Mensal Pessoal — Justificações  → ResumoPessoalJustificacoesPreview / ResumoPessoalJustificacoesTemplate
 *
 * FILTROS:
 *  1. Período (mês ou intervalo)
 *  2. Tipo de relatório
 *  3. Subtipo (apenas para Resumo Mensal)
 *
 * DADOS: consumidos via dataProviders.js
 *   → Em produção, editar apenas esse ficheiro para ligar à API real.
 *
 * EXPORT: handleExport() → TODO: ligar a backend function que gera o Excel/PDF
 */

import { useState, useCallback, useEffect } from "react";
import { Calendar, FileSpreadsheet, FileText, Users, Settings, ClipboardCheck } from "lucide-react";
import StepCard from "./StepCard";
import PeriodSelector from "./PeriodSelector";
import ReportTypeCards from "./ReportTypeCards";
import ConfigToggle from "./ConfigToggle";
import ExportSummary, { formatPeriod } from "./ExportSummary";
import FolhaPontoPreview from "./FolhaPontoPreview";
import ResumoPessoalObrasPreview from "./ResumoPessoalObrasPreview";
import ResumoPessoalJustificacoesPreview from "./ResumoPessoalJustificacoesPreview";
import {
  getFolhaPontoJustificacoes,
  getResumoPessoalObras,
  getResumoPessoalJustificacoes,
} from "@/lib/dataProviders";

const ADMIN_REPORT_TYPES = [
  {
    id: "folha_ponto_justificacoes",
    label: "Folha de Ponto (Justificações)",
    description: "Exporta o relatório de ponto com informação de justificações por colaborador.",
    icon: FileText,
  },
  {
    id: "resumo_mensal_pessoal",
    label: "Resumo Mensal Pessoal",
    description: "Exporta o resumo mensal consolidado com dados por colaborador.",
    icon: Users,
  },
];

const RESUMO_SUBTYPES = [
  { id: "pessoal_obras",          label: "Pessoal Obras",          description: "Dados agrupados por obra" },
  { id: "pessoal_justificacoes",  label: "Pessoal Justificações",  description: "Dados com justificações" },
];

const REPORT_LABELS = {
  folha_ponto_justificacoes: "Folha de Ponto (Justificações)",
  resumo_mensal_pessoal:     "Resumo Mensal Pessoal",
};

const SUBTYPE_LABELS = {
  pessoal_obras:          "Pessoal Obras",
  pessoal_justificacoes:  "Pessoal Justificações",
};

export default function AdminFlow({ showEncarregadoReports, onSwitchToEncarregado }) {
  const [period, setPeriod]           = useState(null);
  const [reportType, setReportType]   = useState(null);
  const [subtype, setSubtype]         = useState(null);
  const [exportState, setExportState] = useState("idle");
  const [showPreview, setShowPreview] = useState(false);

  // Dados dinâmicos — carregados quando os filtros estão completos
  const [previewData, setPreviewData] = useState(null);

  const isPeriodValid   = period !== null;
  const isReportTypeValid = reportType !== null;
  const needsSubtype    = reportType === "resumo_mensal_pessoal";
  const isSubtypeValid  = !needsSubtype || subtype !== null;
  const isAllValid      = isPeriodValid && isReportTypeValid && isSubtypeValid;

  const handleReportTypeChange = (type) => {
    setReportType(type);
    if (type !== "resumo_mensal_pessoal") setSubtype(null);
    setPreviewData(null);
  };

  // Carregar dados quando os filtros estão prontos
  useEffect(() => {
    if (!isAllValid) { setPreviewData(null); return; }

    const load = async () => {
      if (reportType === "folha_ponto_justificacoes") {
        const data = await getFolhaPontoJustificacoes(period);
        setPreviewData(data);
      } else if (reportType === "resumo_mensal_pessoal" && subtype === "pessoal_obras") {
        const data = await getResumoPessoalObras(period);
        setPreviewData(data);
      } else if (reportType === "resumo_mensal_pessoal" && subtype === "pessoal_justificacoes") {
        const data = await getResumoPessoalJustificacoes(period);
        setPreviewData(data);
      }
    };

    load();
  }, [period, reportType, subtype, isAllValid]);

  const handleExport = useCallback(async () => {
    setExportState("loading");
    /**
     * TODO: PRODUÇÃO — substituir pela chamada real ao backend:
     *
     * const functionName =
     *   reportType === "folha_ponto_justificacoes" ? "exportFolhaPontoJustificacoes" :
     *   subtype === "pessoal_obras"                ? "exportResumoPessoalObras" :
     *                                               "exportResumoPessoalJustificacoes";
     *
     * const res = await base44.functions.invoke(functionName, {
     *   mes: period.month + 1,
     *   ano: period.year,
     * });
     * window.open(res.data.fileUrl, "_blank");
     */
    await new Promise(r => setTimeout(r, 2000)); // simulação
    setExportState("success");
    setTimeout(() => setExportState("idle"), 3000);
  }, [period, reportType, subtype]);

  const summaryItems = [
    { label: "Período",   value: formatPeriod(period) },
    { label: "Relatório", value: REPORT_LABELS[reportType] || "—" },
    ...(needsSubtype ? [{ label: "Tipo", value: SUBTYPE_LABELS[subtype] || "—" }] : []),
  ];

  return (
    <>
      {/* Preview — Folha de Ponto Justificações */}
      {showPreview && previewData && reportType === "folha_ponto_justificacoes" && (
        <FolhaPontoPreview
          data={previewData}
          showAv={false}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Preview — Resumo Pessoal Obras */}
      {showPreview && previewData && reportType === "resumo_mensal_pessoal" && subtype === "pessoal_obras" && (
        <ResumoPessoalObrasPreview
          data={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Preview — Resumo Pessoal Justificações */}
      {showPreview && previewData && reportType === "resumo_mensal_pessoal" && subtype === "pessoal_justificacoes" && (
        <ResumoPessoalJustificacoesPreview
          data={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div className="space-y-4">
        {/* Passo 1 — Período */}
        <StepCard
          stepNumber={1}
          title="Período"
          description="Selecione o período do relatório"
          icon={Calendar}
          isActive={true}
          isCompleted={isPeriodValid}
        >
          <PeriodSelector value={period} onChange={setPeriod} />
        </StepCard>

        {/* Passo 2 — Tipo de relatório */}
        <StepCard
          stepNumber={2}
          title="Tipo de relatório"
          description="Escolha o relatório que pretende exportar"
          icon={FileSpreadsheet}
          isActive={isPeriodValid}
          isCompleted={isReportTypeValid}
          isDisabled={!isPeriodValid}
        >
          <ReportTypeCards
            options={ADMIN_REPORT_TYPES}
            value={reportType}
            onChange={handleReportTypeChange}
          />
        </StepCard>

        {/* Passo 3 — Subtipo (apenas Resumo Mensal) */}
        {needsSubtype && (
          <StepCard
            stepNumber={3}
            title="Configuração do resumo"
            description="Escolha o tipo de resumo mensal"
            icon={Settings}
            isActive={isReportTypeValid}
            isCompleted={isSubtypeValid}
            isDisabled={!isReportTypeValid}
          >
            <ConfigToggle
              options={RESUMO_SUBTYPES}
              value={subtype}
              onChange={setSubtype}
              hint="Selecione o formato de dados do resumo mensal."
            />
          </StepCard>
        )}

        {/* Passo final — Exportar */}
        <StepCard
          stepNumber={needsSubtype ? 4 : 3}
          title="Confirmar exportação"
          description="Reveja os dados e descarregue o relatório"
          icon={ClipboardCheck}
          isActive={isAllValid}
          isDisabled={!isAllValid}
        >
          <ExportSummary
            items={summaryItems}
            isValid={isAllValid}
            onExport={handleExport}
            exportState={exportState}
            onPreview={isAllValid ? () => setShowPreview(true) : undefined}
          />
        </StepCard>

        {/* Link para relatórios operacionais (admin) */}
        {showEncarregadoReports && onSwitchToEncarregado && (
          <div className="pt-2">
            <button
              onClick={onSwitchToEncarregado}
              className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors py-2"
            >
              Ver relatórios operacionais por obra →
            </button>
          </div>
        )}
      </div>
    </>
  );
}