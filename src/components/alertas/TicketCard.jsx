import React from 'react';
import { Pencil, Trash2, Eye, Calendar, Layers } from 'lucide-react';
import Badge from './Badge';

export default function TicketCard({ ticket, onOpen }) {
  return (
    <div className="group rounded-xl border border-[#1e2a3a] bg-[#0f1b2d] p-5 hover:border-blue-500/30 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Ícone tipo */}
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

        {/* Ações */}
        <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={onOpen}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            title="Ver detalhe"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-blue-300 transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
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