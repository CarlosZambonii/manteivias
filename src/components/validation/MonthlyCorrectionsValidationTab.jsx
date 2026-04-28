import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, Check, X, User, Calendar, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { startOfMonth, endOfMonth, format, subMonths, parseISO, addHours } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import * as XLSX from 'xlsx';
import { sendApprovalNotification } from '@/services/NotificationService';
import { useLanguage } from '@/hooks/useLanguage';

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
  const [isExporting, setIsExporting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employeeId: 'all',
    status: 'Pendente',
    month: new Date(),
  });
  const [updatingId, setUpdatingId] = useState(null);

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

  const fetchCorrections = useCallback(async () => {
    setIsLoading(true);
    try {
      if (worksiteFilter && worksiteFilter.length === 0) {
          setCorrections([]);
          setIsLoading(false);
          return;
      }

      const fromDate = startOfMonth(filters.month);
      const toDate = endOfMonth(filters.month);

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
        .gte('mes', format(fromDate, 'yyyy-MM-dd'))
        .lte('mes', format(toDate, 'yyyy-MM-dd'))
        .order('data_solicitacao', { ascending: false });

      if (filters.employeeId !== 'all') {
        query = query.eq('usuario_id', filters.employeeId);
      }

      if (filters.status !== 'Todos') {
        query = query.eq('status', filters.status);
      }

      let { data, error } = await query;
      if (error) throw error;
      
      if (worksiteFilter && data) {
         data = data.filter(c => c.alocacoes?.some(a => worksiteFilter.includes(a.obra_id)));
      }

      setCorrections(data || []);

    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('corrections.monthlyError') });
    } finally {
      setIsLoading(false);
    }
  }, [filters, worksiteFilter, toast]);

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
      if (correction) {
        sendApprovalNotification(correction.usuario_id, 'correcao_mensal', newStatus);
      }
      toast({ variant: 'success', title: newStatus === 'Aprovado' ? t('corrections.monthlyApproved') : t('corrections.monthlyRejected') });
      fetchCorrections();
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
      console.error('Error exporting data:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Ocorreu um erro ao exportar os dados.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === 'month') {
      const [year, month] = value.split('-').map(Number);
      value = new Date(year, month - 1, 15);
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => subMonths(new Date(), i));
  const employeeOptions = [
    { value: 'all', label: 'Todos os Colaboradores' },
    ...employees.map(e => ({ value: String(e.id), label: e.nome }))
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full flex-1">
          <Combobox
            options={employeeOptions}
            value={filters.employeeId}
            onChange={(v) => handleFilterChange('employeeId', v)}
            placeholder="Filtrar por colaborador..."
            searchPlaceholder="Procurar colaborador..."
          />
          <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Aprovado">Aprovado</SelectItem>
              <SelectItem value="Rejeitado">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
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
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportXLSX} 
          disabled={isLoading || corrections.length === 0 || isExporting}
          className="w-full sm:w-auto h-10 px-4"
        >
          {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Download
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : corrections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4 border rounded-lg bg-muted/20">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma correção mensal</h3>
          <p className="text-muted-foreground text-sm">Não há correções mensais correspondentes.</p>
        </div>
      ) : (
        <div className="rounded-md border">
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
              {corrections.map((c) => (
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
                       {/* Safe month formatting adding 12 hours to avoid timezone shifts */}
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
                        <Button size="sm" variant="success" onClick={() => handleUpdateStatus(c.id, 'Aprovado')} disabled={updatingId === c.id}>
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
    </div>
  );
};

export default MonthlyCorrectionsValidationTab;