import React from 'react';
import { Plus, LifeBuoy, Bug, Lightbulb } from 'lucide-react';

const actions = [
  { label: "Criar Ticket",     icon: Plus,      key: "ticket",   style: "bg-blue-600 hover:bg-blue-500 text-white" },
  { label: "Pedir Ajuda",      icon: LifeBuoy,  key: "ajuda",    style: "bg-blue-600 hover:bg-blue-500 text-white" },
  { label: "Reportar Erro",    icon: Bug,       key: "erro",     style: "bg-blue-600 hover:bg-blue-500 text-white" },
  { label: "Sugerir Melhoria", icon: Lightbulb, key: "melhoria", style: "bg-blue-600 hover:bg-blue-500 text-white" },
];

export default function ActionButtons({ onOpen }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map(({ label, icon: Icon, key, style }) => (
        <button
          key={key}
          onClick={() => onOpen(key)}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${style}`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}