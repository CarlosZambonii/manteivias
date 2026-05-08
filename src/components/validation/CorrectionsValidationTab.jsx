import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { sendApprovalNotification } from '@/services/NotificationService';
import { RefreshCw, Download, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import CorrectionsByUserList from '@/components/corrections/CorrectionsByUserList';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { useAvailableMonths } from '@/hooks/useAvailableMonths';
import MonthMultiSelect from '@/components/ui/MonthMultiSelect';

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
  });
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filterWorksiteId = filters.worksiteId;
  const filterStatus = filters.status;
  const selectedMonthsKey = selectedMonths.map(m => format(m, 'yyyy-MM')).sort().join(',');

  const monthOptions = useAvailableMonths('correcoes_ponto', 'data_correcao');

  useEffect(() => {
    if (monthOptions.length > 0 && selectedMonths.length === 0) {
      setSelectedMonths([monthOptions[0]]);
    }
  }, [monthOptions]);

  const fetchCorrections = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    if (selectedMonths.length === 0) {
      setCorrections([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      let worksiteQuery = supabase.from('obras').select('id, nome');
      if (worksiteFilter) worksiteQuery = worksiteQuery.in('id', worksiteFilter);

      const { data: worksitesData, error: worksitesError } = await worksiteQuery;
      if (worksitesError) throw worksitesError;
      setWorksites(worksitesData || []);

      const worksiteIds = filterWorksiteId === 'all'
        ? (worksiteFilter || (worksitesData || []).map(w => w.id))
        : [parseInt(filterWorksiteId)];

      if (worksiteIds && worksiteIds.length === 0 && (filterWorksiteId !== 'all' || worksiteFilter)) {
        setCorrections([]);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const sorted = [...selectedMonths].sort((a, b) => a - b);
      const fromDate = format(startOfMonth(sorted[0]), 'yyyy-MM-dd');
      const toDate = format(endOfMonth(sorted[sorted.length - 1]), 'yyyy-MM-dd');

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

      const selectedKeys = new Set(selectedMonths.map(m => format(m, 'yyyy-MM')));
      const filtered = (data || []).filter(r =>
        r.data_correcao && selectedKeys.has(r.data_correcao.substring(0, 7))
      );

      setCorrections(filtered);
    } catch (error) {
      console.error('Error fetching corrections:', error);
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível carregar as correções.` });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, filterWorksiteId, filterStatus, selectedMonthsKey, worksiteFilter, toast]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const handleUpdateStatus = ({ id, status, rejeicao_comentario }) => {
    setCorrections(prev => prev.map(c =>
      c.id === id ? { ...c, status, ...(rejeicao_comentario !== undefined && { rejeicao_comentario }) } : c
    ));
  };

  const handleBulkApprove = async (pendingCorrections) => {
    if (!pendingCorrections?.length) return;
    try {
      const ids = pendingCorrections.map(c => c.id);
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('correcoes_ponto')
        .update({ status: 'Aprovado', validado_por: user.id, data_validacao: now })
        .in('id', ids);
      if (error) throw error;

      const registroIds = pendingCorrections.filter(c => c.registro_ponto_id).map(c => c.registro_ponto_id);
      if (registroIds.length > 0) {
        await supabase.from('registros_ponto').delete().in('id', registroIds);
      }

      const userId = pendingCorrections[0]?.usuario_id;
      if (userId) sendApprovalNotification(userId, 'correcao', 'Aprovado');

      setCorrections(prev => prev.map(c =>
        ids.includes(c.id) ? { ...c, status: 'Aprovado', validado_por: user.id, data_validacao: now } : c
      ));
      toast({ variant: 'success', title: `${ids.length} correção(ões) aprovada(s)` });
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao aprovar em massa.' });
    }
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
    XLSX.writeFile(workbook, `correcoes_validacao_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const worksiteOptions = [
    { value: 'all', label: 'Todas as Obras' },
    ...worksites.map(w => ({ value: String(w.id), label: `${w.id} - ${w.nome}` }))
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Combobox
            options={worksiteOptions}
            value={filters.worksiteId}
            onChange={(v) => setFilters(prev => ({ ...prev, worksiteId: v }))}
            placeholder="Filtrar por obra..."
            searchPlaceholder="Procurar obra..."
            noResultsText="Nenhuma obra encontrada."
            className="w-full"
          />
          <MonthMultiSelect
            months={monthOptions}
            selectedMonths={selectedMonths}
            onChange={setSelectedMonths}
          />
          <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Estados</SelectItem>
              <SelectItem value="Pendente">Pendentes</SelectItem>
              <SelectItem value="Aprovado">Aprovados</SelectItem>
              <SelectItem value="Rejeitado">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Input
            placeholder="Pesquisar colaborador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleExportXLSX} disabled={isLoading || corrections.length === 0} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchCorrections(true)} disabled={isLoading || isRefreshing} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />Atualizar
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : corrections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-muted/20 rounded-lg border-2 border-dashed">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma correção encontrada</h3>
          <p className="text-muted-foreground text-sm">Não há correções correspondentes aos filtros selecionados.</p>
          <Button variant="link" onClick={() => { setFilters(prev => ({ ...prev, status: 'Todos' })); setSearchQuery(''); setSelectedMonths(monthOptions.length > 0 ? [monthOptions[0]] : []); }}>
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <CorrectionsByUserList
          corrections={corrections}
          searchQuery={searchQuery}
          onUpdateStatus={handleUpdateStatus}
          onBulkApprove={handleBulkApprove}
        />
      )}
    </div>
  );
};

export default CorrectionsValidationTab;
