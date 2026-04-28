import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { acoesData } from "@/lib/logsData";
import CategoriaFilter from "./CategoriaFilter";

const acaoBadgeStyles = {
  "Criação": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Edição": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Exclusão": "bg-red-500/10 text-red-400 border-red-500/20",
  "Correção": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Visualização": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function AcoesSection() {
  const [categoria, setCategoria] = useState("Todas as Categorias");

  const items = categoria === "Todas as Categorias"
    ? acoesData
    : acoesData.filter(r => r.categoria === categoria);

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Auditoria de Ações</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Todas as ações realizadas pelos utilizadores no sistema</p>
        </div>
        <CategoriaFilter value={categoria} onChange={setCategoria} />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-muted-foreground">Data</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Utilizador</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Categoria</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Ação</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Entidade</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Módulo</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Sem registos para esta categoria.
                </TableCell>
              </TableRow>
            ) : items.map((row, i) => (
              <TableRow key={i} className="border-border/30 hover:bg-secondary/30">
                <TableCell className="text-sm text-muted-foreground font-mono whitespace-nowrap">{row.data}</TableCell>
                <TableCell className="text-sm font-medium text-foreground whitespace-nowrap">{row.utilizador}</TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary whitespace-nowrap">{row.categoria}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs font-normal ${acaoBadgeStyles[row.acao] || ""}`}>
                    {row.acao}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.entidade}</TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 rounded-md bg-secondary text-muted-foreground">{row.modulo}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">{row.descricao}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}