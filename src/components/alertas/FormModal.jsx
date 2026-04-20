import React, { useState, useEffect } from 'react';
import { X, ChevronDown, Paperclip } from 'lucide-react';

const MODULOS = [
  "Registos", "Férias", "Exportação", "Notificações",
  "Perfis & Acessos", "Validações", "Frotas", "Obras", "Outro",
];

const MESES = [
  "Janeiro 2026", "Fevereiro 2026", "Março 2026", "Abril 2026",
  "Maio 2026", "Junho 2026", "Julho 2026", "Agosto 2026",
];

const configs = {
  ticket:     { title: "Criar Ticket",          color: "blue",    fields: ["modulo", "prioridade", "descricao", "anexo"],        prioridades: ["Baixa", "Média", "Alta"] },
  ajuda:      { title: "Pedir Ajuda",           color: "sky",     fields: ["modulo", "descricao", "anexo"],                      prioridades: null },
  erro:       { title: "Reportar Erro",         color: "rose",    fields: ["modulo", "prioridade", "descricao", "passos", "anexo"], prioridades: ["Baixa", "Média", "Alta"] },
  melhoria:   { title: "Sugerir Melhoria",      color: "violet",  fields: ["modulo", "descricao", "beneficio", "anexo"],         prioridades: null },
  atualizacao:{ title: "Adicionar Atualização", color: "emerald", fields: ["versao", "data", "modulos", "items", "notas"],        prioridades: null },
  futuro:     { title: "Adicionar ao Futuro",   color: "indigo",  fields: ["modulo", "prioridade", "descricao", "horizonte"],    prioridades: ["Baixa", "Média", "Alta"] },
};

const colorMap = {
  blue:    { btn: "bg-blue-600 hover:bg-blue-500",       badge: "bg-blue-600/10 border-blue-500/20 text-blue-300",         ring: "focus:border-blue-500/50" },
  sky:     { btn: "bg-sky-600 hover:bg-sky-500",         badge: "bg-sky-600/10 border-sky-500/20 text-sky-300",           ring: "focus:border-sky-500/50" },
  rose:    { btn: "bg-rose-600 hover:bg-rose-500",       badge: "bg-rose-600/10 border-rose-500/20 text-rose-300",         ring: "focus:border-rose-500/50" },
  violet:  { btn: "bg-violet-600 hover:bg-violet-500",   badge: "bg-violet-600/10 border-violet-500/20 text-violet-300",   ring: "focus:border-violet-500/50" },
  emerald: { btn: "bg-emerald-600 hover:bg-emerald-500", badge: "bg-emerald-600/10 border-emerald-500/20 text-emerald-300", ring: "focus:border-emerald-500/50" },
  indigo:  { btn: "bg-indigo-600 hover:bg-indigo-500",   badge: "bg-indigo-600/10 border-indigo-500/20 text-indigo-300",   ring: "focus:border-indigo-500/50" },
};

const inputCls = (ring) =>
  `w-full px-3 py-2.5 rounded-lg border border-[#1e2a3a] bg-[#0b1525] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none ${ring} transition-colors`;

const selectCls = (ring) =>
  `w-full appearance-none px-3 py-2.5 rounded-lg border border-[#1e2a3a] bg-[#0b1525] text-sm text-slate-200 focus:outline-none ${ring} transition-colors`;

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SelectField({ label, options, placeholder, ring, value, onChange }) {
  return (
    <Field label={label}>
      <div className="relative">
        <select className={selectCls(ring)} value={value || ''} onChange={onChange}>
          <option value="" className="text-slate-500">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>
    </Field>
  );
}

