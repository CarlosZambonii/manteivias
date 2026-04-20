import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, Search, Filter, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import CorrectionsByUserList from '@/components/corrections/CorrectionsByUserList';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

const CorrectionsValidationTab = ({ worksiteFilter }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [worksites, setWorksites] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [filters, setFilters] = useState({
    worksiteId: 'all',
    status: 'Pendente',
    month: new Date(),
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Extract primitives
  const filterWorksiteId = filters.worksiteId;
  const filterStatus = filters.status;
  const filterMonthTime = filters.month.getTime();

  const fetchCorrections = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // 1. Fetch Worksites
      let worksiteQuery = supabase.from('obras').select('id, nome');
      if (worksiteFilter) worksiteQuery = worksiteQuery.in('id', worksiteFilter);
      
      const { data: worksitesData, error: worksitesError } = await worksiteQuery;
      if (worksitesError) throw worksitesError;
      setWorksites(worksitesData || []);

      const worksiteIds = filterWorksiteId === 'all'
        ? (worksiteFilter || (worksitesData || []).map(w => w.id))
        : [parseInt(filterWorksiteId)];

      // If restricted user has no worksites, stop
      if (worksiteIds && worksiteIds.length === 0 && (filterWorksiteId !== 'all' || worksiteFilter)) {
        setCorrections([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      // 2. Fetch Corrections
      const currentMonth = new Date(filterMonthTime);
      const fromDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const toDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      let query = supabase
        .from('correcoes_ponto')
        .select('*, usuario:usuarios!correcoes_ponto_usuario_id_fkey(id, nome, avatar_url), obra:obras(id, nome)')
        .gte('data_correcao', fromDate)
        .lte('data_correcao', toDate)
        .order('data_solicitacao', { ascending: false });

      if (worksiteIds && worksiteIds.length > 0) {
        query = query.in('obra_id', worksiteIds);
      }

      if (filterStatus !== 'Todos') {
        query = query.eq('status', filterStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setCorrections(data || []);

    } catch (error) {
      console.error('Error fetching corrections:', error);
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível carregar as correções.` });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, filterWorksiteId, filterStatus, filterMonthTime, worksiteFilter, toast]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const handleUpdateStatus = async ({ id, status }) => {
      try {
        const { error } = await supabase
            .from('correcoes_ponto')
            .update({ 
                status: status,
                validado_por: user.id,
                data_validacao: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        // Optimistic Update
        setCorrections(prev => prev.map(c => c.id === id ? { ...c, status: status } : c));
        
      } catch (err) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar correção.' });
          fetchCorrections(); // Revert on error
      }
  };
  
  const handleFilterChange = (key, value) => {
    if (key === 'month') {
      const [year, month] = value.split('-').map(Number);
      value = new Date(year, month - 1, 15);
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExportXLSX = () => {
    if (!corrections || corrections.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para exportar.' });
      return;
    }

    const exportData = corrections.map(c => ({
      usuario_id: c.usuario_id,
      usuario_nome: c.usuario?.nome || '',
      obra_id: c.obra_id,
      turno: c.turno,
      data_correcao: c.data_correcao,
      hora_inicio_sugerida: c.hora_inicio_sugerida || '',
      hora_fim_sugerida: c.hora_fim_sugerida || '',
      tipo: c.tipo,
      status: c.status,
      validado_por: c.validado_por || '',
      data_validacao: c.data_validacao ? format(new Date(c.data_validacao), 'yyyy-MM-dd HH:mm') : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Correções");
    const filename = `correcoes_validacao_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const monthOptions = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));

  const worksiteOptions = [
    { value: 'all', label: 'Todas as Obras' },
    ...worksites.map(w => ({ value: String(w.id), label: `${w.id} - ${w.nome}` }))
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 py-6">
      <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6 mb-8">
        <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Filter className="h-5 w-5 text-primary" />
                <h2>Filtros de Pesquisa</h2>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportXLSX}
                disabled={isLoading || corrections.length === 0}
            >
                <Download className="h-4 w-4 mr-2" />
                Download
            </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">Obra</label>
                <Combobox
                  options={worksiteOptions}
                  value={filters.worksiteId}
                  onChange={(v) => handleFilterChange('worksiteId', v)}
                  placeholder="Filtrar por obra..."
                  searchPlaceholder="Procurar obra..."
                  noResultsText="Nenhuma obra encontrada."
                  className="w-full"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">Status</label>
                <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos os Estados</SelectItem>
                    <SelectItem value="Pendente">Pendentes</SelectItem>
                    <SelectItem value="Aprovado">Aprovados</SelectItem>
                    <SelectItem value="Rejeitado">Rejeitados</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">Período</label>
                <Select value={format(filters.month, 'yyyy-MM')} onValueChange={(v) => handleFilterChange('month', v)}>
                  <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(m => (
                      <SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                        {format(m, 'MMMM yyyy', { locale: pt })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">Pesquisa</label>
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Nome do colaborador..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-dashed">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchCorrections(true)} 
                disabled={isLoading || isRefreshing}
                className="w-full sm:w-auto min-w-[120px]"
            >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
            </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted/50 animate-pulse rounded-xl border border-border/50" />
            ))}
        </div>
      ) : (
        <div className="space-y-8">
            <CorrectionsByUserList 
                corrections={corrections} 
                searchQuery={searchQuery}
                onUpdateStatus={handleUpdateStatus} 
            />
        </div>
      )}
    </div>
  );
};

export default CorrectionsValidationTab;