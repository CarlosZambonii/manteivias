import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { sendApprovalNotification } from '@/services/NotificationService';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RecordsEmployeeList from '@/components/validation/RecordsEmployeeList';
import * as XLSX from 'xlsx';
import { useAvailableMonths } from '@/hooks/useAvailableMonths';
import MonthMultiSelect from '@/components/ui/MonthMultiSelect';

const RecordsValidationTab = ({ worksiteFilter }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [worksites, setWorksites] = useState([]);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [filters, setFilters] = useState({
    worksiteId: 'all',
    status: 'Pendente',
    search: '',
    shift: 'all'
  });
  const [selectedMonths, setSelectedMonths] = useState([]);

  const filterWorksiteId = filters.worksiteId;
  const filterStatus = filters.status;
  const filterSearch = filters.search;
  const filterShift = filters.shift;
  const selectedMonthsKey = selectedMonths.map(m => format(m, 'yyyy-MM')).sort().join(',');

  const monthOptions = useAvailableMonths('registros_ponto', 'hora_inicio_real');

  useEffect(() => {
    if (monthOptions.length > 0 && selectedMonths.length === 0) {
      setSelectedMonths([monthOptions[0]]);
    }
  }, [monthOptions]);

  const fetchWorksites = useCallback(async () => {
    if (!user) return;
    try {
      let worksiteQuery = supabase.from('obras').select('id, nome');
      if (worksiteFilter) {
        worksiteQuery = worksiteQuery.in('id', worksiteFilter);
      } else {
        const isEncarregado = user.tipo_usuario === 'admin' && user.categoria === 'Encarregado';
        if (isEncarregado) {
           worksiteQuery = worksiteQuery.eq('encarregado_id', user.id);
        }
      }
      const { data: worksitesData, error: worksitesError } = await worksiteQuery;
      if (worksitesError) throw worksitesError;
      setWorksites(worksitesData || []);
    } catch (error) {
      console.error("Error fetching worksites:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao carregar obras.' });
    }
  }, [user, worksiteFilter, toast]);

  const fetchRecordsData = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;
    if (selectedMonths.length === 0) {
      setRecords([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const sorted = [...selectedMonths].sort((a, b) => a - b);
      const fromDate = startOfMonth(sorted[0]);
      const toDate = endOfMonth(sorted[sorted.length - 1]);

      let query = supabase
        .from('registros_ponto')
        .select(`
          *,
          usuario:usuarios!registros_ponto_usuario_id_fkey(id, nome, avatar_url, empresa),
          obra:obras(id, nome, latitude, longitude),
          correcoes_ponto(id, status)
        `)
        .gte('hora_inicio_real', fromDate.toISOString())
        .lte('hora_inicio_real', toDate.toISOString())
        .order('hora_inicio_real', { ascending: false });

      if (filterWorksiteId !== 'all') {
         query = query.eq('obra_id', parseInt(filterWorksiteId));
      } else if (worksiteFilter) {
         if (worksiteFilter.length > 0) {
             query = query.in('obra_id', worksiteFilter);
         } else {
             setRecords([]);
             setIsLoading(false);
             setIsRefreshing(false);
             return;
         }
      } else {
         const isEncarregado = user.tipo_usuario === 'admin' && user.categoria === 'Encarregado';
         if (isEncarregado) {
             if (worksites.length > 0) {
                 query = query.in('obra_id', worksites.map(w => w.id));
             } else {
                 setRecords([]);
                 setIsLoading(false);
                 setIsRefreshing(false);
                 return;
             }
         }
      }

      if (filterStatus === 'Pendente') {
        query = query.or('status_validacao.eq.Pendente,status_validacao.is.null,status_validacao.eq.Fechado Automaticamente');
      } else if (filterStatus !== 'Todos') {
        query = query.eq('status_validacao', filterStatus);
      }

      const { data: recordsData, error: recordsError } = await query;
      if (recordsError) throw recordsError;

      const selectedKeys = new Set(selectedMonths.map(m => format(m, 'yyyy-MM')));
      const filtered = (recordsData || []).filter(r =>
        r.hora_inicio_real && selectedKeys.has(r.hora_inicio_real.substring(0, 7))
      );

      setRecords(filtered);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao carregar registos.' });
      setRecords([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedMonthsKey, filterWorksiteId, filterStatus, worksites, worksiteFilter, toast, user]);

  useEffect(() => {
    if (user?.id) fetchWorksites();
  }, [fetchWorksites, user?.id]);

  useEffect(() => {
    fetchRecordsData();
  }, [selectedMonthsKey, filterWorksiteId, filterStatus, worksiteFilter, worksites.length, user?.tipo_usuario, user?.categoria]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateRecord = (updatedRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    if (filters.status === 'Pendente' && updatedRecord.status_validacao !== 'Pendente') {
         setRecords(prev => prev.filter(r => r.id !== updatedRecord.id));
    }
  };

  const handleDeleteRecord = (recordId) => {
      setRecords(prev => prev.filter(r => r.id !== recordId));
  };

  const handleBulkApprove = async (pendingRecords) => {
    if (!pendingRecords?.length) return;
    try {
      for (const record of pendingRecords) {
        await supabase.functions.invoke('update-record-status', {
          body: { recordId: record.id, status: 'Aprovado', adminId: user.id, rejectionComment: '' },
        });
      }
      const userId = pendingRecords[0]?.usuario_id;
      if (userId) sendApprovalNotification(userId, 'registo', 'Aprovado');
      const approvedIds = new Set(pendingRecords.map(r => r.id));
      setRecords(prev =>
        filters.status === 'Pendente'
          ? prev.filter(r => !approvedIds.has(r.id))
          : prev.map(r => approvedIds.has(r.id) ? { ...r, status_validacao: 'Aprovado' } : r)
      );
      toast({ variant: 'success', title: `${pendingRecords.length} registo(s) aprovado(s)` });
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao aprovar em massa.' });
    }
  };

  const handleExportXLSX = () => {
    if (!records || records.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para exportar.' });
      return;
    }
    const exportData = records.map(r => ({
      usuario_id: r.usuario_id,
      usuario_nome: r.usuario?.nome || '',
      empresa: r.usuario?.empresa || '',
      obra_id: r.obra_id,
      turno: r.turno,
      data_registo: r.hora_inicio_real ? format(new Date(r.hora_inicio_real), 'yyyy-MM-dd') : '',
      hora_inicio: r.hora_inicio_escolhido || '',
      hora_fim: r.hora_fim_escolhido || '',
      status_validacao: r.status_validacao
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registos");
    XLSX.writeFile(workbook, `registos_validacao_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const worksiteOptions = [
    { value: 'all', label: 'Todas as Obras' },
    ...worksites.map(w => ({ value: String(w.id), label: `${w.id} - ${w.nome}` }))
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Combobox
            options={worksiteOptions}
            value={filters.worksiteId}
            onChange={(v) => handleFilterChange('worksiteId', v)}
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
          <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Estados</SelectItem>
              <SelectItem value="Pendente">Pendentes</SelectItem>
              <SelectItem value="Fechado Automaticamente">Fechado Auto</SelectItem>
              <SelectItem value="Aprovado">Aprovados</SelectItem>
              <SelectItem value="Rejeitado">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.shift} onValueChange={(v) => handleFilterChange('shift', v)}>
            <SelectTrigger><SelectValue placeholder="Turno" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Turnos</SelectItem>
              <SelectItem value="Manha">Manhã</SelectItem>
              <SelectItem value="Tarde">Tarde</SelectItem>
              <SelectItem value="Extra">Extra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Input
            placeholder="Pesquisar colaborador..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="max-w-md"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleExportXLSX} disabled={isLoading || records.length === 0} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchRecordsData(true)} disabled={isLoading || isRefreshing} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />Atualizar
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-muted/20 rounded-lg border-2 border-dashed">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum registo encontrado</h3>
          <p className="text-muted-foreground text-sm">Não há registos correspondentes aos filtros selecionados.</p>
          <Button variant="link" onClick={() => { setFilters(prev => ({ ...prev, status: 'Todos', search: '', shift: 'all' })); setSelectedMonths(monthOptions.length > 0 ? [monthOptions[0]] : []); }}>
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <RecordsEmployeeList
          records={records}
          searchFilter={filterSearch}
          shiftFilter={filterShift}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
          onBulkApprove={handleBulkApprove}
        />
      )}
    </div>
  );
};

export default RecordsValidationTab;
