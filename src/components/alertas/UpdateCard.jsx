import React from 'react';
import { Pencil, Trash2, FileText } from 'lucide-react';

export default function UpdateCard({ update, onDelete }) {
  return (
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
            onClick={() => onDelete?.(update.id)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
