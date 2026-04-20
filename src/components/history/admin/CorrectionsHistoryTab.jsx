import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Check, X, Loader2, AlertCircle, User, ArrowUpDown, Download, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useOfflineManager } from '@/contexts/OfflineManager';
import * as XLSX from 'xlsx';

const formatDate = (dateString) => dateString ? format(parseISO(dateString), 'dd/MM/yyyy', { locale: pt }) : '-';
const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : '-';

const getStatusVariant = (status) => ({ 'Aprovado': 'success', 'Rejeitado': 'destructive' }[status] || 'secondary');

const CorrectionsHistoryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOfflineManager();
  const [corrections, setCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [worksites, setWorksites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [filters, setFilters] = useState({
    worksiteId: 'all',
    employeeId: 'all',
    status: 'Todos',
    month: new Date(),
    type: 'diaria',
  });
  const [sortConfig, setSortConfig] = useState({ key: 'data_solicitacao', direction: 'descending' });

  // Extract primitive values from filters state to prevent infinite loops in useCallback
  const filterWorksiteId = filters.worksiteId;
  const filterEmployeeId = filters.employeeId;
  const filterStatus = filters.status;
  const filterType = filters.type;
  const filterMonthTime = filters.month.getTime();

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedCorrections = useMemo(() => {
    let sortableItems = [...corrections];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        switch (sortConfig.key) {
          case 'usuario':
            aValue = a.usuarios?.nome || a.usuario?.nome || '';
            bValue = b.usuarios?.nome || b.usuario?.nome || '';
            break;
          case 'obra':
            aValue = a.obras?.nome || '';
            bValue = b.obras?.nome || '';
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [corrections, sortConfig]);

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30 inline-block" />;
    return <ArrowUpDown className="ml-2 h-4 w-4 inline-block" />;
  };

  const fetchFiltersData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: worksitesData, error: worksitesError } = await supabase.from('obras').select('id, nome').eq('encarregado_id', user.id);
      if (worksitesError) throw worksitesError;
      setWorksites(worksitesData || []);

      const { data: employeesData, error: employeesError } = await supabase.rpc('get_all_employees_with_justifications', { admin_id: user.id });
      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar filtros', description: error.message });
    }
  }, [user?.id, toast]);

  const fetchCorrections = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = startOfMonth(new Date(filterMonthTime));
      const toDate = endOfMonth(new Date(filterMonthTime));
      let allCorrections = [];

      if (filterType === 'diaria') {
        let query = supabase.from('correcoes_ponto').select(`*, usuarios!inner(nome), obras!inner(id, nome)`).gte('data_solicitacao', fromDate.toISOString()).lte('data_solicitacao', toDate.toISOString());
        if (filterWorksiteId !== 'all') query = query.eq('obras.id', filterWorksiteId);
        else {
          const worksiteIds = worksites.map(w => w.id);
          if (worksiteIds.length > 0) query = query.in('obra_id', worksiteIds);
        }
        if (filterEmployeeId !== 'all') query = query.eq('usuario_id', filterEmployeeId);
        if (filterStatus !== 'Todos') query = query.eq('status', filterStatus);
        const { data, error } = await query;
        if (error) throw error;
        allCorrections = data.map(c => ({...c, isMonthly: false})) || [];
      } else { // Mensal
        const userIds = filterEmployeeId !== 'all' ? [filterEmployeeId] : employees.map(e => e.id);
        if (userIds.length > 0) {
            let query = supabase.from('correcoes_mensais').select(`*, usuario:usuarios!inner(id, nome)`).gte('mes', format(fromDate, 'yyyy-MM-dd')).lte('mes', format(toDate, 'yyyy-MM-dd')).in('usuario_id', userIds);
            if (filterStatus !== 'Todos') query = query.eq('status', filterStatus);
            const { data, error } = await query;
            if (error) throw error;
            allCorrections = data.map(c => ({...c, isMonthly: true})) || [];
        }
      }
      setCorrections(allCorrections);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as correções.' });
    } finally {
      setIsLoading(false);
    }
  }, [filterWorksiteId, filterEmployeeId, filterStatus, filterType, filterMonthTime, worksites, employees, toast]);
  
  useEffect(() => { fetchFiltersData(); }, [fetchFiltersData]);
  useEffect(() => { fetchCorrections(); }, [fetchCorrections]);

  const handleFilterChange = (key, value) => {
    if (key === 'month') {
      const [year, month] = value.split('-').map(Number);
      value = new Date(year, month - 1, 15);
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdateStatus = async (correction, newStatus) => {
    if (!isOnline) {
      toast({ variant: 'destructive', title: 'Ação indisponível', description: 'Não é possível atualizar o status offline.' });
      return;
    }

    setUpdatingId(correction.id);
    try {
      const table = correction.isMonthly ? 'correcoes_mensais' : 'correcoes_ponto';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ 
            status: newStatus,
            validado_por: user.id,
            data_validacao: new Date().toISOString()
        })
        .eq('id', correction.id);
        
      if (updateError) throw updateError;

      // When daily correction is approved, cancel the associated original record if it exists
      if (newStatus === 'Aprovado' && !correction.isMonthly && correction.registro_ponto_id) {
          const { error: recordError } = await supabase
              .from('registros_ponto')
              .update({ status_validacao: 'Cancelado pela Correção' })
              .eq('id', correction.registro_ponto_id);
              
          if (recordError) {
              console.error("Erro ao cancelar registo original:", recordError);
              toast({ 
                  variant: 'destructive', 
                  title: 'Aviso', 
                  description: 'Correção aprovada, mas houve erro ao cancelar o registo original.' 
              });
              fetchCorrections();
              setUpdatingId(null);
              return;
          }
      }

      toast({ 
          title: 'Sucesso', 
          description: `Correção ${newStatus.toLowerCase()} com sucesso.` 
      });
      fetchCorrections();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportXLSX = () => {
    if (!isOnline) {
      toast({ variant: 'destructive', title: 'Modo Offline', description: 'A exportação requer ligação à internet.' });
      return;
    }
    if (!sortedCorrections || sortedCorrections.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para exportar.' });
      return;
    }

    const exportData = sortedCorrections.map(c => ({
      tipo: c.isMonthly ? 'Mensal' : 'Diária',
      colaborador: c.usuarios?.nome || c.usuario?.nome || 'N/A',
      data_solicitacao: c.data_solicitacao ? format(parseISO(c.data_solicitacao), 'yyyy-MM-dd HH:mm') : '',
      data_referencia: c.isMonthly ? format(parseISO(c.mes), 'yyyy-MM') : (c.data_correcao ? format(parseISO(c.data_correcao), 'yyyy-MM-dd') : ''),
      hora_inicio: !c.isMonthly ? c.hora_inicio_sugerida || '' : '',
      hora_fim: !c.isMonthly ? c.hora_fim_sugerida || '' : '',
      obra: !c.isMonthly && c.obras ? `${c.obras.id} - ${c.obras.nome}` : '',
      status: c.status || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Correções");
    XLSX.writeFile(workbook, `historico_correcoes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const monthOptions = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));

  const renderDesktopRow = (c) => (
    <TableRow key={c.id}>
      <TableCell><Badge variant="outline">{c.isMonthly ? 'Mensal' : 'Diária'}</Badge></TableCell>
      <TableCell>{c.usuarios?.nome || c.usuario?.nome || 'N/A'}</TableCell>
      <TableCell>{formatDate(c.data_solicitacao)}</TableCell>
      <TableCell>{c.isMonthly ? format(parseISO(c.mes), 'MM/yyyy') : formatDate(c.data_correcao)}</TableCell>
      <TableCell>{c.isMonthly ? '-' : `${formatTime(c.hora_inicio_sugerida)} - ${formatTime(c.hora_fim_sugerida)}`}</TableCell>
      <TableCell>{c.isMonthly ? 'N/A' : (c.obras ? <span title={c.obras.nome}>{c.obras.id} - {c.obras.nome}</span> : 'N/A')}</TableCell>
      <TableCell><Badge variant={getStatusVariant(c.status)}>{c.status}</Badge></TableCell>
      <TableCell className="text-right">
        {c.status === 'Pendente' ? (
          <div className="flex justify-end gap-1.5">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleUpdateStatus(c, 'Aprovado')} disabled={updatingId === c.id} title="Aprovar">
               {updatingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleUpdateStatus(c, 'Rejeitado')} disabled={updatingId === c.id} title="Rejeitar">
               {updatingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
          </div>
        ) : <span className="text-muted-foreground text-sm">-</span>}
      </TableCell>
    </TableRow>
  );

  const renderMobileCard = (c) => (
    <Card key={c.id} className="shadow-sm overflow-hidden border-l-4" style={{ borderLeftColor: c.status === 'Aprovado' ? '#22c55e' : c.status === 'Rejeitado' ? '#ef4444' : '#eab308' }}>
      <div className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-2">
             <div className="flex items-start gap-2">
                 <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                 <div>
                     <h4 className="font-semibold text-sm line-clamp-1">{c.usuarios?.nome || c.usuario?.nome}</h4>
                     <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                         <CalendarDays className="h-3 w-3" />
                         Ref: {c.isMonthly ? format(parseISO(c.mes), 'MMMM yyyy', {locale: pt}) : formatDate(c.data_correcao)}
                     </p>
                 </div>
             </div>
             <Badge variant={getStatusVariant(c.status)} className="text-[10px] shrink-0">{c.status}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
              <div className="flex flex-col">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">{c.isMonthly ? 'Mensal' : 'Diária'}</span>
              </div>
              <div className="flex flex-col">
                  <span className="text-muted-foreground">Pedido em</span>
                  <span className="font-medium">{formatDate(c.data_solicitacao)}</span>
              </div>
              {!c.isMonthly && (
                 <>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground">Horário</span>
                        <span className="font-mono font-medium">{formatTime(c.hora_inicio_sugerida)} - {formatTime(c.hora_fim_sugerida)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-muted-foreground">Obra</span>
                        <span className="font-medium truncate" title={c.obras?.nome}>{c.obras ? c.obras.nome : 'N/A'}</span>
                    </div>
                 </>
              )}
          </div>
          {c.status === 'Pendente' && (
            <div className="flex gap-2 mt-2 pt-3 border-t">
              <Button size="sm" variant="outline" className="flex-1 text-green-600 hover:bg-green-50" onClick={() => handleUpdateStatus(c, 'Aprovado')} disabled={updatingId === c.id}>
                {updatingId === c.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1"/>} Aprovar
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => handleUpdateStatus(c, 'Rejeitado')} disabled={updatingId === c.id}>
                {updatingId === c.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <X className="h-4 w-4 mr-1"/>} Rejeitar
              </Button>
            </div>
          )}
      </div>
    </Card>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col gap-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
              <SelectTrigger className="h-11 md:h-10"><SelectValue placeholder="Tipo..." /></SelectTrigger>
              <SelectContent><SelectItem value="diaria">Diária</SelectItem><SelectItem value="mensal">Mensal</SelectItem></SelectContent>
            </Select>
            {filters.type === 'diaria' && <Select value={filters.worksiteId} onValueChange={(v) => handleFilterChange('worksiteId', v)}>
              <SelectTrigger className="h-11 md:h-10"><SelectValue placeholder="Obra..." /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas as Obras</SelectItem>{worksites.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.id} - {w.nome}</SelectItem>)}</SelectContent>
            </Select>}
            <Select value={filters.employeeId} onValueChange={(v) => handleFilterChange('employeeId', v)}>
              <SelectTrigger className="h-11 md:h-10"><SelectValue placeholder="Colaborador..." /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos</SelectItem>{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="h-11 md:h-10"><SelectValue placeholder="Estado..." /></SelectTrigger>
              <SelectContent><SelectItem value="Todos">Todos</SelectItem><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Aprovado">Aprovado</SelectItem><SelectItem value="Rejeitado">Rejeitado</SelectItem></SelectContent>
            </Select>
            <Select value={format(filters.month, 'yyyy-MM')} onValueChange={(v) => handleFilterChange('month', v)}>
              <SelectTrigger className="h-11 md:h-10"><SelectValue placeholder="Mês..." /></SelectTrigger>
              <SelectContent>{monthOptions.map(m => (<SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>{format(m, 'MMMM yyyy', { locale: pt })}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleExportXLSX}
                disabled={!isOnline || sortedCorrections.length === 0}
                className={`w-full md:w-auto h-11 md:h-10 px-4 ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!isOnline ? "A exportação requer ligação à internet" : "Exportar para XLSX"}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
          </div>
      </div>

      {isLoading ? <div className="flex justify-center h-64 items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : sortedCorrections.length === 0 ? <div className="text-center h-64 flex flex-col items-center justify-center p-4 border border-dashed rounded-lg bg-muted/20"><AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" /><h3 className="font-semibold text-lg">Nenhuma correção encontrada</h3><p className="text-sm text-muted-foreground mt-1">Não há correções para os filtros selecionados.</p></div> : (
        <>
          <div className="rounded-lg border overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => requestSort('isMonthly')} className="cursor-pointer">Tipo{renderSortArrow('isMonthly')}</TableHead>
                  <TableHead onClick={() => requestSort('usuario')} className="cursor-pointer">Colaborador{renderSortArrow('usuario')}</TableHead>
                  <TableHead onClick={() => requestSort('data_solicitacao')} className="cursor-pointer">Data Pedido{renderSortArrow('data_solicitacao')}</TableHead>
                  <TableHead onClick={() => requestSort('data_correcao')} className="cursor-pointer">Data Ref.{renderSortArrow('data_correcao')}</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead onClick={() => requestSort('obra')} className="cursor-pointer">Obra{renderSortArrow('obra')}</TableHead>
                  <TableHead onClick={() => requestSort('status')} className="cursor-pointer">Status{renderSortArrow('status')}</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{sortedCorrections.map(renderDesktopRow)}</TableBody>
            </Table>
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">{sortedCorrections.map(renderMobileCard)}</div>
        </>
      )}
    </motion.div>
  );
};

export default CorrectionsHistoryTab;