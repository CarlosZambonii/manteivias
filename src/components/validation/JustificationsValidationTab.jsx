import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Download, Search, Filter, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import JustificationsByUserList from '@/components/justifications/JustificationsByUserList';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { sendApprovalNotification } from '@/services/NotificationService';
import { useLanguage } from '@/hooks/useLanguage';

const JustificationsValidationTab = ({ worksiteFilter }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [worksites, setWorksites] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState({
    worksiteId: 'all',
    status: 'Pendente',
    month: new Date(),
  });

  // Extract primitive values to prevent infinite loops in useCallback
  const filterWorksiteId = filters.worksiteId;
  const filterStatus = filters.status;
  const filterMonthTime = filters.month.getTime();

  const fetchJustifications = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const currentMonth = new Date(filterMonthTime);
      const fromDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const toDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      // Update query to include avatar_url
      let query = supabase
        .from('justificação')
        .select('*, usuarios:usuario_id(id, nome, avatar_url), tipos_justificação(nome)')
        .gte('data_envio', fromDate)
        .lte('data_envio', toDate)
        .order('data_envio', { ascending: false });

      if (filterStatus !== 'Todos') {
        query = query.eq('status_validacao', filterStatus);
      }

      let worksiteQuery = supabase.from('obras').select('id, nome');
      if (worksiteFilter) worksiteQuery = worksiteQuery.in('id', worksiteFilter);
      
      const { data: worksitesData, error: worksitesError } = await worksiteQuery;
      if (worksitesError) throw worksitesError;
      setWorksites(worksitesData || []);

      const worksiteIds = filterWorksiteId === 'all'
        ? (worksiteFilter || (worksitesData || []).map(w => w.id))
        : [parseInt(filterWorksiteId)];
      
      if (worksiteIds && worksiteIds.length > 0) {
          const { data: userIdsInWorksite, error: usersError } = await supabase
              .from('registros_ponto')
              .select('usuario_id')
              .in('obra_id', worksiteIds);

          if (usersError) throw usersError;
          const uniqueUserIds = [...new Set(userIdsInWorksite.map(u => u.usuario_id))];
          
          if (uniqueUserIds.length > 0) {
              query = query.in('usuario_id', uniqueUserIds);
          } else {
              setJustifications([]);
              setIsLoading(false);
              setIsRefreshing(false);
              return;
          }
      } else if (worksiteIds && worksiteIds.length === 0) {
          setJustifications([]);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
      }

      const { data, error } = await query;
      if (error) throw error;
      setJustifications(data || []);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível carregar as justificações: ${error.message}` });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, filterWorksiteId, filterStatus, filterMonthTime, worksiteFilter, toast]);

  useEffect(() => {
    fetchJustifications();
  }, [fetchJustifications]);

  const handleUpdateStatus = async (justification, status, comment = null) => {
    try {
      const updateData = {
        status_validacao: status,
        validado_por: user.id,
        data_validacao: new Date().toISOString(),
      };
      if (status === 'Rejeitado' && comment) {
        updateData.rejeicao_comentario = comment;
      }

      const { error } = await supabase
        .from('justificação')
        .update(updateData)
        .eq('id', justification.id);

      if (error) throw error;

      sendApprovalNotification(justification.usuario_id, 'justificacao', status, comment || '');
      setJustifications(prev => prev.map(j =>
        j.id === justification.id ? { ...j, ...updateData } : j
      ));
      toast({
        variant: 'success',
        title: status === 'Aprovado' ? 'Justificação Aprovada' : 'Justificação Rejeitada',
      });
      fetchJustifications(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o estado.' });
      throw error;
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
    if (!justifications || justifications.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para exportar.' });
      return;
    }

    const exportData = justifications.map(j => ({
      usuario_id: j.usuario_id,
      usuario_nome: j.usuarios?.nome || '',
      tipo_justificacao: j.tipos_justificação?.nome || '',
      dias: Array.isArray(j.dias) ? j.dias.join(', ') : '',
      comentario: j.comentario || '',
      status_validacao: j.status_validacao,
      data_envio: j.data_envio ? format(new Date(j.data_envio), 'yyyy-MM-dd HH:mm') : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Justificações");
    const filename = `justificacoes_validacao_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };
  
  const monthOptions = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
  const worksiteOptions = [
    { value: 'all', label: t('common.allWorksites') },
    ...worksites.map(w => ({ value: String(w.id), label: `${w.id} - ${w.nome}` }))
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 py-6">
      <div className="bg-card p-6 rounded-xl border shadow-sm space-y-6 mb-8">
        <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Filter className="h-5 w-5 text-primary" />
                <h2>{t('validation.searchFilters')}</h2>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleExportXLSX}
                disabled={isLoading || justifications.length === 0}
            >
                <Download className="h-4 w-4 mr-2" />
                {t('common.download')}
            </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">{t('validation.worksiteFilter')}</label>
                <Combobox
                    options={worksiteOptions}
                    value={filters.worksiteId}
                    onChange={(v) => handleFilterChange('worksiteId', v)}
                    placeholder={t('common.allWorksites')}
                    searchPlaceholder={t('common.search')}
                    noResultsText={t('common.noWorksite')}
                    className="w-full"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">{t('validation.statusFilter')}</label>
                <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                  <SelectTrigger><SelectValue placeholder={t('validation.statusFilter')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">{t('validation.allStatus')}</SelectItem>
                    <SelectItem value="Pendente">{t('validation.pendingStatus')}</SelectItem>
                    <SelectItem value="Aprovado">{t('validation.approvedStatus')}</SelectItem>
                    <SelectItem value="Rejeitado">{t('validation.rejectedStatus')}</SelectItem>
                  </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase">{t('validation.monthFilter')}</label>
                <Select value={format(filters.month, 'yyyy-MM')} onValueChange={(v) => handleFilterChange('month', v)}>
                  <SelectTrigger><SelectValue placeholder={t('validation.monthFilter')} /></SelectTrigger>
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
                <label className="text-xs font-medium text-muted-foreground uppercase">{t('validation.searchFilter')}</label>
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.searchEmployee')}
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
                onClick={() => fetchJustifications(true)} 
                disabled={isLoading || isRefreshing}
                className="w-full sm:w-auto min-w-[120px]"
            >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? t('validation.refreshing') : t('validation.refreshData')}
            </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-xl border border-border/50" />
            ))}
        </div>
      ) : (
        <div className="space-y-8">
            <JustificationsByUserList 
                justifications={justifications} 
                searchQuery={searchQuery}
                onUpdateStatus={handleUpdateStatus} 
                isLoading={false}
            />
        </div>
      )}
    </div>
  );
};

export default JustificationsValidationTab;