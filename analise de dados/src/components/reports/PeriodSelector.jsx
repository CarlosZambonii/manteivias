import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function PeriodSelector({ value, onChange }) {
  const [mode, setMode] = useState(value?.mode || "month");

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(value?.month ?? now.getMonth());
  const [selectedYear, setSelectedYear] = useState(value?.year ?? now.getFullYear());
  const [startDate, setStartDate] = useState(value?.startDate || "");
  const [endDate, setEndDate] = useState(value?.endDate || "");

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === "month") {
      onChange({ mode: "month", month: selectedMonth, year: selectedYear });
    } else {
      if (startDate && endDate) {
        onChange({ mode: "range", startDate, endDate });
      } else {
        onChange(null);
      }
    }
  };

  const handleMonthNav = (delta) => {
    let m = selectedMonth + delta;
    let y = selectedYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setSelectedMonth(m);
    setSelectedYear(y);
    onChange({ mode: "month", month: m, year: y });
  };

  const handleRangeChange = (field, val) => {
    const newStart = field === "start" ? val : startDate;
    const newEnd = field === "end" ? val : endDate;
    if (field === "start") setStartDate(val);
    else setEndDate(val);
    if (newStart && newEnd) {
      onChange({ mode: "range", startDate: newStart, endDate: newEnd });
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => handleModeChange("month")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
            mode === "month"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          Por mês
        </button>
        <button
          onClick={() => handleModeChange("range")}
          className={cn(
            "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all",
            mode === "range"
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          Por período
        </button>
      </div>

      {/* Month Selector */}
      {mode === "month" && (
        <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
          <Button variant="ghost" size="icon" onClick={() => handleMonthNav(-1)} className="h-9 w-9">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {MONTHS_PT[selectedMonth]}
            </p>
            <p className="text-xs text-muted-foreground">{selectedYear}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => handleMonthNav(1)} className="h-9 w-9">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Range Selector */}
      {mode === "range" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Data inicial</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => handleRangeChange("start", e.target.value)}
              className="bg-secondary/50"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Data final</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => handleRangeChange("end", e.target.value)}
              className="bg-secondary/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}