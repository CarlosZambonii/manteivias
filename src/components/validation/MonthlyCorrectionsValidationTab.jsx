import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, Check, X, User, Calendar, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth, endOfMonth, format, parseISO, addHours } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import * as XLSX from 'xlsx';
import { sendApprovalNotification } from '@/services/NotificationService';
import { useLanguage } from '@/hooks/useLanguage';
import { useAvailableMonths } from '@/hooks/useAvailableMonths';
import MonthMultiSelect from '@/components/ui/MonthMultiSelect';

const getStatusVariant = (status) => {
  switch (status) {
    case 'Aprovado': return 'success';
    case 'Rejeitado': return 'destructive';
    default: return 'secondary';
  }
};

const MonthlyCorrectionsValidationTab = ({ worksiteFilter }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [corrections, setCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    employeeId: 'all',
    status: 'Pendente',
  });
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmApproveId, setConfirmApproveId] = useState(null);

  const filterEmployeeId = filters.employeeId;
  const filterStatus = filters.status;
  const selectedMonthsKey = selectedMonths.map(m => format(m, 'yyyy-MM')).sort().join(',');

  const monthOptions = useAvailableMonths('correcoes_mensais', 'mes');

  useEffect(() => {
    if (monthOptions.length > 0 && selectedMonths.length === 0) {
      setSelectedMonths([monthOptions[0]]);
    }
  }, [monthOptions]);

  const fetchEmployees = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.from('usuarios').select('id, nome').eq('status', 'Ativo');
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [user?.id]);

  const fetchCorrections = useCallback(async (isRefresh = false) => {
    if (selectedMonths.length === 0) {
      setCorrections([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      if (worksiteFilter && worksiteFilter.length === 0) {
          setCorrections([]);
          return;
      }

      const sorted = [...selectedMonths].sort((a, b) => a - b);
      const fromDate = format(startOfMonth(sorted[0]), 'yyyy-MM-dd');
      const toDate = format(endOfMonth(sorted[sorted.length - 1]), 'yyyy-MM-dd');

      let query = supabase
        .from('correcoes_mensais')
        .select(`
          *,
          usuario:usuarios!correcoes_mensais_usuario_id_fkey(id, nome),
          alocacoes:correcoes_mensais_alocacoes(
            obra_id,
            percentagem,
            obra:obras(nome)
          )
        `)
        .gte('mes', fromDate)
        .lte('mes', toDate)
        .order('data_solicitacao', { ascending: false });

      if (filterEmployeeId !== 'all') {
        query = query.eq('usuario_id', filterEmployeeId);
      }

      if (filterStatus !== 'Todos') {
        query = query.eq('status', filterStatus);
      }

      let { data, error } = await query;
      if (error) throw error;

      if (worksiteFilter && data) {
         data = data.filter(c => c.alocacoes?.some(a => worksiteFilter.includes(a.obra_id)));
      }

      const selectedKeys = new Set(selectedMonths.map(m => format(m, 'yyyy-MM')));
      const filtered = (data || []).filter(r =>
        r.mes && selectedKeys.has(r.mes.substring(0, 7))
      );

      setCorrections(filtered);
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('corrections.monthlyError') });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filterEmployeeId, filterStatus, selectedMonthsKey, worksiteFilter, toast, t]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('correcoes_mensais')
        .update({ status: newStatus, validado_por: user.id, data_validacao: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      const correction = corrections.find(c => c.id === id);
      if (correction && newStatus === 'Aprovado') {
        const { error: deleteError } = await supabase
          .from('registros_mensais')
          .delete()
          .eq('usuario_id', correction.usuario_id)
          .eq('mes', correction.mes);
        if (deleteError) throw deleteError;
      }
      if (correction) {
        sendApprovalNotification(correction.usuario_id, 'correcao_mensal', newStatus);
      }
      toast({ variant: 'success', title: newStatus === 'Aprovado' ? t('corrections.monthlyApproved') : t('corrections.monthlyRejected') });
      fetchCorrections(true);
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: error.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportXLSX = async () => {
    if (!corrections || corrections.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para exportar.' });
      return;
    }
    setIsExporting(true);
    try {
      const exportData = corrections.map(c => ({
        usuario_id: c.usuario_id,
        usuario_nome: c.usuario?.nome || '',
        mes_referencia: c.mes ? format(addHours(parseISO(c.mes), 12), 'MM/yyyy') : '',
        data_solicitacao: c.data_solicitacao ? format(new Date(c.data_solicitacao), 'yyyy-MM-dd HH:mm') : '',
        alocacoes: c.alocacoes?.map(a => `${a.obra?.nome} (${a.percentagem}%)`).join('; ') || '',
        status: c.status,
        validado_por: c.validado_por || '',
        data_validacao: c.data_validacao ? format(new Date(c.data_validacao), 'yyyy-MM-dd HH:mm') : ''
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Correcoes_Mensais");
      XLSX.writeFile(workbook, `correcoes_mensais_validacao_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Ocorreu um erro ao exportar os dados.' });
    } finally {
      setIsExporting(false);
    }
  };

  const employeeOptions = [
    { value: 'all', label: 'Todos os Colaboradores' },
    ...employees.map(e => ({ value: String(e.id), label: e.nome }))
  ];

  const filteredCorrections = searchQuery
    ? corrections.filter(c => c.usuario?.nome?.toLowerCase().includes(searchQuery.toLowerCase()))
    : corrections;

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-lg border shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Combobox
            options={employeeOptions}
            value={filters.employeeId}
            onChange={(v) => setFilters(prev => ({ ...prev, employeeId: v }))}
            placeholder="Filtrar por colaborador..."
            searchPlaceholder="Procurar colaborador..."
            noResultsText="Nenhum colaborador encontrado."
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
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Aprovado">Aprovado</SelectItem>
              <SelectItem value="Rejeitado">Rejeitado</SelectItem>
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
            <Button variant="outline" size="sm" onClick={handleExportXLSX} disabled={isLoading || corrections.length === 0 || isExporting} className="w-full sm:w-auto">
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Download
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
      ) : filteredCorrections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-muted/20 rounded-lg border-2 border-dashed">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma correção mensal encontrada</h3>
          <p className="text-muted-foreground text-sm">Não há correções mensais correspondentes aos filtros selecionados.</p>
          <Button variant="link" onClick={() => { setFilters(prev => ({ ...prev, status: 'Todos', employeeId: 'all' })); setSearchQuery(''); setSelectedMonths(monthOptions.length > 0 ? [monthOptions[0]] : []); }}>
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Mês Referência</TableHead>
                <TableHead>Data Solicitação</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCorrections.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{c.usuario?.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-muted-foreground" />
                       <span>{format(addHours(parseISO(c.mes), 12), 'MM/yyyy')}</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(c.data_solicitacao), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {c.alocacoes?.map((a, idx) => (
                        <div key={idx} className="flex justify-between w-full max-w-[200px]">
                           <span className="truncate pr-2">{a.obra?.nome}</span>
                           <span className="font-mono text-xs">{a.percentagem}%</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={getStatusVariant(c.status)}>{c.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    {c.status === 'Pendente' && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="success" onClick={() => setConfirmApproveId(c.id)} disabled={updatingId === c.id}>
                          {updatingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(c.id, 'Rejeitado')} disabled={updatingId === c.id}>
                          {updatingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!confirmApproveId} onOpenChange={(open) => { if (!open) setConfirmApproveId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmar Aprovação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ao aprovar esta correção mensal, o registo mensal original do colaborador será <strong>eliminado permanentemente</strong> e substituído pelos novos dados. Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => { handleUpdateStatus(confirmApproveId, 'Aprovado'); setConfirmApproveId(null); }}
            >
              Confirmar Aprovação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MonthlyCorrectionsValidationTab;
