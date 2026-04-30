import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Check, Loader2, AlertCircle, Wrench, Trash2, Download, MapPin, Edit, PlusCircle, ChevronDown, AlertTriangle } from 'lucide-react';
import { useOfflineManager } from '@/contexts/OfflineManager';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as XLSX from 'xlsx';

import CorrectionModal from '@/components/corrections/CorrectionModal';
import MonthlyRecordEditModal from '@/components/history/MonthlyRecordEditModal';

const formatDate = (dateString) => dateString ? format(parseISO(dateString), 'dd/MM/yyyy', { locale: pt }) : '-';

// Helper to format time strings (HH:mm:ss or HH:mm) or ISO strings
const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '-';
  // If it's a full ISO string
  if (timeStr.includes('T')) {
    try {
      return format(parseISO(timeStr), 'HH:mm', { locale: pt });
    } catch (e) {
      return timeStr.substring(0, 5);
    }
  }
  // If it's a time string from DB (HH:mm:ss)
  return timeStr.substring(0, 5);
};

const getStatusVariant = (status) => {
    if (status === 'Aprovado') return 'success';
    if (status === 'Rejeitado') return 'destructive';
    if (status === 'Cancelado pela Correção' || status === 'Cancelado') return 'outline';
    return 'secondary';
};

const monthsList = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const RecordsHistoryTab = ({ month }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isOnline, getOfflineData, isSyncing } = useOfflineManager();
  
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isDeleting, setIsDeleting] = useState(false);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  
  // Initialize with the month passed from parent
  const [selectedMonths, setSelectedMonths] = useState([new Date(month || new Date()).getMonth()]);
  
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);

  // New state for Monthly Record Edit/Delete
  const [selectedMonthForEdit, setSelectedMonthForEdit] = useState(null);
  const [monthToDelete, setMonthToDelete] = useState(null);

  const isMonthlyUser = user?.tipo_registo?.toLowerCase() === 'mensal';

  const handleToggleAllMonths = () => {
    if (selectedMonths.length === 12) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    }
  };

  const handleToggleMonth = (mIndex) => {
    setSelectedMonths(prev => 
      prev.includes(mIndex) ? prev.filter(m => m !== mIndex) : [...prev, mIndex].sort((a, b) => a - b)
    );
  };

  const fetchRecords = useCallback(async () => {
    if (!month) return;
    
    if (selectedMonths.length === 0) {
        setRecords([]);
        setMonthlyRecords([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    
    const monthDate = month instanceof Date ? month : new Date(month);
    const year = monthDate.getFullYear();
    
    const minMonth = Math.min(...selectedMonths);
    const maxMonth = Math.max(...selectedMonths);
    
    const fromDate = startOfMonth(new Date(year, minMonth));
    const toDate = endOfMonth(new Date(year, maxMonth));

    try {
      let regularRecords = [];
      let approvedCorrections = [];
      let pendingIds = new Set();
      let monthlyRecordsData = [];
      
      if (isOnline) {
          const { data: regData, error: regError } = await supabase
            .from('registros_ponto')
            .select(`id, hora_inicio_real, hora_fim_real, obra_id, turno, obras(nome), status_validacao, rejeicao_comentario, hora_inicio_escolhido, hora_fim_escolhido`)
            .eq('usuario_id', user.id)
            .gte('hora_inicio_real', fromDate.toISOString())
            .lte('hora_inicio_real', toDate.toISOString());
          if (regError) throw regError;
          regularRecords = regData || [];

          const { data: corrData, error: corrError } = await supabase
            .from('correcoes_ponto')
            .select(`id, registro_ponto_id, data_correcao, hora_inicio_sugerida, hora_fim_sugerida, turno, obra_id, obras(nome), status, tipo`)
            .eq('usuario_id', user.id)
            .gte('data_correcao', format(fromDate, 'yyyy-MM-dd'))
            .lte('data_correcao', format(toDate, 'yyyy-MM-dd'));
          if (corrError) throw corrError;
          
          const allCorrs = corrData || [];
          approvedCorrections = allCorrs.filter(c => c.status === 'Aprovado');
          pendingIds = new Set(allCorrs.filter(c => c.status === 'Pendente').map(c => c.registro_ponto_id).filter(Boolean));

          if (isMonthlyUser) {
              const { data: mData, error: mError } = await supabase
                .from('registros_mensais')
                .select('id, status_validacao, data_submissao, percentagem, obra_id, mes, obras(nome)')
                .eq('usuario_id', user.id)
                .gte('mes', format(fromDate, 'yyyy-MM-dd'))
                .lte('mes', format(toDate, 'yyyy-MM-dd'));
              if (!mError) monthlyRecordsData = mData || [];
          }

      } else {
          const promises = [
              getOfflineData('registros_ponto'),
              getOfflineData('correcoes_ponto'),
              getOfflineData('obras')
          ];
          if (isMonthlyUser) promises.push(getOfflineData('registros_mensais'));

          const results = await Promise.all(promises);
          
          const allRegs = results[0] || [];
          const allCorrs = results[1] || [];
          const allObras = results[2] || [];
          const allMensais = isMonthlyUser ? (results[3] || []) : [];

          const obraMap = new Map(allObras.map(o => [o.id, o]));

          regularRecords = allRegs
            .filter(r => r.usuario_id === user.id && r.hora_inicio_real && isWithinInterval(parseISO(r.hora_inicio_real), { start: fromDate, end: toDate }))
            .map(r => ({ ...r, obras: obraMap.get(r.obra_id) }));

          const relevantCorrs = allCorrs.filter(c => c.usuario_id === user.id && c.data_correcao && isWithinInterval(parseISO(c.data_correcao), { start: fromDate, end: toDate }));
          
          approvedCorrections = relevantCorrs
            .filter(c => c.status === 'Aprovado')
            .map(c => ({ ...c, obras: obraMap.get(c.obra_id) }));
            
          pendingIds = new Set(relevantCorrs.filter(c => c.status === 'Pendente').map(c => c.registro_ponto_id).filter(Boolean));
          
          if (isMonthlyUser && allMensais.length > 0) {
              monthlyRecordsData = allMensais
                .filter(m => {
                    const mDate = parseISO(m.mes);
                    return m.usuario_id === user.id && mDate >= fromDate && mDate <= toDate;
                })
                .map(m => ({ ...m, obras: obraMap.get(m.obra_id) }));
          }
      }

      // Mark records with pending corrections
      regularRecords = regularRecords.map(r => {
          if (pendingIds.has(r.id)) {
              return { ...r, hasPendingCorrection: true };
          }
          return r;
      });

      const formattedCorrections = approvedCorrections.map(c => ({
        id: `cor-${c.id}`,
        type: 'correction',
        hora_inicio_real: `${c.data_correcao}T${c.hora_inicio_sugerida}`,
        hora_fim_real: c.hora_fim_sugerida ? `${c.data_correcao}T${c.hora_fim_sugerida}` : null,
        hora_inicio_escolhido: c.hora_inicio_sugerida,
        hora_fim_escolhido: c.hora_fim_sugerida,
        turno: c.turno,
        obras: c.obras,
        status_validacao: 'Aprovado',
      }));

      const allRecords = [...regularRecords, ...formattedCorrections].map(r => ({
          ...r,
          dateKey: format(parseISO(r.hora_inicio_real || r.date), 'yyyy-MM-dd')
      }));

      if (isMonthlyUser) {
          if (monthlyRecordsData.length > 0) {
              const grouped = {};
              monthlyRecordsData.forEach(m => {
                  const mDate = parseISO(m.mes);
                  if (!selectedMonths.includes(mDate.getMonth())) return;
                  
                  // Group by both month and submission time to separate active from cancelled records
                  const key = `${format(mDate, 'yyyy-MM')}_${m.data_submissao}`;
                  if (!grouped[key]) {
                      grouped[key] = {
                          id: `mensal-${m.id}`,
                          type: 'registo_mensal',
                          dateKey: m.mes,
                          date: mDate.toISOString(),
                          status_validacao: m.status_validacao,
                          data_submissao: m.data_submissao,
                          records: []
                      };
                  }
                  grouped[key].records.push(m);
              });
              setMonthlyRecords(Object.values(grouped).sort((a,b) => new Date(b.data_submissao) - new Date(a.data_submissao)));
          } else {
              setMonthlyRecords([]);
          }
      } else {
          setMonthlyRecords([]);
      }

      const combined = [...allRecords].sort((a, b) => new Date(b.hora_inicio_real || b.date) - new Date(a.hora_inicio_real || a.date));
      
      // Ensure all displayed records belong to selected months
      const finalRecords = combined.filter(r => {
          const rDate = new Date(r.hora_inicio_real || r.date);
          return selectedMonths.includes(rDate.getMonth());
      });

      setRecords(finalRecords);

    } catch (error) {
      console.error("Fetch error", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os registos.' });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isMonthlyUser, month, selectedMonths, toast, isOnline, getOfflineData]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, isSyncing]);

  const handleDeleteRecord = async (recordId) => {
      if(!isOnline) {
          toast({ variant: 'destructive', title: 'Ação indisponível', description: 'Não é possível eliminar registos offline.' });
          return;
      }
      setIsDeleting(true);
      try {
          const { data: corrections, error: checkError } = await supabase
            .from('correcoes_ponto')
            .select('id')
            .eq('registro_ponto_id', recordId)
            .limit(1);
            
          if (checkError) throw checkError;

          if (corrections && corrections.length > 0) {
              const { error } = await supabase
                .from('registros_ponto')
                .update({ 
                    status_validacao: 'Cancelado', 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', recordId);
                
              if (error) throw error;
          } else {
              const { error } = await supabase
                .from('registros_ponto')
                .delete()
                .eq('id', recordId);
                
              if (error) throw error;
          }

          toast({ title: 'Sucesso', description: 'Registo processado com sucesso.' });
          fetchRecords();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Erro ao processar', description: error.message });
      } finally {
          setIsDeleting(false);
      }
  };

  const handleDeleteMonth = async () => {
    if (!monthToDelete || !isOnline) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('registros_mensais')
        .update({ status_validacao: 'Cancelado' })
        .eq('usuario_id', user.id)
        .eq('mes', monthToDelete.dateKey)
        .eq('data_submissao', monthToDelete.data_submissao);
      
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Registo mensal cancelado com sucesso.' });
      setMonthToDelete(null);
      fetchRecords();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao cancelar', description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditRecord = (record) => {
    setSelectedRecordForCorrection({
        ...record,
        date: record.dateKey || record.hora_inicio_real || record.date,
        type: 'Correção'
    });
    setIsCorrectionModalOpen(true);
  };

  const handleNewRecord = () => {
    setSelectedRecordForCorrection({
        isNew: true,
        type: 'Falta',
        date: new Date().toISOString()
    });
    setIsCorrectionModalOpen(true);
  };

  const handleCorrectionSuccess = () => {
    fetchRecords();
    setIsCorrectionModalOpen(false);
    setSelectedRecordForCorrection(null);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
        if (statusFilter === 'Todos') return true;
        if (statusFilter === 'Cancelado pela Correção' && (record.status_validacao === 'Cancelado' || record.status_validacao === 'Cancelado pela Correção')) return true;
        return record.status_validacao === statusFilter;
    });
  }, [records, statusFilter]);

  const groupedRecords = useMemo(() => {
      const groups = {};
      filteredRecords.forEach(record => {
          const key = record.dateKey;
          if (!groups[key]) groups[key] = [];
          groups[key].push(record);
      });
      return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [filteredRecords]);

  const showMonthlyRecords = isMonthlyUser && monthlyRecords.length > 0 && monthlyRecords.some(mr => 
      statusFilter === 'Todos' || 
      mr.status_validacao === statusFilter ||
      (statusFilter === 'Cancelado pela Correção' && mr.status_validacao === 'Cancelado')
  );
  const hasExportableData = (filteredRecords && filteredRecords.length > 0) || showMonthlyRecords;
  const showEmptyState = groupedRecords.length === 0 && (!isMonthlyUser || !showMonthlyRecords);

  const handleExportXLSX = () => {
    if (!isOnline) {
      toast({ variant: 'destructive', title: 'Modo Offline', description: 'A exportação requer ligação à internet.' });
      return;
    }
    
    let exportData = [];

    if (showMonthlyRecords) {
        const filteredMonthly = monthlyRecords.filter(mr => 
            statusFilter === 'Todos' || 
            mr.status_validacao === statusFilter ||
            (statusFilter === 'Cancelado pela Correção' && mr.status_validacao === 'Cancelado')
        );
        filteredMonthly.forEach(mr => {
            mr.records.forEach(r => {
                exportData.push({
                    data: format(parseISO(mr.dateKey), 'yyyy-MM', { locale: pt }),
                    tipo: 'Registo Mensal',
                    turno: 'Mês Completo',
                    hora_inicio: '',
                    hora_fim: '',
                    obra: `${r.obras?.nome || ''} (${r.percentagem}%)`,
                    status: mr.status_validacao || ''
                });
            });
        });
    }

    if (filteredRecords && filteredRecords.length > 0) {
        const recordsData = filteredRecords.map(r => ({
            data: r.dateKey,
            tipo: r.type === 'correction' ? 'Correção' : 'Registo',
            turno: r.turno || 'Normal',
            hora_inicio: r.hora_inicio_escolhido ? formatDisplayTime(r.hora_inicio_escolhido) : '',
            hora_fim: r.hora_fim_escolhido ? formatDisplayTime(r.hora_fim_escolhido) : '',
            obra: r.obras?.nome || '',
            status: r.status_validacao || ''
        }));
        exportData = [...exportData, ...recordsData];
    }

    if (exportData.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para exportar.' });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registos");
    XLSX.writeFile(workbook, `historico_registos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <Button 
            onClick={handleNewRecord} 
            className="w-full md:w-auto h-11 md:h-10 text-sm shadow-sm hover:shadow-md transition-shadow"
        >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Registo
        </Button>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-[200px] h-11 md:h-10 text-sm justify-between">
                    <span className="truncate">
                        {selectedMonths.length === 12 
                            ? "Todos os Meses" 
                            : selectedMonths.length === 0 
                                ? "Nenhum mês" 
                                : `${selectedMonths.length} meses selecionados`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-2" align="start">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <Checkbox 
                      id="all-months" 
                      checked={selectedMonths.length === 12}
                      onCheckedChange={handleToggleAllMonths}
                    />
                    <label htmlFor="all-months" className="text-sm font-medium leading-none cursor-pointer">
                      Todos os Meses
                    </label>
                  </div>
                  <ScrollArea className="h-64">
                    <div className="flex flex-col space-y-3 pt-2 pb-2 px-1">
                      {monthsList.map((mName, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`month-${idx}`} 
                            checked={selectedMonths.includes(idx)}
                            onCheckedChange={() => handleToggleMonth(idx)}
                          />
                          <label htmlFor={`month-${idx}`} className="text-sm font-medium leading-none cursor-pointer">
                            {mName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </PopoverContent>
            </Popover>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-11 md:h-10 text-sm">
                    <SelectValue placeholder="Filtrar por status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                    <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                    <SelectItem value="Cancelado pela Correção">Cancelado</SelectItem>
                </SelectContent>
            </Select>
            <Button 
                variant="outline" 
                onClick={handleExportXLSX}
                disabled={!isOnline || !hasExportableData}
                className={`w-full sm:w-auto h-11 md:h-10 px-4 ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!isOnline ? "A exportação requer ligação à internet" : "Exportar para XLSX"}
            >
                <Download className="h-4 w-4 mr-2" />
                Download
            </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-48 md:h-64">
            <div className="flex flex-col items-center">
                <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary mb-2" />
                {isSyncing && <span className="text-[10px] md:text-xs text-muted-foreground">A sincronizar dados...</span>}
            </div>
        </div>
      ) : showEmptyState ? (
        <div className="flex flex-col items-center justify-center h-48 md:h-64 text-center p-4">
          <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4 opacity-50" />
          <h3 className="text-base md:text-lg font-semibold">Nenhum registo encontrado</h3>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Não há registos para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="space-y-4">
            
            {isMonthlyUser && showMonthlyRecords && (
                <div className="mb-4">
                    <Accordion type="multiple" className="w-full space-y-2">
                        {monthlyRecords.filter(mr => 
                            statusFilter === 'Todos' || 
                            mr.status_validacao === statusFilter ||
                            (statusFilter === 'Cancelado pela Correção' && mr.status_validacao === 'Cancelado')
                        ).map((mr) => (
                            <AccordionItem key={mr.id} value={mr.id} className={`border rounded-lg md:rounded-xl bg-card overflow-hidden shadow-sm ${mr.status_validacao === 'Cancelado' || mr.status_validacao === 'Cancelado pela Correção' ? 'opacity-60 bg-muted/20' : ''}`}>
                                <AccordionTrigger className="px-3 py-3 md:px-4 hover:bg-muted/50 transition-colors [&[data-state=open]>div>svg]:rotate-180">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-2 md:pr-4 gap-2 sm:gap-0">
                                        <span className="font-semibold text-sm md:text-lg text-left capitalize">
                                            Registo de {format(parseISO(mr.dateKey), 'MMMM', { locale: pt })}
                                        </span>
                                        <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                            <Badge variant={getStatusVariant(mr.status_validacao)} className="capitalize">
                                                {mr.status_validacao === 'Cancelado' || mr.status_validacao === 'Cancelado pela Correção' ? 'Cancelado' : (mr.status_validacao || 'Pendente')}
                                            </Badge>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-muted/10 p-0 border-t">
                                    <div className="p-3 md:p-4 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-3 mb-2">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <span className="text-muted-foreground">Data de Submissão:</span>
                                                <span className="font-medium text-foreground">
                                                    {mr.data_submissao 
                                                        ? format(new Date(mr.data_submissao), 'dd/MM/yyyy HH:mm', { locale: pt }) 
                                                        : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setSelectedMonthForEdit(mr)}
                                                    disabled={mr.status_validacao === 'Aprovado' || mr.status_validacao === 'Cancelado' || mr.status_validacao === 'Cancelado pela Correção'}
                                                >
                                                    <Edit className="h-4 w-4 mr-2" /> Editar
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => setMonthToDelete(mr)}
                                                    disabled={mr.status_validacao === 'Aprovado' || mr.status_validacao === 'Cancelado' || mr.status_validacao === 'Cancelado pela Correção'}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="rounded-md border bg-background overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent bg-muted/20">
                                                        <TableHead className="py-2 px-4 h-9">Obra</TableHead>
                                                        <TableHead className="text-right py-2 px-4 h-9">Percentagem</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {mr.records.map((rec) => (
                                                        <TableRow key={rec.id} className="hover:bg-transparent">
                                                            <TableCell className="py-2 px-4 font-medium">{rec.obras?.nome || 'N/A'}</TableCell>
                                                            <TableCell className="text-right py-2 px-4">{rec.percentagem}%</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            )}

            {groupedRecords.length > 0 && (
                <Accordion type="multiple" className="w-full space-y-2">
                    {groupedRecords.map(([dateKey, dayRecords]) => (
                        <AccordionItem key={dateKey} value={dateKey} className="border rounded-lg md:rounded-xl bg-card overflow-hidden shadow-sm">
                            <AccordionTrigger className="px-3 py-3 md:px-4 hover:bg-muted/50 transition-colors [&[data-state=open]>div>svg]:rotate-180">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-2 md:pr-4 gap-2 sm:gap-0">
                                    <span className="font-semibold text-sm md:text-lg text-left">
                                        {formatDate(dateKey)}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                        <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0 md:py-0.5">{dayRecords.length} registo(s)</Badge>
                                        {dayRecords.some(r => r.status_validacao === 'Pendente') && <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0 md:py-0.5 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Pendente(s)</Badge>}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="bg-muted/10 p-0 border-t">
                                {/* Desktop Table View */}
                                <div className="hidden md:block w-full overflow-x-auto no-scrollbar">
                                    <Table className="w-full">
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="py-3 px-4">Turno/Tipo</TableHead>
                                                <TableHead className="py-3 px-4">Horário</TableHead>
                                                <TableHead className="py-3 px-4">Obra</TableHead>
                                                <TableHead className="py-3 px-4">Status</TableHead>
                                                <TableHead className="text-right py-3 px-4">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dayRecords.map((record) => {
                                                const isBlocked = isDeleting || record.status_validacao === 'Aprovado' || record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado' || record.hasPendingCorrection;

                                                return (
                                                    <TableRow key={record.id} className={record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado' ? 'opacity-50 bg-muted/30 hover:bg-muted/40' : 'hover:bg-transparent'}>
                                                        <TableCell className="capitalize text-sm py-3 px-4">{record.turno || 'Normal'}</TableCell>
                                                        <TableCell className="py-3 px-4">
                                                            <div className={`flex font-mono text-sm whitespace-nowrap ${(record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado') ? 'line-through text-muted-foreground/60' : 'text-muted-foreground'}`}>
                                                                {formatDisplayTime(record.hora_inicio_escolhido)} - {record.hora_fim_escolhido ? formatDisplayTime(record.hora_fim_escolhido) : 'Em aberto'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4">
                                                            <div className={`flex items-center gap-1.5 ${(record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado') ? 'opacity-70' : ''}`}>
                                                                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                <span className="truncate max-w-[180px] text-sm" title={record.obras?.nome}>{record.obras?.nome || 'N/A'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3 px-4">
                                                            <div className="flex items-center gap-1">
                                                                <Badge variant={getStatusVariant(record.status_validacao)} className="capitalize whitespace-nowrap">
                                                                    {record.type === 'correction' ? <Wrench className="mr-1 h-3.5 w-3.5" /> : null}
                                                                    {record.type === 'correction' ? 'Correção' : ((record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado') ? 'Cancelado' : (record.status_validacao || 'Pendente'))}
                                                                </Badge>
                                                                {record.hasPendingCorrection && (
                                                                    <Badge variant="warning" className="bg-yellow-100 text-yellow-800 border-0 whitespace-nowrap text-[10px] px-1.5 py-0" title="Possui correção pendente">
                                                                        <AlertTriangle className="h-3 w-3 mr-1" /> Em Correção
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-3 px-4">
                                                            {record.type !== 'correction' && (
                                                                <div className="flex justify-end items-center gap-1.5">
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-9 w-9 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                                                        onClick={() => handleEditRecord(record)}
                                                                        disabled={isBlocked}
                                                                        title={record.hasPendingCorrection ? 'Não é possível editar: existe uma correção pendente.' : record.status_validacao === 'Aprovado' ? 'Não é possível editar registos aprovados' : (record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado') ? 'Registo cancelado não pode ser editado' : 'Corrigir registo'}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
                                                                        onClick={() => handleDeleteRecord(record.id)}
                                                                        disabled={isBlocked}
                                                                        title={record.hasPendingCorrection ? 'Não é possível eliminar: existe uma correção pendente.' : record.status_validacao === 'Aprovado' ? 'Não é possível eliminar registos aprovados' : (record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado') ? 'Registo já foi processado' : 'Eliminar/Cancelar registo'}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden flex flex-col gap-3 p-3">
                                    {dayRecords.map((record) => {
                                        const isBlocked = isDeleting || record.status_validacao === 'Aprovado' || record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado' || record.hasPendingCorrection;

                                        return (
                                            <div key={record.id} className={`bg-background rounded-lg border p-3 flex flex-col gap-2 shadow-sm relative ${(record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado') ? 'opacity-60 bg-muted/20' : ''}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <Badge variant="outline" className="mb-1 text-[10px] uppercase font-semibold">
                                                            {record.turno || 'Normal'}
                                                        </Badge>
                                                        <div className={`flex flex-col font-mono text-sm mt-1 ${(record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado') ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                                                            <span>Início: <span className="font-semibold">{formatDisplayTime(record.hora_inicio_escolhido)}</span></span>
                                                            <span className="text-muted-foreground text-xs mt-0.5">Fim: {record.hora_fim_escolhido ? <span className="font-semibold">{formatDisplayTime(record.hora_fim_escolhido)}</span> : 'Em aberto'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge variant={getStatusVariant(record.status_validacao)} className="capitalize text-[10px]">
                                                            {record.type === 'correction' ? <Wrench className="mr-1 h-3 w-3" /> : null}
                                                            {record.type === 'correction' ? 'Correção' : ((record.status_validacao === 'Cancelado pela Correção' || record.status_validacao === 'Cancelado') ? 'Cancelado' : (record.status_validacao || 'Pendente'))}
                                                        </Badge>
                                                        {record.hasPendingCorrection && (
                                                            <Badge variant="warning" className="bg-yellow-100 text-yellow-800 border-0 text-[10px]">
                                                                <AlertTriangle className="h-3 w-3 mr-1" /> Em Correção
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between mt-1 pt-2 border-t">
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                        <span className="truncate text-xs text-muted-foreground" title={record.obras?.nome}>{record.obras?.nome || 'N/A'}</span>
                                                    </div>
                                                    {record.type !== 'correction' && (
                                                        <div className="flex justify-end gap-1 flex-shrink-0">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8 w-8 p-0 text-blue-500"
                                                                onClick={() => handleEditRecord(record)}
                                                                disabled={isBlocked}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="h-8 w-8 p-0 text-red-500"
                                                                onClick={() => handleDeleteRecord(record.id)}
                                                                disabled={isBlocked}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
      )}

      {isCorrectionModalOpen && (
          <CorrectionModal
            isOpen={isCorrectionModalOpen}
            onOpenChange={(open) => {
                setIsCorrectionModalOpen(open);
                if (!open) setSelectedRecordForCorrection(null);
            }}
            item={selectedRecordForCorrection}
            onCorrectionSubmitted={handleCorrectionSuccess}
          />
      )}

      {selectedMonthForEdit && (
          <MonthlyRecordEditModal
            isOpen={!!selectedMonthForEdit}
            onOpenChange={(open) => !open && setSelectedMonthForEdit(null)}
            recordGroup={selectedMonthForEdit}
            onSuccess={() => {
              setSelectedMonthForEdit(null);
              fetchRecords();
            }}
          />
      )}

      {monthToDelete && (
        <AlertDialog open={!!monthToDelete} onOpenChange={(open) => !open && setMonthToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Registo Mensal</AlertDialogTitle>
              <AlertDialogDescription>
                Tem a certeza que deseja cancelar as alocações de {monthToDelete?.dateKey ? format(parseISO(monthToDelete.dateKey), 'MMMM yyyy', { locale: pt }) : ''}? O registo passará para o estado Cancelado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Voltar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteMonth} 
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Cancelar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

    </motion.div>
  );
};

export default RecordsHistoryTab;