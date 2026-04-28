import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag } from "lucide-react";

const categorias = [
  "Todas as Categorias",
  "Funcionários",
  "Encarregados",
  "Pessoal Escritório",
  "Subempreiteiros",
  "Geral",
];

export default function CategoriaFilter({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48 bg-secondary border-border/60 text-xs h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categorias.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
