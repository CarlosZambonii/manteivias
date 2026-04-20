import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Check, X, BadgePercent, Building, User, ArrowUpDown, Download } from 'lucide-react';
import { startOfMonth, endOfMonth, format, subMonths, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useOfflineManager } from '@/contexts/OfflineManager';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';

const getStatusVariant = (status) => {
  switch (status) {
    case 'Aprovado':
      return 'success';
    case 'Rejeitado':
      return 'destructive';
    case 'Pendente':
    default:
      return 'secondary';
  }
};

const groupRecords = (records, cancelledCombos = new Set()) => {
  if (!records || records.length === 0) return [];

  const grouped = records.reduce((acc, record) => {
    if (!record.usuario) return acc;

    const key = `${record.usuario_id}|${record.mes}`;
    if (!acc[key]) {
      acc[key] = {
        key: key,
        usuario_id: record.usuario_id,
        usuario_nome: record.usuario?.nome || 'Nome Indisponível',
        mes: record.mes,
        data_submissao: record.data_submissao,
        status_validacao: record.status_validacao,
        validado_por: record.validado_por,
        data_validacao: record.data_validacao || record.updated_at,
        is_correction: cancelledCombos.has(key),
        allocations: [],
      };
    }
    acc[key].allocations.push({
      obra_id: record.obra_id,
      obra_nome: record.obra?.nome || 'Obra Indisponível',
      percentagem: record.percentagem,
    });
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => new Date(b.data_submissao) - new Date(a.data_submissao));
};

const MonthlyValidationTab = ({ worksiteFilter }) => {
  const { user, isReadOnlyAdmin } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOfflineManager();
  const [groupedRecords, setGroupedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'Pendente',
    month: new Date(),
  });
  const [sortConfig, setSortConfig] = useState({ key: 'usuario_nome', direction: 'ascending' });

  // Primitives
  const filterStatus = filters.status;
  const filterMonthTime = filters.month.getTime();

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedGroupedRecords = useMemo(() => {
    let sortableItems = [...groupedRecords];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [groupedRecords, sortConfig]);

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const fetchMonthlyRecords = useCallback(async () => {
    setIsLoading(true);
    try {
        const currentMonth = new Date(filterMonthTime);
        const fromDate = startOfMonth(currentMonth);
        const toDate = endOfMonth(currentMonth);

        let query = supabase
            .from('registros_mensais')
            .select('*, usuario:usuarios!registros_mensais_usuario_id_fkey(id, nome), obra:obras(id, nome)')
            .gte('mes', format(fromDate, 'yyyy-MM-dd'))
            .lte('mes', format(toDate, 'yyyy-MM-dd'))
            .order('data_submissao', { ascending: false });

        if (worksiteFilter) {
            if (worksiteFilter.length === 0) {
                setGroupedRecords([]);
                setIsLoading(false);
                return;
            }
            query = query.in('obra_id', worksiteFilter);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Detect cancelled records to flag corrections
        const cancelledCombos = new Set();
        if (data) {
            data.forEach(r => {
                if (r.status_validacao === 'Cancelado') {
                    cancelledCombos.add(`${r.usuario_id}|${r.mes}`);
                }
            });
        }

        // Filter out cancelled records and apply selected status filter locally
        let filteredData = (data || []).filter(r => r.status_validacao !== 'Cancelado');
        
        if (filterStatus !== 'Todos') {
            filteredData = filteredData.filter(r => r.status_validacao === filterStatus);
        }

        setGroupedRecords(groupRecords(filteredData, cancelledCombos));
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar registos mensais', description: error.message });
        setGroupedRecords([]);
    } finally {
        setIsLoading(false);
    }
  }, [filterStatus, filterMonthTime, worksiteFilter, toast]);

  useEffect(() => {
    fetchMonthlyRecords();
  }, [fetchMonthlyRecords]);

  const handleUpdateStatus = async (recordKey, newStatus) => {
    setUpdatingId(recordKey);
    const [userId, monthStr] = recordKey.split('|');
    
    try {
      const updatePayload = { 
        status_validacao: newStatus, 
        validado_por: user.id
      };

      const { error } = await supabase
        .from('registros_mensais')
        .update(updatePayload)
        .eq('usuario_id', userId)
        .eq('mes', monthStr)
        .neq('status_validacao', 'Cancelado');

      if (error) throw error;
      toast({ variant: 'success', title: `Registo ${newStatus === 'Aprovado' ? 'aprovado' : 'rejeitado'}!` });
      fetchMonthlyRecords();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar estado', description: error.message });
    } finally {
      setUpdatingId(null);
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
    if (!isOnline) {
      toast({ variant: 'destructive', title: 'Modo Offline', description: 'A exportação requer ligação à internet.' });
      return;
    }
    if (!sortedGroupedRecords || sortedGroupedRecords.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para exportar.' });
      return;
    }

    const exportData = [];
    sortedGroupedRecords.forEach(r => {
      if (r.allocations && r.allocations.length > 0) {
        r.allocations.forEach(a => {
          exportData.push({
            usuario_id: r.usuario_id,
            usuario_nome: r.usuario_nome,
            mes: r.mes,
            status_validacao: r.status_validacao,
            tipo_registo: r.is_correction ? 'Correção' : 'Padrão',
            validado_por: r.validado_por || '',
            data_validacao: r.data_validacao ? format(new Date(r.data_validacao), 'yyyy-MM-dd HH:mm') : '',
            obra_id: a.obra_id,
            obra_nome: a.obra_nome,
            percentagem: a.percentagem
          });
        });
      } else {
        exportData.push({
            usuario_id: r.usuario_id,
            usuario_nome: r.usuario_nome,
            mes: r.mes,
            status_validacao: r.status_validacao,
            tipo_registo: r.is_correction ? 'Correção' : 'Padrão',
            validado_por: r.validado_por || '',
            data_validacao: r.data_validacao ? format(new Date(r.data_validacao), 'yyyy-MM-dd HH:mm') : '',
            obra_id: '',
            obra_nome: '',
            percentagem: ''
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registos Mensais");
    const filename = `registos_mensais_validacao_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const monthOptions = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full sm:flex-1">
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="h-11 md:h-10"><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={format(filters.month, 'yyyy-MM')} onValueChange={(v) => handleFilterChange('month', v)}>
              <SelectTrigger className="h-11 md:h-10"><SelectValue placeholder="Filtrar por mês..." /></SelectTrigger>
              <SelectContent>
                {monthOptions.map(m => (
                  <SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                    {format(m, 'MMMM yyyy', { locale: pt })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <Button 
            variant="outline" 
            onClick={handleExportXLSX}
            disabled={!isOnline || sortedGroupedRecords.length === 0}
            className={`w-full sm:w-auto h-11 md:h-10 px-4 ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!isOnline ? "A exportação requer ligação à internet" : "Exportar para XLSX"}
        >
            <Download className="h-4 w-4 mr-2" />
            Download
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : sortedGroupedRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4 bg-muted/20 border-2 border-dashed rounded-lg">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">Nenhum registo encontrado</h3>
          <p className="text-muted-foreground text-sm mt-1">Não há registos mensais para os filtros selecionados.</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-3">
            {sortedGroupedRecords.map((record) => (
              <AccordionItem value={record.key} key={record.key} className="border rounded-xl shadow-sm bg-card overflow-hidden">
                <AccordionTrigger className="p-3 md:p-4 hover:no-underline hover:bg-muted/30 data-[state=open]:border-b transition-colors">
                    <div className="w-full flex flex-col md:flex-row md:items-center text-left gap-3 pr-2">
                        <div className="flex items-center justify-between w-full md:w-auto md:flex-1 gap-2">
                             <div onClick={(e) => { e.stopPropagation(); requestSort('usuario_nome'); }} className="font-semibold text-base truncate flex items-center cursor-pointer gap-2">
                                {record.usuario_nome} 
                                {record.is_correction && (
                                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 text-[10px] px-1.5 py-0">Correção</Badge>
                                )}
                                {renderSortArrow('usuario_nome')}
                             </div>
                             <Badge variant={getStatusVariant(record.status_validacao)} className="md:hidden text-[10px] px-2 whitespace-nowrap shrink-0">{record.status_validacao}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between md:justify-end gap-4 md:flex-1 text-sm text-muted-foreground">
                            <div onClick={(e) => { e.stopPropagation(); requestSort('mes'); }} className="flex items-center cursor-pointer">
                                {format(parseISO(record.mes), 'MMMM yyyy', { locale: pt })} {renderSortArrow('mes')}
                            </div>
                            <div className="hidden md:block"><Badge variant={getStatusVariant(record.status_validacao)}>{record.status_validacao}</Badge></div>
                        </div>

                        {record.status_validacao === 'Pendente' && (
                            <div className="flex justify-end gap-2 mt-2 md:mt-0 w-full md:w-auto">
                                <Button size="sm" variant="success" className="min-h-[40px] md:min-h-0 flex-1 md:flex-none" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(record.key, 'Aprovado'); }} disabled={updatingId === record.key || isReadOnlyAdmin}>
                                    {updatingId === record.key ? <Loader2 className="h-4 w-4 animate-spin mr-1 md:mr-0" /> : <Check className="h-4 w-4 mr-1 md:mr-0" />}
                                    <span className="md:hidden text-xs">Aprovar</span>
                                </Button>
                                <Button size="sm" variant="destructive" className="min-h-[40px] md:min-h-0 flex-1 md:flex-none" onClick={(e) => { e.stopPropagation(); handleUpdateStatus(record.key, 'Rejeitado'); }} disabled={updatingId === record.key || isReadOnlyAdmin}>
                                    {updatingId === record.key ? <Loader2 className="h-4 w-4 animate-spin mr-1 md:mr-0" /> : <X className="h-4 w-4 mr-1 md:mr-0" />}
                                    <span className="md:hidden text-xs">Rejeitar</span>
                                </Button>
                            </div>
                        )}
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-4 bg-muted/10 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 space-y-3">
                            <h4 className="font-semibold flex items-center text-sm border-b pb-1"><User className="mr-2 h-4 w-4 text-primary" />Informações de Submissão</h4>
                            <div className="space-y-1 text-sm">
                                <p className="text-muted-foreground">Data/Hora:</p>
                                <p className="font-medium">{format(new Date(record.data_submissao), 'dd/MM/yyyy HH:mm')}</p>
                                {record.is_correction && (
                                    <p className="text-amber-600 font-medium text-xs mt-2">
                                        * Este registo substitui uma submissão anterior cancelada.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <h4 className="font-semibold flex items-center text-sm border-b pb-1"><Building className="mr-2 h-4 w-4 text-primary" />Distribuição por Obras</h4>
                            <ul className="space-y-2">
                            {(record.allocations || []).map((op, index) => (
                                <li key={index} className="flex justify-between items-center bg-background p-2 md:p-3 rounded-md border shadow-sm text-sm">
                                    <span className="truncate mr-3" title={`${op.obra_id} - ${op.obra_nome}`}>{op.obra_id} - {op.obra_nome}</span>
                                    <Badge variant="outline" className="flex items-center gap-1 shrink-0 bg-primary/5">
                                        <BadgePercent className="h-3.5 w-3.5 text-primary" />
                                        {op.percentagem}%
                                    </Badge>
                                </li>
                            ))}
                            </ul>
                        </div>
                    </div>
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      )}
    </div>
  );
};

export default MonthlyValidationTab;