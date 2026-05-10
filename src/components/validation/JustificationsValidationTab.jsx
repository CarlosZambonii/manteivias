import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import JustificationsByUserList from '@/components/justifications/JustificationsByUserList';
import { Combobox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { sendApprovalNotification } from '@/services/NotificationService';
import { useLanguage } from '@/hooks/useLanguage';
import { useAvailableMonths } from '@/hooks/useAvailableMonths';
import MonthMultiSelect from '@/components/ui/MonthMultiSelect';
import EditJustificationModal from '@/components/justifications/EditJustificationModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const JustificationsValidationTab = ({ worksiteFilter }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [worksites, setWorksites] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingJustification, setEditingJustification] = useState(null);
  const [deletingJustification, setDeletingJustification] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState({
    worksiteId: 'all',
    status: 'Pendente',
  });
  const [selectedMonths, setSelectedMonths] = useState([]);

  const filterWorksiteId = filters.worksiteId;
  const filterStatus = filters.status;
  const selectedMonthsKey = selectedMonths.map(m => format(m, 'yyyy-MM')).sort().join(',');

  const monthOptions = useAvailableMonths('justificação', 'data_envio');

  useEffect(() => {
    if (monthOptions.length > 0 && selectedMonths.length === 0) {
      setSelectedMonths([monthOptions[0]]);
    }
  }, [monthOptions]);

  const fetchJustifications = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    if (selectedMonths.length === 0) {
      setJustifications([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const sorted = [...selectedMonths].sort((a, b) => a - b);
      const fromDate = format(startOfMonth(sorted[0]), 'yyyy-MM-dd');
      const toDate = format(endOfMonth(sorted[sorted.length - 1]), 'yyyy-MM-dd');

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

      const selectedKeys = new Set(selectedMonths.map(m => format(m, 'yyyy-MM')));
      const filtered = (data || []).filter(r =>
        r.data_envio && selectedKeys.has(r.data_envio.substring(0, 7))
      );

      setJustifications(filtered);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível carregar as justificações: ${error.message}` });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, filterWorksiteId, filterStatus, selectedMonthsKey, worksiteFilter, toast]);

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

  const handleEdit = (justification) => setEditingJustification(justification);

  const handleDelete = (justification) => setDeletingJustification(justification);

  const confirmDelete = async () => {
    if (!deletingJustification) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('justificação')
        .delete()
        .eq('id', deletingJustification.id);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Justificação apagada com sucesso.' });
      setDeletingJustification(null);
      fetchJustifications(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao apagar justificação: ' + error.message });
    } finally {
      setIsDeleting(false);
    }
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
    XLSX.writeFile(workbook, `justificacoes_validacao_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const worksiteOptions = [
    { value: 'all', label: t('common.allWorksites') },
    ...worksites.map(w => ({ value: String(w.id), label: `${w.id} - ${w.nome}` }))
  ];

  return (
    <>
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Combobox
            options={worksiteOptions}
            value={filters.worksiteId}
            onChange={(v) => setFilters(prev => ({ ...prev, worksiteId: v }))}
            placeholder={t('common.allWorksites')}
            searchPlaceholder={t('common.search')}
            noResultsText={t('common.noWorksite')}
            className="w-full"
          />
          <MonthMultiSelect
            months={monthOptions}
            selectedMonths={selectedMonths}
            onChange={setSelectedMonths}
          />
          <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
            <SelectTrigger><SelectValue placeholder={t('validation.statusFilter')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">{t('validation.allStatus')}</SelectItem>
              <SelectItem value="Pendente">{t('validation.pendingStatus')}</SelectItem>
              <SelectItem value="Aprovado">{t('validation.approvedStatus')}</SelectItem>
              <SelectItem value="Rejeitado">{t('validation.rejectedStatus')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <Input
            placeholder={t('common.searchEmployee')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleExportXLSX} disabled={isLoading || justifications.length === 0} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => fetchJustifications(true)} disabled={isLoading || isRefreshing} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />Atualizar
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : justifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-muted/20 rounded-lg border-2 border-dashed">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma justificação encontrada</h3>
          <p className="text-muted-foreground text-sm">Não há justificações correspondentes aos filtros selecionados.</p>
          <Button variant="link" onClick={() => { setFilters(prev => ({ ...prev, status: 'Todos' })); setSearchQuery(''); setSelectedMonths(monthOptions.length > 0 ? [monthOptions[0]] : []); }}>
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <JustificationsByUserList
          justifications={justifications}
          searchQuery={searchQuery}
          onUpdateStatus={handleUpdateStatus}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={false}
        />
      )}
    </div>

      {editingJustification && (
        <EditJustificationModal
          isOpen={!!editingJustification}
          onOpenChange={(open) => !open && setEditingJustification(null)}
          justification={editingJustification}
          onSuccess={() => { setEditingJustification(null); fetchJustifications(true); }}
        />
      )}

      <AlertDialog open={!!deletingJustification} onOpenChange={(open) => !open && setDeletingJustification(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar justificação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. A justificação será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? 'A apagar...' : 'Apagar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default JustificationsValidationTab;
