import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, ArrowUp, ArrowDown, RefreshCw, Search, SlidersHorizontal, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isValid, parseISO, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Custom Components
import { useOfflineHolidays } from '@/hooks/useOfflineHolidays';
import OfflineSyncIndicator from '@/components/OfflineSyncIndicator';
import HolidaysEmployeeList from '@/components/validation/HolidaysEmployeeList';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';
import { sendApprovalNotification } from '@/services/NotificationService';
import { useAvailableMonths } from '@/hooks/useAvailableMonths';
import MonthMultiSelect from '@/components/ui/MonthMultiSelect';

const HolidaysValidationTab = ({ worksiteFilter }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Offline Hooks
  const { 
      offlineData, 
      saveHolidaysOffline, 
      addPendingAction, 
      syncPendingActions, 
      pendingActions, 
      syncStatus,
      isOnline 
  } = useOfflineHolidays();

  // Refs to prevent infinite dependency loops in useEffect
  const offlineDataRef = useRef(offlineData);
  const saveHolidaysOfflineRef = useRef(saveHolidaysOffline);

  useEffect(() => {
    offlineDataRef.current = offlineData;
  }, [offlineData]);

  useEffect(() => {
    saveHolidaysOfflineRef.current = saveHolidaysOffline;
  }, [saveHolidaysOffline]);

  const [justifications, setJustifications] = useState([]);
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const [statusFilter, setStatusFilter] = useState('Pendente');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'data_envio', direction: 'descending' });

  const monthOptions = useAvailableMonths('justificação', 'data_envio');
  const selectedMonthsKey = selectedMonths.map(m => format(m, 'yyyy-MM')).sort().join(',');

  useEffect(() => {
    if (monthOptions.length > 0 && selectedMonths.length === 0) {
      setSelectedMonths([monthOptions[0]]);
    }
  }, [monthOptions]);

  // Action states
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, item: null });

  // Main Data Fetching - Memoized to prevent infinite loops
  const fetchData = useCallback(async (isRefresh = false) => {
    if (selectedMonths.length === 0) {
      setJustifications([]);
      setLoading(false);
      return;
    }
    if (isRefresh) setLoading(true);

    const currentOfflineData = offlineDataRef.current;
    if (!isRefresh && currentOfflineData && currentOfflineData.length > 0 && !worksiteFilter) {
        setJustifications(currentOfflineData);
        setLoading(false);
    } else {
        setLoading(true);
    }

    if (!navigator.onLine) {
        setLoading(false);
        return;
    }

    setError(null);
    try {
      let validUserIds = null;
      if (worksiteFilter) {
          if (worksiteFilter.length === 0) {
              setJustifications([]);
              setLoading(false);
              return;
          }
          const { data: uData } = await supabase.from('registros_ponto').select('usuario_id').in('obra_id', worksiteFilter);
          validUserIds = [...new Set((uData || []).map(u => u.usuario_id))];
          if (validUserIds.length === 0) {
              setJustifications([]);
              setLoading(false);
              return;
          }
      }

      // 1. Fetch Holiday Types (FE, FP)
      const { data: typesData, error: typesError } = await supabase
        .from('tipos_justificação')
        .select('id, codigo')
        .in('codigo', ['FE', 'FP']);

      if (typesError) throw new Error(`Erro ao buscar tipos de justificação: ${typesError.message}`);
      if (!typesData || typesData.length === 0) {
        throw new Error('Tipos de justificação (FE, FP) não encontrados na configuração.');
      }

      const holidayTypeIds = typesData.map(t => t.id);

      // 2. Fetch Public Holidays (range of all selected months)
      const sortedSel = [...selectedMonths].sort((a, b) => a - b);
      const start = startOfMonth(sortedSel[0]);
      const end = endOfMonth(sortedSel[sortedSel.length - 1]);

      const { data: holidaysData, error: holidaysError } = await supabase
        .from('feriados')
        .select('*')
        .gte('data', format(start, 'yyyy-MM-dd'))
        .lte('data', format(end, 'yyyy-MM-dd'));

      if (holidaysError) {
        console.warn('Erro ao buscar feriados (não crítico):', holidaysError.message);
      }
      setPublicHolidays(holidaysData || []);

      // 3. Fetch Users (Mensal)
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nome, tipo_registo, avatar_url')
        .ilike('tipo_registo', '%Mensal%');
        
      if (userError) throw new Error(`Erro ao buscar usuários: ${userError.message}`);
      
      const userMap = new Map(userData.map(u => [u.id, u]));
      
      // 4. Fetch Justifications
      let query = supabase
        .from('justificação')
        .select(`
          *,
          tipos_justificação!inner(id, nome, codigo)
        `)
        .in('tipo_justificação_id', holidayTypeIds)
        .gte('data_envio', start.toISOString())
        .lte('data_envio', end.toISOString())
        .order('data_envio', { ascending: false });

      // Filter to only selected months (client-side for non-contiguous selection)
      const selectedKeys = new Set(selectedMonths.map(m => format(m, 'yyyy-MM')));

      if (validUserIds) {
          query = query.in('usuario_id', validUserIds);
      }

      const { data: justData, error: justError } = await query;

      if (justError) throw new Error(`Erro ao buscar justificações: ${justError.message}`);

      // 4.5 Fetch Validator Names
      const validatorIds = [...new Set((justData || []).map(j => j.validado_por).filter(Boolean))];
      let validatorMap = new Map();
      if (validatorIds.length > 0) {
          const { data: valData } = await supabase
              .from('usuarios')
              .select('id, nome')
              .in('id', validatorIds);
          if (valData) {
              validatorMap = new Map(valData.map(v => [v.id, v.nome]));
          }
      }

      // 5. Merge Data
      const mergedJustifications = (justData || [])
        .map(item => ({
            ...item,
            usuarios: userMap.get(item.usuario_id),
            validator_name: validatorMap.get(item.validado_por) || null
        }))
        .filter(item => {
            if (!item.usuarios) return false;
            if (!item.dias || !Array.isArray(item.dias)) return false;
            if (item.data_envio && !selectedKeys.has(item.data_envio.substring(0, 7))) return false;
            return true;
        });

      // Save to Offline Storage using ref
      if (saveHolidaysOfflineRef.current && !worksiteFilter) {
         await saveHolidaysOfflineRef.current(mergedJustifications);
      }
      setJustifications(mergedJustifications);

    } catch (err) {
      console.error('Critical error in HolidaysValidationTab:', err);
      const fallbackData = offlineDataRef.current;
      if (fallbackData && fallbackData.length > 0 && !worksiteFilter) {
        setJustifications(fallbackData);
        toast({
            title: "Modo Offline",
            description: "Não foi possível carregar dados recentes. Mostrando versão em cache.",
            variant: "warning"
        });
      } else {
        setError(err.message || 'Ocorreu um erro desconhecido ao carregar os dados.');
        toast({
            variant: 'destructive',
            title: 'Erro de carregamento',
            description: err.message
        });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedMonthsKey, worksiteFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize event handlers to prevent unnecessary child re-renders
  const handleActionClick = useCallback((item, type) => {
    setActionDialog({ open: true, type, item });
  }, []);

  const confirmAction = async () => {
    const { type, item } = actionDialog;
    if (!item || !type) return;

    if (!user || !user.id) {
       toast({
        variant: 'destructive',
        title: 'Erro de Permissão',
        description: 'Usuário não identificado.',
      });
      return;
    }

    setIsProcessing(true);
    const status = type === 'approve' ? 'Aprovado' : 'Rejeitado';

    try {
      const updatedItem = { 
          ...item, 
          status_validacao: status,
          validado_por: user.id,
          validator_name: user.nome || 'Admin',
          data_validacao: new Date().toISOString()
      };
      
      setJustifications(prev => prev.map(j => j.id === item.id ? updatedItem : j));

      if (isOnline) {
          const { error } = await supabase
            .from('justificação')
            .update({
              status_validacao: status,
              validado_por: user.id,
              data_validacao: new Date().toISOString()
            })
            .eq('id', item.id);

          if (error) throw error;
          
          sendApprovalNotification(item.usuario_id, 'ferias', status);
          toast({
            variant: type === 'approve' ? 'success' : 'destructive',
            title: status === 'Aprovado' ? 'Aprovado Online' : 'Rejeitado Online',
            description: t('validation.processedSuccess')
          });
      } else {
          await addPendingAction({
            type: 'UPDATE_HOLIDAY_STATUS',
            recordId: item.id,
            payload: {
                status_validacao: status,
                validado_por: user.id,
                data_validacao: new Date().toISOString()
            }
          });
          
          toast({
            title: 'Salvo Offline',
            description: 'Ação salva na fila e será sincronizada quando houver conexão.',
            variant: 'default'
          });
      }
      
      setActionDialog({ open: false, type: null, item: null });
      if (isOnline) fetchData(); 

    } catch (error) {
      console.error('Error processing action:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao processar',
        description: error.message
      });
      fetchData(); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportXLSX = async () => {
    if (!filteredAndSortedJustifications || filteredAndSortedJustifications.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para exportar.' });
      return;
    }
    
    setIsExporting(true);
    try {
      const exportData = filteredAndSortedJustifications.map(j => ({
        usuario_id: j.usuario_id,
        usuario_nome: j.usuarios?.nome || '',
        tipo_justificacao: j.tipos_justificação?.nome || '',
        dias: Array.isArray(j.dias) ? j.dias.map(d => format(new Date(d), 'yyyy-MM-dd')).join(', ') : '',
        comentario: j.comentario || '',
        status_validacao: j.status_validacao,
        data_envio: j.data_envio ? format(new Date(j.data_envio), 'yyyy-MM-dd HH:mm') : '',
        validado_por: j.validator_name || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Férias");
      XLSX.writeFile(workbook, `ferias_validacao_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (err) {
      console.error('Error exporting data:', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Ocorreu um erro ao exportar os dados.' });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDates = useCallback((dates) => {
    if (!dates || !Array.isArray(dates) || dates.length === 0) return 'N/A';
    try {
        const parsedDates = dates.map(d => {
            if (d instanceof Date) return d;
            return typeof d === 'string' ? parseISO(d) : new Date(d);
        }).filter(d => isValid(d));
        if (parsedDates.length === 0) return t('common.date') + ' inválida';
        if (parsedDates.length === 1) return format(parsedDates[0], 'dd/MM/yyyy');
        
        const sortedDates = [...parsedDates].sort((a, b) => a - b);
        const first = format(sortedDates[0], 'dd/MM/yyyy');
        const last = format(sortedDates[sortedDates.length - 1], 'dd/MM/yyyy');
        return `${first} a ${last} (${sortedDates.length} dias)`;
    } catch (e) {
        return 'Erro na data';
    }
  }, [t]);

  const getStatusBadge = useCallback((status) => {
    switch (status) {
        case 'Aprovado':
            return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">{t('validation.approved')}</Badge>;
        case 'Rejeitado':
        case 'Recusado':
            return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">{t('validation.rejected')}</Badge>;
        case 'Pendente':
        default:
            return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">{t('validation.pending')}</Badge>;
    }
  }, [t]);

  const filteredAndSortedJustifications = useMemo(() => {
    let result = [...justifications];
    
    // Filter by status
    if (statusFilter !== 'Todos') {
        const dbStatus = statusFilter === 'Recusado' ? 'Rejeitado' : statusFilter;
        result = result.filter(j => j.status_validacao === dbStatus);
    }

    // Filter by search query
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(j => 
            j.usuarios?.nome?.toLowerCase().includes(query) || 
            j.tipos_justificação?.nome?.toLowerCase().includes(query)
        );
    }

    // Sort
    if (sortConfig.key !== null) {
      result.sort((a, b) => {
        let aValue, bValue;
        if (sortConfig.key === 'nome') {
          aValue = a.usuarios?.nome || '';
          bValue = b.usuarios?.nome || '';
        } else if (sortConfig.key === 'dias') {
          aValue = (a.dias && a.dias.length > 0) ? (typeof a.dias[0] === 'string' ? parseISO(a.dias[0]) : a.dias[0]) : new Date(0);
          bValue = (b.dias && b.dias.length > 0) ? (typeof b.dias[0] === 'string' ? parseISO(b.dias[0]) : b.dias[0]) : new Date(0);
        } else if (sortConfig.key === 'data_envio') {
          aValue = new Date(a.data_envio || 0);
          bValue = new Date(b.data_envio || 0);
        } else if (sortConfig.key === 'status') {
          aValue = a.status_validacao || '';
          bValue = b.status_validacao || '';
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [justifications, statusFilter, sortConfig, searchQuery]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (authLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <>
    <OfflineSyncIndicator 
        isOnline={isOnline} 
        syncStatus={syncStatus} 
        pendingCount={pendingActions.length} 
        onRetry={syncPendingActions}
    />
    
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MonthMultiSelect
              months={monthOptions}
              selectedMonths={selectedMonths}
              onChange={setSelectedMonths}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Estados</SelectItem>
                <SelectItem value="Pendente">Pendentes</SelectItem>
                <SelectItem value="Aprovado">Aprovados</SelectItem>
                <SelectItem value="Rejeitado">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Pesquisar colaborador..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                />
            </div>
            
             <div className="flex gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Ordenar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={() => requestSort('nome')}>
                        Nome {sortConfig.key === 'nome' && (sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />)}
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => requestSort('data_envio')}>
                        Data Envio {sortConfig.key === 'data_envio' && (sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />)}
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => requestSort('dias')}>
                        Datas {sortConfig.key === 'dias' && (sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />)}
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportXLSX}
                    disabled={loading || filteredAndSortedJustifications.length === 0 || isExporting}
                    className="w-full sm:w-auto"
                >
                    {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Download
                </Button>

                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchData(true)} 
                    disabled={loading}
                    className="w-full sm:w-auto"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
             </div>
        </div>
      </div>
      
      {/* Grouped List View */}
      <div className="space-y-4">
          {loading ? (
              Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))
          ) : filteredAndSortedJustifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-muted/20 rounded-lg border-2 border-dashed">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">{t('validation.noRequests')}</h3>
                <p className="text-muted-foreground text-sm">Não há pedidos para os filtros selecionados.</p>
                <Button variant="link" onClick={() => { setStatusFilter('Todos'); setSearchQuery(''); setSelectedMonths(monthOptions.length > 0 ? [monthOptions[0]] : []); }}>
                  Limpar Filtros
                </Button>
              </div>
          ) : (
              <div className="mt-4">
                 <HolidaysEmployeeList 
                      justifications={filteredAndSortedJustifications}
                      onApprove={(i) => handleActionClick(i, 'approve')}
                      onReject={(i) => handleActionClick(i, 'reject')}
                      formatDates={formatDates}
                      getStatusBadge={getStatusBadge}
                      publicHolidays={publicHolidays}
                 />
              </div>
          )}
      </div>

      <Dialog open={actionDialog.open} onOpenChange={(open) => !isProcessing && setActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">{actionDialog.type === 'approve' ? t('validation.approveDialogTitle') : t('validation.rejectDialogTitle')}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {actionDialog.type === 'approve' 
                ? `${t('validation.approveDialogDesc')} ${actionDialog.item?.usuarios?.nome}?`
                : `${t('validation.rejectDialogDesc')} ${actionDialog.item?.usuarios?.nome}?`
              }
              {!isOnline && <p className="mt-2 text-amber-500 font-medium text-sm">Você está offline. Esta ação será sincronizada quando a conexão retornar.</p>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="border-border/50" onClick={() => setActionDialog({ open: false, type: null, item: null })} disabled={isProcessing}>{t('common.cancel')}</Button>
            <Button variant={actionDialog.type === 'approve' ? 'default' : 'destructive'} onClick={confirmAction} disabled={isProcessing} className={cn(actionDialog.type === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : '', "transition-all active:scale-95")}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionDialog.type === 'approve' ? t('validation.confirmApprove') : t('validation.confirmReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};

export default HolidaysValidationTab;