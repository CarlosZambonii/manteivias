import React, { useState } from 'react';
import { Trash2, Eye, Calendar, Layers, AlertTriangle } from 'lucide-react';
import Badge from './Badge';

function DeleteConfirmModal({ ticket, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-rose-500/20 bg-[#0b1120] shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
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
        <p className="text-sm font-medium text-white mb-5 line-clamp-2">"{ticket.title}"</p>

        <p className="text-xs text-slate-500 mb-5">Esta ação é permanente e não pode ser revertida.</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[#1e2a3a] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TicketCard({ ticket, onOpen, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <div className="group rounded-xl border border-[#1e2a3a] bg-[#0f1b2d] p-5 hover:border-blue-500/30 transition-all duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mt-0.5">
              <Layers className="w-4 h-4 text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 mb-0.5">
                <Badge variant={ticket.type}>{ticket.type}</Badge>
                <Badge variant={ticket.priority}>{ticket.priority}</Badge>
                <Badge variant={ticket.status}>{ticket.status}</Badge>
                <Badge variant="Módulo">{ticket.module}</Badge>
              </div>
              <h3 className="text-[15px] font-semibold text-white mt-1.5 leading-snug">{ticket.title}</h3>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-mono">
                <span>{ticket.code}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ticket.date}</span>
              </div>
              <p className="mt-2.5 text-sm text-slate-400 leading-relaxed line-clamp-2">{ticket.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 opacity-100 sm:opacity-40 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={onOpen}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              title="Ver detalhe"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {confirming && (
        <DeleteConfirmModal
          ticket={ticket}
          onConfirm={() => { onDelete?.(ticket.id); setConfirming(false); }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
