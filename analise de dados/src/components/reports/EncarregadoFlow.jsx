/**
 * EncarregadoFlow — Fluxo de exportação para Encarregado (Operacional)
 *
 * RELATÓRIO GERADO: Folha Fiscal (com ou sem AV)
 *
 * FILTROS:
 *  1. Período (mês ou intervalo)
 *  2. Obra
 *  3. Configuração AV (com / sem)
 *
 * DADOS: consumidos via getFolhaFiscal() de lib/dataProviders.js
 *   → Em produção, editar apenas esse ficheiro para ligar à API real.
 *
 * PREVIEW: FolhaFiscalPreview → FolhaFiscalTemplate
 * EXPORT:  handleExport() → TODO: ligar a backend function que gera o Excel/PDF
 */

import { useState, useCallback, useEffect } from "react";
import { Calendar, Building2, Settings, ClipboardCheck } from "lucide-react";
import StepCard from "./StepCard";
import PeriodSelector from "./PeriodSelector";
import ObraSelector from "./ObraSelector";
import ConfigToggle from "./ConfigToggle";
import ExportSummary, { formatPeriod } from "./ExportSummary";
import FolhaFiscalPreview from "./FolhaFiscalPreview";
import { getFolhaFiscal } from "@/lib/dataProviders";

const AV_OPTIONS = [
  { id: "sem_av", label: "Sem AV", description: "Relatório padrão" },
  { id: "com_av", label: "Com AV", description: "Inclui coluna AV" },
];

export default function EncarregadoFlow({ obras }) {
  const [period, setPeriod]       = useState(null);
  const [obraId, setObraId]       = useState(null);
  const [avConfig, setAvConfig]   = useState(null);
  const [exportState, setExportState] = useState("idle");
  const [showPreview, setShowPreview] = useState(false);

  // Dados dinâmicos do preview — carregados quando todos os filtros estão preenchidos
  const [previewData, setPreviewData] = useState(null);

  const isPeriodValid = period !== null;
  const isObraValid   = obraId !== null;
  const isConfigValid = avConfig !== null;
  const isAllValid    = isPeriodValid && isObraValid && isConfigValid;

  const selectedObra = (obras || []).find(o => o.id === obraId);
  const obraLabel    = selectedObra ? `${selectedObra.id} – ${selectedObra.name}` : "—";

  // Sempre que os filtros mudam e estão completos, busca os dados
  useEffect(() => {
    if (!isAllValid) { setPreviewData(null); return; }

    getFolhaFiscal(period, obraId, avConfig === "com_av").then(data => {
      setPreviewData({
        ...data,
        obra: obraLabel,
      });
    });
  }, [period, obraId, avConfig, isAllValid, obraLabel]);

  const handleExport = useCallback(async () => {
    setExportState("loading");
    /**
     * TODO: PRODUÇÃO — substituir pela chamada real ao backend:
     *
     * const res = await base44.functions.invoke('exportFolhaFiscal', {
     *   mes: period.month + 1,
     *   ano: period.year,
     *   obraId,
     *   showAv: avConfig === "com_av",
     * });
     * // res.data deve conter { fileUrl: "..." }
     * window.open(res.data.fileUrl, "_blank");
     */
    await new Promise(r => setTimeout(r, 2000)); // simulação
    setExportState("success");
    setTimeout(() => setExportState("idle"), 3000);
  }, [period, obraId, avConfig]);

  const summaryItems = [
    { label: "Período",       value: formatPeriod(period) },
    { label: "Obra",          value: obraLabel },
    { label: "Relatório",     value: "Folha Fiscal" },
    { label: "Configuração",  value: avConfig === "com_av" ? "Com AV" : avConfig === "sem_av" ? "Sem AV" : "—" },
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

        {/* Passo 2 — Obra */}
        <StepCard
          stepNumber={2}
          title="Obra"
          description="Escolha a obra para exportar"
          icon={Building2}
          isActive={isPeriodValid}
          isCompleted={isObraValid}
          isDisabled={!isPeriodValid}
        >
          <ObraSelector value={obraId} onChange={setObraId} obras={obras} />
        </StepCard>

        {/* Passo 3 — Configuração AV */}
        <StepCard
          stepNumber={3}
          title="Configuração"
          description="Escolha como pretende apresentar o relatório"
          icon={Settings}
          isActive={isPeriodValid && isObraValid}
          isCompleted={isConfigValid}
          isDisabled={!isObraValid}
        >
          <ConfigToggle
            options={AV_OPTIONS}
            value={avConfig}
            onChange={setAvConfig}
            hint="Escolha como deseja apresentar o relatório final."
          />
        </StepCard>

        {/* Passo 4 — Exportar */}
        <StepCard
          stepNumber={4}
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
      </div>
    </>
  );
}