import { FileX } from "lucide-react";

export default function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <FileX className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">
        {message || "Não existem dados para o período selecionado."}
      </p>
    </div>
  );
}