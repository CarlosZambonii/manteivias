import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone, Monitor } from "lucide-react";
import CategoriaFilter from "./CategoriaFilter";

export default function AcessosSection({ acessosData = [], loading, search = '' }) {
  const [categoria, setCategoria] = useState("Todas as Categorias");

  const items = acessosData
    .filter(r => categoria === "Todas as Categorias" || r.categoria === categoria)
    .filter(r => !search || r.utilizador.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Registo de Acessos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Histórico de sessões e login dos utilizadores</p>
        </div>
        <CategoriaFilter value={categoria} onChange={setCategoria} />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-muted-foreground">Data/Hora</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Utilizador</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Categoria</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Perfil</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Dispositivo</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground">Sessão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Sem registos para este filtro.
                </TableCell>
              </TableRow>
            ) : items.map((row, i) => (
              <TableRow key={i} className="border-border/30 hover:bg-secondary/30">
                <TableCell className="text-sm text-muted-foreground font-mono">{row.data}</TableCell>
                <TableCell className="text-sm font-medium text-foreground">{row.utilizador}</TableCell>
                <TableCell>
                  <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">{row.categoria}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground font-normal">
                    {row.perfil}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {row.dispositivo === "Mobile" ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                    {row.dispositivo}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`text-xs font-normal ${
                      row.sessao === "Sessão ativa"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-secondary text-muted-foreground border-border/50"
                    }`}
                    variant="outline"
                  >
                    {row.sessao}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
