import React from 'react';
import { Plus } from 'lucide-react';

export default function ActionButtons({ onOpen }) {
  return (
    <button
      onClick={() => onOpen('ticket')}
      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all duration-150 whitespace-nowrap"
    >
      <Plus className="w-4 h-4 shrink-0" />
      Criar Ticket
    </button>
  );
}