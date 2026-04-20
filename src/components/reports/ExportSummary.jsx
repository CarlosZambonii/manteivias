import { cn } from "@/lib/utils";
import { Download, Loader2, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function formatPeriod(period) {
  if (!period) return "—";
  if (period.mode === "month") {
    return `${MONTHS_PT[period.month]} ${period.year}`;
  }
  const fmt = (d) => {
    const [y, m, dd] = d.split("-");
    return `${dd}/${m}/${y}`;
  };
  return `${fmt(period.startDate)} a ${fmt(period.endDate)}`;
}

export default function ExportSummary({
  items,
  isValid,
  onExport,
  exportState,
  onPreview,
}) {
  const isLoading = exportState === "loading";
  const isSuccess = exportState === "success";
  const isError   = exportState === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Summary Items */}
      <div className="bg-secondary/50 rounded-xl p-4 space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between items-start gap-4">
            <span className="text-xs text-muted-foreground shrink-0">{item.label}</span>
            <span className="text-xs font-medium text-foreground text-right">{item.value || "—"}</span>
          </div>
        ))}
      </div>

      {/* Export Button */}
      <Button
        onClick={onExport}
        disabled={!isValid || isLoading}
        className={cn(
          "w-full h-12 text-sm font-semibold rounded-xl transition-all",
          isSuccess && "bg-green-600 hover:bg-green-600/90",
          isError   && "bg-destructive hover:bg-destructive/90",
          !isSuccess && !isError && "bg-primary hover:bg-primary/90"
        )}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              A gerar relatório...
            </motion.span>
          ) : isSuccess ? (
            <motion.span key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Relatório descarregado
            </motion.span>
          ) : isError ? (
            <motion.span key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Erro ao gerar — tentar novamente
            </motion.span>
          ) : (
            <motion.span key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Gerar e descarregar relatório
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Preview Button */}
      {onPreview && isValid && (
        <Button
          onClick={onPreview}
          variant="outline"
          className="w-full h-10 text-sm rounded-xl"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver preview da folha
        </Button>
      )}

      {!isValid && (
        <p className="text-xs text-center text-muted-foreground">
          Preencha os campos obrigatórios para continuar
        </p>
      )}
    </motion.div>
  );
}

export { formatPeriod };
