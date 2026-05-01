import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Search } from "lucide-react";

export default function LogsFilters({ obras = [], filters, onFiltersChange, loading, onRefresh }) {
  const set = (key, value) => onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="bg-card rounded-xl border border-border/60 p-4 mb-5">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filters.obra_id || 'todas'} onValueChange={(v) => set('obra_id', v)}>
          <SelectTrigger className="w-full sm:w-44 bg-secondary border-border/60 text-sm h-9">
            <SelectValue placeholder="Obra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Obras</SelectItem>
            {obras.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.period || 'mes_atual'} onValueChange={(v) => set('period', v)}>
          <SelectTrigger className="w-full sm:w-44 bg-secondary border-border/60 text-sm h-9">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes_atual">Mês atual</SelectItem>
            <SelectItem value="mes_anterior">Mês anterior</SelectItem>
            <SelectItem value="2_meses">Últimos 2 meses</SelectItem>
            <SelectItem value="3_meses">Últimos 3 meses</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.tipo_acao || 'todos'} onValueChange={(v) => set('tipo_acao', v)}>
          <SelectTrigger className="w-full sm:w-40 bg-secondary border-border/60 text-sm h-9">
            <SelectValue placeholder="Tipo de ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="criacao">Criação</SelectItem>
            <SelectItem value="edicao">Edição</SelectItem>
            <SelectItem value="exclusao">Exclusão</SelectItem>
            <SelectItem value="correcao">Correção</SelectItem>
            <SelectItem value="visualizacao">Visualização</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.perfil || 'todos-perfis'} onValueChange={(v) => set('perfil', v)}>
          <SelectTrigger className="w-full sm:w-40 bg-secondary border-border/60 text-sm h-9">
            <SelectValue placeholder="Perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos-perfis">Todos os perfis</SelectItem>
            <SelectItem value="Admin Star">Admin Star</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
            <SelectItem value="Encarregado">Encarregado</SelectItem>
            <SelectItem value="Colaborador">Colaborador</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar utilizador..."
            value={filters.search || ''}
            onChange={(e) => set('search', e.target.value)}
            className="pl-9 bg-secondary border-border/60 text-sm h-9"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline" size="sm"
            className="h-9 gap-2 border-border/60 text-muted-foreground hover:text-foreground"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
}
