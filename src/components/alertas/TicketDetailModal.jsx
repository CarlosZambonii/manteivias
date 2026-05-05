import React, { useState, useEffect, useCallback } from 'react';
import { X, Paperclip, Circle, Clock, Wrench, CheckCircle2, ChevronRight, Send, Trash2, AlertTriangle } from 'lucide-react';
import Badge from './Badge';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_FLOW = ["Recebido", "Em análise", "Em desenvolvimento", "Resolvido"];

const STATUS_META = {
  "Recebido":           { icon: Circle,       color: "text-slate-400",   bg: "bg-slate-500/15 border-slate-500/30" },
  "Em análise":         { icon: Clock,        color: "text-amber-400",   bg: "bg-amber-500/15 border-amber-500/30" },
  "Em desenvolvimento": { icon: Wrench,       color: "text-blue-400",    bg: "bg-blue-500/15 border-blue-500/30" },
  "Resolvido":          { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
};

const NEXT_STATUS_BTN = {
  "Recebido":           { label: "Mover para Em análise",        next: "Em análise",         cls: "bg-amber-600 hover:bg-amber-500" },
  "Em análise":         { label: "Mover para Em desenvolvimento", next: "Em desenvolvimento", cls: "bg-blue-600 hover:bg-blue-500" },
  "Em desenvolvimento": { label: "Marcar como Resolvido",        next: "Resolvido",          cls: "bg-emerald-600 hover:bg-emerald-500" },
};

function formatTs(iso) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function DeleteConfirmPopup({ ticket, onConfirm, onCancel, deleting }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-xl border border-rose-500/20 bg-[#0b1120] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Eliminar ticket</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{ticket.code}</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 mb-1">Tens a certeza que queres eliminar:</p>
        <p className="text-sm font-medium text-white mb-4 line-clamp-2">"{ticket.title}"</p>
        <p className="text-xs text-slate-500 mb-5">Esta ação é permanente e não pode ser revertida.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#1e2a3a] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {deleting ? 'A eliminar...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TicketDetailModal({ ticket: initialTicket, onClose, onStatusChange, onAddComment, onFetchComments, onDelete }) {
  const { user, isAdminStar } = useAuth();
  const [ticket, setTicket] = useState(initialTicket);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadComments = useCallback(async () => {
    if (!ticket?.id || !onFetchComments) return;
    const data = await onFetchComments(ticket.id);
    setComments(data);
  }, [ticket?.id, onFetchComments]);

  useEffect(() => {
    setTicket(initialTicket);
  }, [initialTicket]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  if (!ticket) return null;

  const currentIdx = STATUS_FLOW.indexOf(ticket.status);
  const nextBtn = NEXT_STATUS_BTN[ticket.status];

  const handleAdvance = async () => {
    if (!nextBtn || advancing) return;
    setAdvancing(true);
    const ok = await onStatusChange?.(ticket.id, nextBtn.next, user?.nome);
    if (ok) {
      setTicket(t => ({ ...t, status: nextBtn.next }));
      await loadComments();
    }
    setAdvancing(false);
  };

  const handleComment = async () => {
    if (!commentText.trim() || sending) return;
    setSending(true);
    setCommentError('');
    const result = await onAddComment?.(ticket.id, commentText.trim(), ticket.status, user?.nome);
    if (result?.ok) {
      setCommentText('');
      await loadComments();
    } else {
      setCommentError(result?.message || 'Erro ao enviar comentário.');
    }
    setSending(false);
  };

  const commentsForStep = (status) => comments.filter(c => c.status_label === status);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete?.(ticket.id);
    setDeleting(false);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-2xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-xl border border-[#1e2a3a] bg-[#0b1120] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 py-4 border-b border-[#1e2a3a] shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-[11px] font-mono text-slate-500 tracking-widest mb-1">{ticket.code}</p>
            <h2 className="text-base sm:text-lg font-semibold text-white leading-tight">{ticket.title}</h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant={ticket.type}>{ticket.type}</Badge>
              <Badge variant={ticket.status}>{ticket.status}</Badge>
              {ticket.priority && <Badge variant={ticket.priority}>{ticket.priority}</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isAdminStar && onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-rose-400 transition-colors"
                title="Eliminar ticket"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 space-y-5">

          {/* Info geral */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-2">Informação geral</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Data",       value: ticket.date },
                { label: "Módulo",     value: ticket.module },
                { label: "Prioridade", value: ticket.priority || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] p-2.5">
                  <p className="text-[10px] uppercase text-slate-500">{label}</p>
                  <p className="text-xs sm:text-sm text-white mt-1 font-medium truncate">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Descrição */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-2">Descrição</p>
            <div className="rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] p-3 text-sm text-slate-300 leading-relaxed">
              {ticket.description || <span className="text-slate-500 italic">Sem descrição.</span>}
            </div>
          </section>

          {/* Anexos */}
          {ticket.attachmentUrl && (
            <section>
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-2">Anexo</p>
              <a
                href={ticket.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1e2a3a] bg-[#0f1b2d] text-sm text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
              >
                <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="truncate">{decodeURIComponent(ticket.attachmentUrl.split('/').pop().replace(/^\d+\./, ''))}</span>
              </a>
            </section>
          )}

          {/* Timeline com comentários por etapa */}
          <section>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-3">Progresso</p>
            <div className="relative pl-7">
              <div className="absolute left-[11px] top-1 bottom-1 w-px bg-[#1e2a3a]" />
              {STATUS_FLOW.map((status, i) => {
                const meta = STATUS_META[status];
                const Icon = meta.icon;
                const done = i <= currentIdx;
                const active = i === currentIdx;
                const stepComments = commentsForStep(status);

                return (
                  <div key={status} className="relative pb-5 last:pb-0">
                    <div className={`absolute -left-7 top-0 w-6 h-6 rounded-full flex items-center justify-center border ${
                      active ? meta.bg : done ? "bg-emerald-500/10 border-emerald-500/25" : "bg-[#0f1b2d] border-[#1e2a3a]"
                    }`}>
                      <Icon className={`w-3 h-3 ${active ? meta.color : done ? "text-emerald-400" : "text-slate-600"}`} />
                    </div>

                    <p className={`text-sm font-medium ${done || active ? "text-white" : "text-slate-500"}`}>{status}</p>

                    {/* Comentários desta etapa */}
                    {stepComments.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {stepComments.map(c => (
                          <div key={c.id} className={`rounded-lg border px-3 py-2 ${
                            c.is_system
                              ? "border-[#1e2a3a] bg-[#0f1b2d]"
                              : "border-blue-500/15 bg-blue-500/[0.04]"
                          }`}>
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className={`text-[11px] font-semibold ${c.is_system ? "text-slate-500" : "text-blue-300"}`}>
                                {c.is_system ? "Sistema" : (c.author_name || "Admin")}
                              </span>
                              <span className="text-[10px] text-slate-600 shrink-0">{formatTs(c.created_at)}</span>
                            </div>
                            <p className="text-xs text-slate-300">{c.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer — admin_star actions */}
        {isAdminStar && ticket.status !== 'Resolvido' && (
          <div className="shrink-0 border-t border-[#1e2a3a] px-4 sm:px-6 py-3 space-y-3">
            {/* Caixa de comentário */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => { setCommentText(e.target.value); setCommentError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleComment()}
                  placeholder="Adicionar comentário..."
                  className="flex-1 px-3 py-2 rounded-lg border border-[#1e2a3a] bg-[#0b1525] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || sending}
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {commentError && (
                <p className="text-xs text-rose-400 px-1">{commentError}</p>
              )}
            </div>

            {/* Botão avançar estado */}
            {nextBtn && (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 ${nextBtn.cls}`}
              >
                <ChevronRight className="w-4 h-4" />
                {advancing ? 'A atualizar...' : nextBtn.label}
              </button>
            )}
          </div>
        )}

        {/* Footer — ticket resolvido */}
        {ticket.status === 'Resolvido' && (
          <div className="shrink-0 border-t border-[#1e2a3a] px-4 sm:px-6 py-3">
            <p className="text-center text-xs text-emerald-400 font-medium">Ticket resolvido</p>
          </div>
        )}
      </div>

      {confirmDelete && (
        <DeleteConfirmPopup
          ticket={ticket}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
