import React, { useState } from 'react';
import { Trash2, FileText, AlertTriangle } from 'lucide-react';

function DeleteConfirmModal({ update, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
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
          <h3 className="text-base font-semibold text-white">Eliminar atualização</h3>
        </div>
        <p className="text-sm text-slate-300 mb-1">Tens a certeza que queres eliminar:</p>
        <p className="text-sm font-medium text-white mb-4 line-clamp-2">"{update.title}"</p>
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

export default function UpdateCard({ update, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <div className="group rounded-xl border border-[#1e2a3a] bg-[#0f1b2d] p-5 hover:border-blue-500/30 transition-all duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mt-0.5">
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-white leading-snug">{update.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{update.date} • Equipa de Desenvolvimento</p>
              <ul className="mt-3 space-y-1">
                {update.items.map((item, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-blue-400 mt-0.5">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-100 sm:opacity-40 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
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
          update={update}
          onConfirm={() => { onDelete?.(update.id); setConfirming(false); }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}