export default function FormModal({ type, onClose, onSubmit }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  useEffect(() => { setForm({}); setError(''); }, [type]);

  if (!type) return null;

  const cfg = configs[type];
  const c = colorMap[cfg.color];

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));
  const toggleModule = (mod) => (e) => {
    setForm(f => {
      const arr = f.modulos || [];
      return { ...f, modulos: e.target.checked ? [...arr, mod] : arr.filter(m => m !== mod) };
    });
  };

  const handleSubmit = () => {
    if (!form.titulo?.trim()) { setError('O título é obrigatório.'); return; }
    onSubmit?.(form);
    onClose();
  };

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2a3a]">
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

          {/* Título */}
          <Field label="Título *">
            <input
              type="text"
              value={form.titulo || ''}
              onChange={set('titulo')}
              placeholder="Descreva brevemente o assunto"
              className={inputCls(c.ring)}
            />
            {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
          </Field>

          {/* Módulo */}
          {cfg.fields.includes("modulo") && (
            <SelectField
              label="Módulo *"
              options={MODULOS}
              placeholder="Selecione o módulo relacionado"
              ring={c.ring}
              value={form.modulo}
              onChange={set('modulo')}
            />
          )}

          {/* Prioridade */}
          {cfg.fields.includes("prioridade") && (
            <SelectField
              label="Prioridade *"
              options={cfg.prioridades}
              placeholder="Selecione a prioridade"
              ring={c.ring}
              value={form.prioridade}
              onChange={set('prioridade')}
            />
          )}

          {/* Descrição */}
          {cfg.fields.includes("descricao") && (
            <Field
              label={
                type === "erro" ? "Descrição do erro *"
                : type === "melhoria" ? "Descrição da melhoria *"
                : type === "ajuda" ? "Descrição da dúvida *"
                : "Descrição *"
              }
            >
              <textarea
                rows={4}
                value={form.descricao || ''}
                onChange={set('descricao')}
                placeholder={
                  type === "erro" ? "O que aconteceu? Quando ocorre?"
                  : type === "ajuda" ? "Descreva a sua dúvida ou dificuldade..."
                  : type === "melhoria" ? "O que pretende melhorar e como?"
                  : "Descreva o problema em detalhe..."
                }
                className={`${inputCls(c.ring)} resize-none`}
              />
            </Field>
          )}

          {/* Passos para reproduzir */}
          {cfg.fields.includes("passos") && (
            <Field label="Passos para reproduzir">
              <textarea
                rows={3}
                value={form.passos || ''}
                onChange={set('passos')}
                placeholder={"1. Aceder a...\n2. Clicar em...\n3. Observar que..."}
                className={`${inputCls(c.ring)} resize-none`}
              />
            </Field>
          )}

          {/* Benefício esperado */}
          {cfg.fields.includes("beneficio") && (
            <Field label="Benefício esperado">
              <textarea
                rows={2}
                value={form.beneficio || ''}
                onChange={set('beneficio')}
                placeholder="Como esta melhoria beneficiaria os utilizadores?"
                className={`${inputCls(c.ring)} resize-none`}
              />
            </Field>
          )}

          {/* Horizonte (futuro) */}
          {cfg.fields.includes("horizonte") && (
            <SelectField
              label="Horizonte de implementação *"
              options={["Próximas 2 semanas","Próximo mês","Próximos 3 meses","Próximos 6 meses","Sem prazo definido"]}
              placeholder="Quando está previsto?"
              ring={c.ring}
              value={form.horizonte}
              onChange={set('horizonte')}
            />
          )}

          {/* Anexo */}
          {cfg.fields.includes("anexo") && (
            <Field label="Anexos (opcional)">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#1e2a3a] hover:border-slate-500 bg-[#0b1525] cursor-pointer transition-colors">
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-500">Clique para adicionar ficheiro ou imagem</span>
              </div>
            </Field>
          )}

          {/* Campos específicos: Atualização */}
          {type === "atualizacao" && (
            <>
              <Field label="Versão *">
                <input
                  type="text"
                  value={form.versao || ''}
                  onChange={set('versao')}
                  placeholder="Ex: 02.4"
                  className={inputCls(c.ring)}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectField
                  label="Mês/Ano *"
                  options={MESES}
                  placeholder="Selecione o período"
                  ring={c.ring}
                  value={form.data}
                  onChange={set('data')}
                />
                <SelectField
                  label="Tipo de atualização *"
                  options={["Correção","Melhoria","Nova funcionalidade","Segurança","Performance"]}
                  placeholder="Selecione"
                  ring={c.ring}
                  value={form.tipoAtualizacao}
                  onChange={set('tipoAtualizacao')}
                />
              </div>

              <Field label="Módulos afetados *">
                <div className="flex flex-wrap gap-2">
                  {["Registos","Férias","Exportação","Perfis","Frotas","Obras","Notificações"].map(m => (
                    <label key={m} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1e2a3a] bg-[#0b1525] text-xs text-slate-300 cursor-pointer hover:border-emerald-500/30 transition-colors">
                      <input
                        type="checkbox"
                        className="accent-emerald-500 w-3 h-3"
                        checked={(form.modulos || []).includes(m)}
                        onChange={toggleModule(m)}
                      />
                      {m}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Itens da atualização *">
                <textarea
                  rows={5}
                  value={form.items || ''}
                  onChange={set('items')}
                  placeholder={"- Ajuste no fecho automático\n- Melhoria no histórico\n- Correção no exportador PDF\n(um item por linha)"}
                  className={`${inputCls(c.ring)} resize-none font-mono`}
                />
                <p className="text-[11px] text-slate-600 mt-1">Escreva cada item numa linha separada. Use "-" para listar.</p>
              </Field>

              <Field label="Notas internas (opcional)">
                <textarea
                  rows={2}
                  value={form.notas || ''}
                  onChange={set('notas')}
                  placeholder="Observações relevantes para a equipa..."
                  className={`${inputCls(c.ring)} resize-none`}
                />
              </Field>
            </>
          )}

          {/* Aviso de anonimato */}
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
          <button
            onClick={handleSubmit}
            className={`px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors ${c.btn}`}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
