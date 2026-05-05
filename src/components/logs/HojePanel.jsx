import React from "react";
import { Users, FileText, Wrench, Activity, Building2, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const tipoToCategoria = (tipo) => {
  const map = {
    encarregado: 'Encarregados',
    admin_sub: 'Subempreiteiros',
    rh: 'Pessoal Escritório',
    admin: 'Pessoal Escritório',
    admin_star: 'Pessoal Escritório',
    admin_c: 'Pessoal Escritório',
  };
  return map[tipo?.toLowerCase()] || 'Funcionários';
};

function LiveCard({ label, value, icon: Icon, pulse, accent, loading }) {
  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/60 p-4 flex items-start gap-3">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-10 mb-1.5" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }
  return (
    <div className={`bg-card rounded-xl border p-4 flex items-start gap-3 transition-colors ${
      pulse ? "border-emerald-500/40 bg-emerald-500/[0.02]" : "border-border/60"
    }`}>
      <div className={`p-2 rounded-lg relative shrink-0 ${accent || "bg-primary/10"}`}>
        <Icon className={`w-4 h-4 ${pulse ? "text-emerald-500" : "text-primary"}`} />
        {pulse && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-card" />
        )}
      </div>
      <div>
        <p className={`text-xl font-bold ${pulse ? "text-emerald-400" : "text-foreground"}`}>
          {typeof value === "number" ? value.toLocaleString("pt-PT") : value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function UserRow({ user, loading }) {
  if (loading) {
    return (
      <div className="px-5 py-3 flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-3.5 w-36 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-10" />)}
        </div>
      </div>
    );
  }
  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
      <div className="relative shrink-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          user.online ? "bg-emerald-500/15" : "bg-primary/10"
        }`}>
          <Users className={`w-3.5 h-3.5 ${user.online ? "text-emerald-500" : "text-primary"}`} />
        </div>
        {user.online && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{user.nome}</p>
          {user.online && (
            <Badge variant="outline" className="text-[10px] font-normal bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
              Online
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{user.categoria}</p>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right">
        <div>
          <p className="text-sm font-semibold text-foreground">{user.acoes + user.acessos}</p>
          <p className="text-[10px] text-muted-foreground">Ações</p>
        </div>
        <div>
          <p className={`text-sm font-semibold ${user.criações > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
            {user.criações}
          </p>
          <p className="text-[10px] text-muted-foreground">Criações</p>
        </div>
        <div className="hidden sm:block">
          <p className={`text-sm font-semibold ${user.edicoes > 0 ? "text-blue-400" : "text-muted-foreground"}`}>
            {user.edicoes}
          </p>
          <p className="text-[10px] text-muted-foreground">Edições</p>
        </div>
        <div className="hidden sm:block">
          <p className={`text-sm font-semibold ${user.correcoes > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
            {user.correcoes}
          </p>
          <p className="text-[10px] text-muted-foreground">Correções</p>
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-muted-foreground">{user.obras}</p>
          <p className="text-[10px] text-muted-foreground">Obras</p>
        </div>
      </div>
    </div>
  );
}

export default function HojePanel({ todayStats, loading }) {
  const {
    onlineAgoraCount = 0,
    usuariosAtivosHojeCount = 0,
    registosCriadosHoje = 0,
    correcoesHoje = 0,
    acoesTotaisHoje = 0,
    obrasAtivasHojeCount = 0,
    utilizadoresAtivosHoje = [],
    obrasAtivasHoje = [],
  } = todayStats || {};

  const hoje = new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <p className="text-xs text-muted-foreground capitalize">{hoje}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <LiveCard label="Online agora" value={onlineAgoraCount} icon={Wifi} pulse loading={loading} />
        <LiveCard label="Utilizadores ativos hoje" value={usuariosAtivosHojeCount} icon={Users} loading={loading} />
        <LiveCard label="Registos criados hoje" value={registosCriadosHoje} icon={FileText} loading={loading} />
        <LiveCard label="Correções hoje" value={correcoesHoje} icon={Wrench} loading={loading} />
        <LiveCard label="Ações totais hoje" value={acoesTotaisHoje} icon={Activity} loading={loading} />
        <LiveCard label="Obras ativas hoje" value={obrasAtivasHojeCount} icon={Building2} loading={loading} />
      </div>

      <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border/60 flex items-center gap-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Utilizadores Ativos Hoje</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Quem utilizou o sistema hoje e o que fez</p>
          </div>
          {!loading && (
            <span className="ml-auto text-xs text-muted-foreground">{utilizadoresAtivosHoje.length} utilizadores</span>
          )}
        </div>

        <div className="divide-y divide-border/40">
          {loading ? (
            [...Array(6)].map((_, i) => <UserRow key={i} loading />)
          ) : utilizadoresAtivosHoje.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Sem atividade registada hoje.
            </div>
          ) : (
            utilizadoresAtivosHoje.map((u, i) => <UserRow key={i} user={u} />)
          )}
        </div>
      </div>

      {(loading || obrasAtivasHoje.length > 0) && (
        <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/60 flex items-center gap-3">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Obras com Atividade Hoje</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Registos e correções por obra no dia de hoje</p>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-5 py-3 flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <Skeleton className="h-3.5 flex-1" />
                  <div className="flex gap-4">
                    {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-8 w-12" />)}
                  </div>
                </div>
              ))
            ) : obrasAtivasHoje.map((o, i) => {
              const maxAcoes = Math.max(...obrasAtivasHoje.map(x => x.acoes), 1);
              const pct = (o.acoes / maxAcoes) * 100;
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{o.nome}</p>
                    <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden max-w-[100px]">
                      <div className="h-full rounded-full bg-primary/50 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-right">
                    <div>
                      <p className="text-sm font-semibold text-emerald-400">{o.registos}</p>
                      <p className="text-[10px] text-muted-foreground">Registos</p>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${o.correcoes > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                        {o.correcoes}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Correções</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-muted-foreground">{o.colaboradores}</p>
                      <p className="text-[10px] text-muted-foreground">Colaboradores</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
