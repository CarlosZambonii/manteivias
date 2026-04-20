import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import Navbar from '../components/alertas/Navbar';
import StatCard from '../components/alertas/StatCard';
import TicketCard from '../components/alertas/TicketCard';
import UpdateCard from '../components/alertas/UpdateCard';
import FilterBar from '../components/alertas/FilterBar';
import ActionButtons from '../components/alertas/ActionButtons';
import TicketDetailModal from '../components/alertas/TicketDetailModal';
import FormModal from '../components/alertas/FormModal';
import { stats, tickets, updates, tabs } from '../components/alertas/mockData';



export default function CentralAlertas() {
  const [activeTab, setActiveTab] = useState('atualizacoes');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openForm, setOpenForm] = useState(null);

  const visibleTickets = () => {
    switch (activeTab) {
      case 'ajuda':     return tickets.filter(t => t.type === 'Ajuda');
      case 'melhorias': return tickets.filter(t => t.type === 'Melhoria');
      case 'erros':     return tickets.filter(t => t.type === 'Erro');
      case 'futuro':    return tickets.filter(t => t.status === 'Planeado');
      default:          return tickets;
    }
  };

  const list = visibleTickets();

  return (
    <div className="min-h-screen bg-[#080f1a] text-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <button className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Título */}
        <h1 className="text-3xl font-bold text-white mb-2">Central de Alertas</h1>
        <p className="text-slate-400 text-sm mb-6 max-w-2xl">
          Acompanhe atualizações do sistema, reporte dificuldades, peça ajuda e envie sugestões de melhoria.
        </p>

        {/* Botões de ação */}
        <div className="mb-6">
          <ActionButtons onOpen={(key) => setOpenForm(key)} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} />
          ))}
        </div>

        {/* Filtros */}
        <div className="mb-5">
          <FilterBar />
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl border border-[#1e2a3a] bg-[#0b1525] p-1 gap-0.5 mb-5 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 flex-1 justify-center
                ${activeTab === t.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Botão contextual por tab */}
        {(activeTab === 'atualizacoes' || activeTab === 'futuro') && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setOpenForm(activeTab === 'atualizacoes' ? 'atualizacao' : 'futuro')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              + {activeTab === 'atualizacoes' ? 'Adicionar Atualização' : 'Adicionar ao Futuro'}
            </button>
          </div>
        )}

        {/* Conteúdo */}
        <div className="space-y-3">
          {activeTab === 'atualizacoes' ? (
            updates.map((u) => <UpdateCard key={u.title} update={u} />)
          ) : list.length > 0 ? (
            list.map((t) => (
              <TicketCard key={t.code} ticket={t} onOpen={() => setSelectedTicket(t)} />
            ))
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-500 text-sm">Nenhum item nesta categoria.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-[#1e2a3a] text-center text-xs text-slate-600">
          Manteivias • Central Interna de Suporte
        </footer>
      </div>

      <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      <FormModal type={openForm} onClose={() => setOpenForm(null)} />
    </div>
  );
}