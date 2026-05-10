import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

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
  onPreview,
}) {
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

      {/* Preview Button */}
      {onPreview && isValid && (
        <Button
          onClick={onPreview}
          className="w-full h-12 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90"
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
