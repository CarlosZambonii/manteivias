import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2 } from 'lucide-react';
import StatCard from '@/components/alertas/StatCard';
import TicketCard from '@/components/alertas/TicketCard';
import UpdateCard from '@/components/alertas/UpdateCard';
import FilterBar from '@/components/alertas/FilterBar';
import ActionButtons from '@/components/alertas/ActionButtons';
import TicketDetailModal from '@/components/alertas/TicketDetailModal';
import FormModal from '@/components/alertas/FormModal';
import { tabs } from '@/components/alertas/mockData';
import { useAlertas } from '@/hooks/useAlertas';

const UpdatesPage = () => {
  const navigate = useNavigate();
  const { tickets, updates, stats, loading, addTicket, deleteTicket, addUpdate, deleteUpdate } = useAlertas();

  const [activeTab, setActiveTab] = useState('atualizacoes');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openForm, setOpenForm] = useState(null);
  const [filters, setFilters] = useState({ search: '', tipo: '', estado: '', prioridade: '', modulo: '' });

  const handleSubmit = (formData) => {
    if (openForm === 'atualizacao') {
      addUpdate(formData);
    } else {
      addTicket(formData, openForm);
    }
  };

  const visibleList = () => {
    let list = tickets;

    switch (activeTab) {
      case 'ajuda':     list = list.filter(t => t.type === 'Ajuda');     break;
      case 'melhorias': list = list.filter(t => t.type === 'Melhoria');  break;
      case 'erros':     list = list.filter(t => t.type === 'Erro');      break;
      case 'futuro':    list = list.filter(t => t.status === 'Planeado'); break;
      default: break;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q)
      );
    }
    if (filters.tipo)       list = list.filter(t => t.type === filters.tipo);
    if (filters.estado)     list = list.filter(t => t.status === filters.estado);
    if (filters.prioridade) list = list.filter(t => t.priority === filters.prioridade);
    if (filters.modulo)     list = list.filter(t => t.module === filters.modulo);

    return list;
  };

  const list = visibleList();

  return (
    <>
      <Helmet>
        <title>Central de Atualizações</title>
        <meta name="description" content="Acompanhe atualizações do sistema, reporte dificuldades, peça ajuda e envie sugestões de melhoria." />
      </Helmet>

      <div className="min-h-screen bg-[#080f1a] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">Central de Atualizações</h1>
          <p className="text-slate-400 text-sm mb-6 max-w-2xl">
            Acompanhe atualizações do sistema, reporte dificuldades, peça ajuda e envie sugestões de melhoria.
          </p>

          <div className="mb-6">
            <ActionButtons onOpen={(key) => setOpenForm(key)} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {stats.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} />
            ))}
          </div>

          <div className="mb-5">
            <FilterBar filters={filters} onChange={setFilters} />
          </div>

          <div className="flex rounded-xl border border-[#1e2a3a] bg-[#0b1525] p-1 gap-0.5 mb-5 overflow-x-auto scrollbar-none">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 sm:flex-1 justify-center
                  ${activeTab === t.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

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

          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : activeTab === 'atualizacoes' ? (
              updates.length > 0
                ? updates.map((u) => <UpdateCard key={u.id} update={u} onDelete={deleteUpdate} />)
                : <div className="text-center py-16"><p className="text-slate-500 text-sm">Nenhuma atualização registada.</p></div>
            ) : list.length > 0 ? (
              list.map((t) => (
                <TicketCard key={t.id} ticket={t} onOpen={() => setSelectedTicket(t)} onDelete={deleteTicket} />
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-slate-500 text-sm">Nenhum item nesta categoria.</p>
              </div>
            )}
          </div>

          <footer className="mt-12 pt-6 border-t border-[#1e2a3a] text-center text-xs text-slate-600">
            Manteivias • Central Interna de Suporte
          </footer>
        </div>

        <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
        <FormModal type={openForm} onClose={() => setOpenForm(null)} onSubmit={handleSubmit} />
      </div>
    </>
  );
};

export default UpdatesPage;
