import React, { useState } from 'react';
import { X, ChevronDown, Paperclip } from 'lucide-react';

const MODULOS = [
  "Registos", "Férias", "Exportação", "Notificações",
  "Perfis & Acessos", "Validações", "Frotas", "Obras", "Outro",
];

const configs = {
  ticket: {
    title: "Criar Ticket",
    color: "blue",
    fields: ["titulo", "modulo", "prioridade", "descricao", "anexo"],
    prioridades: ["Baixa", "Média", "Alta"],
  },
  ajuda: {
    title: "Pedir Ajuda",
    color: "sky",
    fields: ["titulo", "modulo", "descricao", "anexo"],
    prioridades: null,
  },
  erro: {
    title: "Reportar Erro",
    color: "rose",
    fields: ["titulo", "modulo", "prioridade", "descricao", "passos", "anexo"],
    prioridades: ["Baixa", "Média", "Alta"],
  },
  melhoria: {
    title: "Sugerir Melhoria",
    color: "violet",
    fields: ["titulo", "modulo", "descricao", "beneficio", "anexo"],
    prioridades: null,
  },
  atualizacao: {
    title: "Adicionar Atualização",
    color: "emerald",
    fields: ["versao", "titulo", "data", "modulos", "items", "notas"],
    prioridades: null,
  },
  futuro: {
    title: "Adicionar ao Futuro",
    color: "indigo",
    fields: ["titulo", "modulo", "prioridade", "descricao", "horizonte"],
    prioridades: ["Baixa", "Média", "Alta"],
  },
};

const colorMap = {
  blue:    { btn: "bg-blue-600 hover:bg-blue-500",     badge: "bg-blue-600/10 border-blue-500/20 text-blue-300",       ring: "focus:border-blue-500/50" },
  sky:     { btn: "bg-sky-600 hover:bg-sky-500",       badge: "bg-sky-600/10 border-sky-500/20 text-sky-300",         ring: "focus:border-sky-500/50" },
  rose:    { btn: "bg-rose-600 hover:bg-rose-500",     badge: "bg-rose-600/10 border-rose-500/20 text-rose-300",       ring: "focus:border-rose-500/50" },
  violet:  { btn: "bg-violet-600 hover:bg-violet-500", badge: "bg-violet-600/10 border-violet-500/20 text-violet-300", ring: "focus:border-violet-500/50" },
  emerald: { btn: "bg-emerald-600 hover:bg-emerald-500", badge: "bg-emerald-600/10 border-emerald-500/20 text-emerald-300", ring: "focus:border-emerald-500/50" },
  indigo:  { btn: "bg-indigo-600 hover:bg-indigo-500", badge: "bg-indigo-600/10 border-indigo-500/20 text-indigo-300", ring: "focus:border-indigo-500/50" },
};

const SelectField = ({ label, options, placeholder, ring }) => (
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
    <div className="relative">
      <select className={`w-full appearance-none px-3 py-2.5 rounded-lg border border-[#1e2a3a] bg-[#0b1525] text-sm text-slate-200 focus:outline-none ${ring} transition-colors`}>
        <option value="" className="text-slate-500">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    </div>
  </div>
);

