import React from 'react';
import { X, Paperclip, Circle, Clock, Wrench, CheckCircle2, FileImage } from 'lucide-react';
import Badge from './Badge';

const timelineSteps = [
  { label: "Ticket criado",       date: "10 mar 2026 • 09:14", icon: Circle,       done: true },
  { label: "Em análise",          date: "10 mar 2026 • 14:02", icon: Clock,        done: true },
  { label: "Em desenvolvimento",  date: "11 mar 2026 • 10:30", icon: Wrench,       done: true, active: true },
  { label: "Resolvido",           date: "—",                   icon: CheckCircle2, done: false },
];

const comments = [
  { author: "Sistema",                 tone: "system", text: "Ticket recebido e encaminhado para análise.",                                   time: "10 mar • 09:14" },
  { author: "Equipa de Desenvolvimento", tone: "dev",  text: "Conseguimos reproduzir o problema em ambiente de testes. A investigar.",          time: "10 mar • 15:48" },
  { author: "Utilizador",              tone: "user",   text: "Obrigado. Acontece sobretudo no turno da tarde, após as 17h.",                   time: "11 mar • 08:20" },
  { author: "Equipa de Desenvolvimento", tone: "dev",  text: "Correção em curso — prevista para a próxima atualização.",                       time: "11 mar • 10:30" },
];

export default function TicketDetailModal({ ticket, onClose }) {
  if (!ticket) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl border border-[#1e2a3a] bg-[#0b1120] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#1e2a3a]">
          <div>
            <p className="text-[11px] font-mono text-slate-500 tracking-widest mb-1">{ticket.code}</p>
            <h2 className="text-lg font-semibold text-white">{ticket.title}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant={ticket.type}>{ticket.type}</Badge>
              <Badge variant={ticket.status}>{ticket.status}</Badge>
              <Badge variant={ticket.priority}>{ticket.priority}</Badge>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6 space-y-6">

          {/* Info geral */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-2">Informação geral</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Data", value: ticket.date },
                { label: "Módulo", value: ticket.module },
                { label: "Prioridade", value: ticket.priority },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] p-3">
                  <p className="text-[10px] uppercase text-slate-500">{label}</p>
                  <p className="text-sm text-white mt-1 font-medium">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Descrição */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-2">Descrição completa</p>
            <div className="rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] p-4 text-sm text-slate-300 leading-relaxed">
              {ticket.description} Ao concluir o registo do final do turno da tarde, o sistema aparenta gravar corretamente, mas a hora final não fica persistida no histórico. O problema foi observado em múltiplas ocasiões, principalmente após períodos de inatividade prolongada.
            </div>
          </section>

          {/* Anexos */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-2">Anexos</p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: FileImage, name: "screenshot-erro.png" },
                { icon: Paperclip, name: "log-2026-03-10.txt" },
              ].map(({ icon: Icon, name }) => (
                <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] text-sm text-slate-300">
                  <Icon className="w-4 h-4 text-slate-500" />
                  {name}
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-3">Timeline</p>
            <div className="relative pl-7">
              <div className="absolute left-[11px] top-1 bottom-1 w-px bg-[#1e2a3a]" />
              {timelineSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="relative pb-4 last:pb-0">
                    <div className={`absolute -left-7 top-0 w-6 h-6 rounded-full flex items-center justify-center border ${
                      step.active ? "bg-blue-600/20 border-blue-500/40"
                      : step.done ? "bg-emerald-500/15 border-emerald-500/30"
                      : "bg-[#0f1b2d] border-[#1e2a3a]"
                    }`}>
                      <Icon className={`w-3 h-3 ${
                        step.active ? "text-blue-400"
                        : step.done ? "text-emerald-400"
                        : "text-slate-600"
                      }`} />
                    </div>
                    <p className={`text-sm font-medium ${step.done || step.active ? "text-white" : "text-slate-500"}`}>{step.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{step.date}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Comentários */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-3">Comentários</p>
            <div className="space-y-2">
              {comments.map((c, i) => (
                <div key={i} className={`rounded-lg border p-3 ${
                  c.tone === "dev"    ? "border-blue-500/15 bg-blue-500/[0.04]"
                  : c.tone === "system" ? "border-[#1e2a3a] bg-[#0f1b2d]"
                  : "border-[#1e2a3a] bg-[#0f1b2d]"
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${
                      c.tone === "dev" ? "text-blue-300"
                      : c.tone === "system" ? "text-slate-400"
                      : "text-slate-300"
                    }`}>{c.author}</span>
                    <span className="text-[11px] text-slate-500">{c.time}</span>
                  </div>
                  <p className="text-sm text-slate-300">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] p-3">
              <textarea
                placeholder="Escrever um comentário..."
                rows={2}
                className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none resize-none"
              />
              <div className="flex justify-end mt-1">
                <button className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
                  Enviar
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}