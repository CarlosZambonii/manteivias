import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search, Building2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

// Mock data — replace with real obra list from backend
const MOCK_OBRAS = [
  { id: "124", name: "Modular – Habitação T2 – José Carlos Pais Monteiro" },
  { id: "125", name: "Reabilitação – Escola EB1 – Câmara Municipal" },
  { id: "130", name: "Ampliação – Armazém Industrial – LogiTrans SA" },
  { id: "132", name: "Construção – Moradia V4 – António Ferreira" },
  { id: "138", name: "Renovação – Sede Corporativa – TechNova Lda" },
];

export default function ObraSelector({ value, onChange, obras }) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const obraList = obras || MOCK_OBRAS;

  const filtered = useMemo(() => {
    if (!search) return obraList;
    const q = search.toLowerCase();
    return obraList.filter(o => 
      o.id.toLowerCase().includes(q) || o.name.toLowerCase().includes(q)
    );
  }, [search, obraList]);

  const selectedObra = obraList.find(o => o.id === value);

  const handleSelect = (obra) => {
    onChange(obra.id);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange(null);
    setSearch("");
  };

  if (selectedObra && !isOpen) {
    return (
      <div className="flex items-center gap-3 bg-accent/50 rounded-lg p-3.5 border border-primary/20">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
          <Building2 className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {selectedObra.id} – {selectedObra.name}
          </p>
          <p className="text-xs text-muted-foreground">Obra selecionada</p>
        </div>
        <button
          onClick={handleClear}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors shrink-0"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar obra por número ou nome..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 bg-secondary/50"
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma obra encontrada
              </div>
            ) : (
              filtered.map((obra) => (
                <button
                  key={obra.id}
                  onClick={() => handleSelect(obra)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm transition-colors",
                    "hover:bg-accent/50 border-b border-border/50 last:border-0",
                    value === obra.id && "bg-accent/50"
                  )}
                >
                  <span className="font-medium text-primary">{obra.id}</span>
                  <span className="text-muted-foreground"> – </span>
                  <span className="text-foreground">{obra.name}</span>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}