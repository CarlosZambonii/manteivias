import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Search } from "lucide-react";

export default function LogsFilters() {
  return (
    <div className="bg-card rounded-xl border border-border/60 p-4 mb-5">
      <div className="flex flex-wrap items-center gap-3">
        <Select defaultValue="todas">
          <SelectTrigger className="w-44 bg-secondary border-border/60 text-sm h-9">
            <SelectValue placeholder="Obra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as Obras</SelectItem>
            <SelectItem value="lote7">Obra Lote 7 - Maia</SelectItem>
            <SelectItem value="boavista">Residencial Boavista</SelectItem>
            <SelectItem value="central">Edifício Central Park</SelectItem>
            <SelectItem value="estrela">Condomínio Estrela</SelectItem>
            <SelectItem value="atlantico">Torre Atlântico</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="abril">
          <SelectTrigger className="w-40 bg-secondary border-border/60 text-sm h-9">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="abril">Abril 2026</SelectItem>
            <SelectItem value="marco">Março 2026</SelectItem>
            <SelectItem value="fevereiro">Fevereiro 2026</SelectItem>
            <SelectItem value="janeiro">Janeiro 2026</SelectItem>
          </SelectContent>
        </Select>

        <Select defaultValue="todos">
          <SelectTrigger className="w-40 bg-secondary border-border/60 text-sm h-9">
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

        <Select defaultValue="todos-perfis">
          <SelectTrigger className="w-40 bg-secondary border-border/60 text-sm h-9">
            <SelectValue placeholder="Perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos-perfis">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="encarregado">Encarregado</SelectItem>
            <SelectItem value="colaborador">Colaborador</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Pesquisar..."
            className="pl-9 bg-secondary border-border/60 text-sm h-9"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" className="h-9 gap-2 border-border/60 text-muted-foreground hover:text-foreground">
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-2 border-border/60 text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </Button>
        </div>
      </div>
    </div>
  );
}