const InputField = ({ label, placeholder, ring }) => (
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
    <input
      type="text"
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 rounded-lg border border-[#1e2a3a] bg-[#0b1525] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none ${ring} transition-colors`}
    />
  </div>
);

const TextareaField = ({ label, placeholder, rows = 3, ring }) => (
  <div>
    <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
    <textarea
      rows={rows}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 rounded-lg border border-[#1e2a3a] bg-[#0b1525] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none ${ring} transition-colors resize-none`}
    />
  </div>
);

export default function FormModal({ type, onClose }) {
  if (!type) return null;
  const cfg = configs[type];
  const c = colorMap[cfg.color];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-xl border border-[#1e2a3a] bg-[#0b1120] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b border-[#1e2a3a]`}>
          <div>
            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold border mb-1.5 ${c.badge}`}>
              {cfg.title}
            </span>
            <h2 className="text-lg font-semibold text-white">{cfg.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Título sempre presente */}
          <InputField label="Título *" placeholder="Descreva brevemente o assunto" ring={c.ring} />

          {/* Módulo */}
          {cfg.fields.includes("modulo") && (
            <SelectField label="Módulo *" options={MODULOS} placeholder="Selecione o módulo relacionado" ring={c.ring} />
          )}

          {/* Prioridade */}
          {cfg.fields.includes("prioridade") && (
            <SelectField label="Prioridade *" options={cfg.prioridades} placeholder="Selecione a prioridade" ring={c.ring} />
          )}

          {/* Descrição */}
          {cfg.fields.includes("descricao") && (
            <TextareaField
              label={type === "erro" ? "Descrição do erro *" : type === "melhoria" ? "Descrição da melhoria *" : type === "ajuda" ? "Descrição da dúvida *" : "Descrição *"}
              placeholder={
                type === "erro" ? "O que aconteceu? Quando ocorre?"
                : type === "ajuda" ? "Descreva a sua dúvida ou dificuldade..."
                : type === "melhoria" ? "O que pretende melhorar e como?"
                : "Descreva o problema em detalhe..."
              }
              rows={4}
              ring={c.ring}
            />
          )}

          {/* Passos para reproduzir (só erros) */}
          {cfg.fields.includes("passos") && (
            <TextareaField
              label="Passos para reproduzir"
              placeholder={"1. Aceder a...\n2. Clicar em...\n3. Observar que..."}
              rows={3}
              ring={c.ring}
            />
          )}

          {/* Benefício esperado (só melhorias) */}
          {cfg.fields.includes("beneficio") && (
            <TextareaField
              label="Benefício esperado"
              placeholder="Como esta melhoria beneficiaria os utilizadores?"
              rows={2}
              ring={c.ring}
            />
          )}

          {/* Anexo */}
          {cfg.fields.includes("anexo") && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Anexos (opcional)</label>
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#1e2a3a] hover:border-slate-500 bg-[#0b1525] cursor-pointer transition-colors`}>
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-500">Clique para adicionar ficheiro ou imagem</span>
              </div>
            </div>
          )}

          {/* Campos específicos: Atualização */}
          {type === "atualizacao" && (
            <>
              <InputField label="Versão *" placeholder="Ex: 02.4" ring={c.ring} />
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Mês/Ano *" options={["Janeiro 2026","Fevereiro 2026","Março 2026","Abril 2026","Maio 2026"]} placeholder="Selecione o período" ring={c.ring} />
                <SelectField label="Tipo de atualização *" options={["Correção","Melhoria","Nova funcionalidade","Segurança","Performance"]} placeholder="Selecione" ring={c.ring} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Módulos afetados *</label>
                <div className="flex flex-wrap gap-2">
                  {["Registos","Férias","Exportação","Perfis","Frotas","Obras","Notificações"].map(m => (
                    <label key={m} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1e2a3a] bg-[#0b1525] text-xs text-slate-300 cursor-pointer hover:border-emerald-500/30 transition-colors">
                      <input type="checkbox" className="accent-emerald-500 w-3 h-3" />
                      {m}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Itens da atualização *</label>
                <textarea
                  rows={5}
                  placeholder={"- Ajuste no fecho automático\n- Melhoria no histórico\n- Correção no exportador PDF\n(um item por linha)"}
                  className={`w-full px-3 py-2.5 rounded-lg border border-[#1e2a3a] bg-[#0b1525] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none ${c.ring} transition-colors resize-none font-mono`}
                />
                <p className="text-[11px] text-slate-600 mt-1">Escreva cada item numa linha separada. Use "-" para listar.</p>
              </div>
              <TextareaField label="Notas internas (opcional)" placeholder="Observações relevantes para a equipa..." rows={2} ring={c.ring} />
            </>
          )}

          {/* Campos específicos: Futuro */}
          {type === "futuro" && (
            <>
              <SelectField
                label="Horizonte de implementação *"
                options={["Próximas 2 semanas","Próximo mês","Próximos 3 meses","Próximos 6 meses","Sem prazo definido"]}
                placeholder="Quando está previsto?"
                ring={c.ring}
              />
              <SelectField
                label="Estado de planeamento *"
                options={["Ideia","Em avaliação","Aprovado","Em desenvolvimento"]}
                placeholder="Estado atual"
                ring={c.ring}
              />
              <TextareaField
                label="Dependências (opcional)"
                placeholder="Esta funcionalidade depende de... / Está bloqueada por..."
                rows={2}
                ring={c.ring}
              />
            </>
          )}

          {/* Aviso de anonimato (não mostrar para atualizações) */}
          {type !== "atualizacao" && (
            <div className="rounded-lg border border-[#1e2a3a] bg-[#0f1b2d]/60 px-3 py-2.5 text-xs text-slate-500 flex gap-2">
              <span className="text-slate-600">—</span>
              O seu pedido será registado de forma anónima. Apenas a data, módulo e estado serão visíveis.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1e2a3a] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#1e2a3a] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            Cancelar
          </button>
          <button className={`px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors ${c.btn}`}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}