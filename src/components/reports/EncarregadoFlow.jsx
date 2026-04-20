import { useState, useCallback, useEffect } from "react";
import { Calendar, Building2, Settings, ClipboardCheck } from "lucide-react";
import StepCard from "./StepCard";
import PeriodSelector from "./PeriodSelector";
import ObraSelector from "./ObraSelector";
import ConfigToggle from "./ConfigToggle";
import ExportSummary, { formatPeriod } from "./ExportSummary";
import FolhaFiscalPreview from "./FolhaFiscalPreview";
import { getFolhaFiscal } from "@/lib/reportDataProviders";

const AV_OPTIONS = [
  { id: "sem_av", label: "Sem AV", description: "Relatório padrão" },
  { id: "com_av", label: "Com AV", description: "Inclui coluna AV" },
];

/**
 * @param {Array}    obras     - [{ id: "146", name: "..." }]
 * @param {Function} onExport  - (period, obraId, avConfig) => Promise<void>
 */
export default function EncarregadoFlow({ obras = [], onExport }) {
  const [period, setPeriod]       = useState(null);
  const [obraId, setObraId]       = useState(null);
  const [avConfig, setAvConfig]   = useState(null);
  const [exportState, setExportState] = useState("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const isPeriodValid = period !== null;
  const isObraValid   = obraId  !== null;
  const isConfigValid = avConfig !== null;
  const isAllValid    = isPeriodValid && isObraValid && isConfigValid;

  const selectedObra = obras.find(o => String(o.id) === String(obraId));
  const obraLabel    = selectedObra ? `${selectedObra.id} – ${selectedObra.name}` : "—";

  // Load preview data when all filters are complete
  useEffect(() => {
    if (!isAllValid) { setPreviewData(null); return; }

    let cancelled = false;
    setPreviewLoading(true);

    getFolhaFiscal(period, obraId, avConfig === "com_av")
      .then(data => {
        if (!cancelled) setPreviewData({ ...data, obra: obraLabel });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPreviewLoading(false); });

    return () => { cancelled = true; };
  }, [period, obraId, avConfig, isAllValid, obraLabel]);

  const handleExport = useCallback(async () => {
    if (!onExport) return;
    setExportState("loading");
    try {
      await onExport(period, obraId, avConfig);
      setExportState("success");
      setTimeout(() => setExportState("idle"), 3000);
    } catch {
      setExportState("error");
      setTimeout(() => setExportState("idle"), 3000);
    }
  }, [onExport, period, obraId, avConfig]);

  const summaryItems = [
    { label: "Período",      value: formatPeriod(period) },
    { label: "Obra",         value: obraLabel },
    { label: "Relatório",    value: "Folha Fiscal" },
    { label: "Configuração", value: avConfig === "com_av" ? "Com AV" : avConfig === "sem_av" ? "Sem AV" : "—" },
  ];

  return (
    <>
      {showPreview && previewData && (
        <FolhaFiscalPreview
          data={previewData}
          showAv={avConfig === "com_av"}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div className="space-y-4">
        <StepCard stepNumber={1} title="Período" description="Selecione o período do relatório"
          icon={Calendar} isActive={true} isCompleted={isPeriodValid}>
          <PeriodSelector value={period} onChange={setPeriod} />
        </StepCard>

        <StepCard stepNumber={2} title="Obra" description="Escolha a obra para exportar"
          icon={Building2} isActive={isPeriodValid} isCompleted={isObraValid} isDisabled={!isPeriodValid}>
          <ObraSelector value={obraId} onChange={setObraId} obras={obras} />
        </StepCard>

        <StepCard stepNumber={3} title="Configuração" description="Escolha como pretende apresentar o relatório"
          icon={Settings} isActive={isPeriodValid && isObraValid} isCompleted={isConfigValid} isDisabled={!isObraValid}>
          <ConfigToggle
            options={AV_OPTIONS}
            value={avConfig}
            onChange={setAvConfig}
            hint="Escolha como deseja apresentar o relatório final."
          />
        </StepCard>

        <StepCard stepNumber={4} title="Confirmar exportação" description="Reveja os dados e descarregue o relatório"
          icon={ClipboardCheck} isActive={isAllValid} isDisabled={!isAllValid}>
          <ExportSummary
            items={summaryItems}
            isValid={isAllValid}
            onExport={handleExport}
            exportState={exportState}
            onPreview={isAllValid && previewData && !previewLoading ? () => setShowPreview(true) : undefined}
          />
        </StepCard>
      </div>
    </>
  );
}
