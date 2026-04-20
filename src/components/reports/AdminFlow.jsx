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
} from "@/lib/reportDataProviders";

const ADMIN_REPORT_TYPES = [
  {
    id: "folha_ponto_justificacoes",
    label: "Folha de Ponto (Justificações)",
    description: "Relatório de ponto com informação de justificações por colaborador.",
    icon: FileText,
  },
  {
    id: "resumo_mensal_pessoal",
    label: "Resumo Mensal Pessoal",
    description: "Resumo mensal consolidado com dados por colaborador.",
    icon: Users,
  },
];

const RESUMO_SUBTYPES = [
  { id: "pessoal_obras",         label: "Pessoal Obras",         description: "Dados agrupados por obra" },
  { id: "pessoal_justificacoes", label: "Pessoal Justificações", description: "Dados com justificações" },
];

const REPORT_LABELS = {
  folha_ponto_justificacoes: "Folha de Ponto (Justificações)",
  resumo_mensal_pessoal:     "Resumo Mensal Pessoal",
};

const SUBTYPE_LABELS = {
  pessoal_obras:         "Pessoal Obras",
  pessoal_justificacoes: "Pessoal Justificações",
};

/**
 * @param {Function} onExport - (reportType, subtype, period) => Promise<void>
 * @param {Function} onSwitchToEncarregado
 * @param {boolean}  showEncarregadoReports
 */
export default function AdminFlow({ onExport, showEncarregadoReports, onSwitchToEncarregado }) {
  const [period, setPeriod]         = useState(null);
  const [reportType, setReportType] = useState(null);
  const [subtype, setSubtype]       = useState(null);
  const [exportState, setExportState] = useState("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  const isPeriodValid    = period !== null;
  const isReportTypeValid = reportType !== null;
  const needsSubtype     = reportType === "resumo_mensal_pessoal";
  const isSubtypeValid   = !needsSubtype || subtype !== null;
  const isAllValid       = isPeriodValid && isReportTypeValid && isSubtypeValid;

  const handleReportTypeChange = (type) => {
    setReportType(type);
    if (type !== "resumo_mensal_pessoal") setSubtype(null);
    setPreviewData(null);
    setPreviewError(null);
  };

  // Load preview data when all filters are complete
  useEffect(() => {
    if (!isAllValid) { setPreviewData(null); setPreviewError(null); return; }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    const load = async () => {
      try {
        let data;
        if (reportType === "folha_ponto_justificacoes") {
          data = await getFolhaPontoJustificacoes(period);
        } else if (subtype === "pessoal_obras") {
          data = await getResumoPessoalObras(period);
        } else if (subtype === "pessoal_justificacoes") {
          data = await getResumoPessoalJustificacoes(period);
        }
        if (!cancelled) setPreviewData(data);
      } catch (err) {
        console.error("[AdminFlow] preview load error:", err);
        if (!cancelled) setPreviewError(err?.message || "Erro ao carregar dados do relatório.");
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [period, reportType, subtype, isAllValid]);

  const handleExport = useCallback(async () => {
    if (!onExport) return;
    setExportState("loading");
    try {
      await onExport(reportType, subtype, period);
      setExportState("success");
      setTimeout(() => setExportState("idle"), 3000);
    } catch {
      setExportState("error");
      setTimeout(() => setExportState("idle"), 3000);
    }
  }, [onExport, period, reportType, subtype]);

  const summaryItems = [
    { label: "Período",   value: formatPeriod(period) },
    { label: "Relatório", value: REPORT_LABELS[reportType] || "—" },
    ...(needsSubtype ? [{ label: "Tipo", value: SUBTYPE_LABELS[subtype] || "—" }] : []),
  ];

  return (
    <>
      {showPreview && previewData && reportType === "folha_ponto_justificacoes" && (
        <FolhaPontoPreview data={previewData} showAv={false} onClose={() => setShowPreview(false)} />
      )}
      {showPreview && previewData && reportType === "resumo_mensal_pessoal" && subtype === "pessoal_obras" && (
        <ResumoPessoalObrasPreview data={previewData} onClose={() => setShowPreview(false)} />
      )}
      {showPreview && previewData && reportType === "resumo_mensal_pessoal" && subtype === "pessoal_justificacoes" && (
        <ResumoPessoalJustificacoesPreview data={previewData} onClose={() => setShowPreview(false)} />
      )}

      <div className="space-y-4">
        <StepCard stepNumber={1} title="Período" description="Selecione o período do relatório"
          icon={Calendar} isActive={true} isCompleted={isPeriodValid}>
          <PeriodSelector value={period} onChange={setPeriod} />
        </StepCard>

        <StepCard stepNumber={2} title="Tipo de relatório" description="Escolha o relatório que pretende exportar"
          icon={FileSpreadsheet} isActive={isPeriodValid} isCompleted={isReportTypeValid} isDisabled={!isPeriodValid}>
          <ReportTypeCards options={ADMIN_REPORT_TYPES} value={reportType} onChange={handleReportTypeChange} />
        </StepCard>

        {needsSubtype && (
          <StepCard stepNumber={3} title="Configuração do resumo" description="Escolha o tipo de resumo mensal"
            icon={Settings} isActive={isReportTypeValid} isCompleted={isSubtypeValid} isDisabled={!isReportTypeValid}>
            <ConfigToggle
              options={RESUMO_SUBTYPES}
              value={subtype}
              onChange={setSubtype}
              hint="Selecione o formato de dados do resumo mensal."
            />
          </StepCard>
        )}

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
            onPreview={isAllValid && previewData && !previewLoading ? () => setShowPreview(true) : undefined}
          />
          {isAllValid && previewLoading && (
            <p className="text-xs text-muted-foreground mt-2 text-center">A carregar pré-visualização…</p>
          )}
          {isAllValid && !previewLoading && previewError && (
            <p className="text-xs text-destructive mt-2 text-center">⚠ {previewError}</p>
          )}
          {isAllValid && !previewLoading && !previewError && previewData && (
            (() => {
              const count = previewData.colaboradores?.length ?? 0;
              return count === 0 ? (
                <p className="text-xs text-amber-600 mt-2 text-center">Nenhum colaborador encontrado para o período selecionado.</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2 text-center">{count} colaborador{count !== 1 ? "es" : ""} encontrado{count !== 1 ? "s" : ""}.</p>
              );
            })()
          )}
        </StepCard>

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
