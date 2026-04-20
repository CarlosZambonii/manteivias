import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Info, Loader2, AlertCircle, User, Building, BadgePercent } from 'lucide-react';

const formatMonth = (dateString) => dateString ? format(parseISO(dateString), 'MMMM yyyy', { locale: pt }) : '-';

const getStatusVariant = (status) => ({ 'Aprovado': 'success', 'Rejeitado': 'destructive' }[status] || 'secondary');

const MonthlyHistoryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employeeId: 'all',
    status: 'Todos',
    month: new Date(),
  });

  const fetchEmployees = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .rpc('get_all_employees_with_justifications', { admin_id: user.id });
      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar colaboradores', description: error.message });
    }
  }, [user?.id, toast]);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
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
      } else {
        const employeeIds = employees.map(e => e.id);
        if (employeeIds.length > 0) {
          query = query.in('usuario_id', employeeIds);
        } else {
          query = query.eq('usuario_id', -1);
        }
      }

      if (filters.status !== 'Todos') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setRecords(data || []);

    } catch (error) {
      console.error('Fetch error:', error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o histórico de correções mensais.' });
    } finally {
      setIsLoading(false);
    }
  }, [filters, employees, toast]);
  
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (employees.length > 0 || filters.employeeId === 'all') {
      fetchRecords();
    } else if (!isLoading && employees.length === 0) {
        setIsLoading(false);
        setRecords([]);
    }
  }, [fetchRecords, employees, isLoading]);

  const handleFilterChange = (key, value) => {
    if (key === 'month') {
      const [year, month] = value.split('-').map(Number);
      value = new Date(year, month - 1, 15);
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const monthOptions = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Select value={filters.employeeId} onValueChange={(v) => handleFilterChange('employeeId', v)}>
          <SelectTrigger><SelectValue placeholder="Filtrar por colaborador..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Colaboradores</SelectItem>
            {employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
          <SelectTrigger><SelectValue placeholder="Filtrar por estado..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Aprovado">Aprovado</SelectItem>
            <SelectItem value="Rejeitado">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={format(filters.month, 'yyyy-MM')} onValueChange={(v) => handleFilterChange('month', v)}>
          <SelectTrigger><SelectValue placeholder="Filtrar por mês..." /></SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                {format(m, 'MMMM yyyy', { locale: pt })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhuma correção mensal encontrada</h3>
          <p className="text-muted-foreground text-sm">Não há correções para os filtros selecionados.</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {records.map((record) => (
            <AccordionItem value={`item-${record.id}`} key={record.id} className="border rounded-lg">
              <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
                <div className="w-full grid grid-cols-2 md:grid-cols-3 items-center text-left gap-4">
                  <div className="font-medium flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{record.usuario?.nome || 'Utilizador desconhecido'}</div>
                  <div className="hidden md:block">{formatMonth(record.mes)}</div>
                  <div><Badge variant={getStatusVariant(record.status)}>{record.status}</Badge></div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="p-4 bg-muted/50 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />Detalhes da Correção</h4>
                    <p className="text-sm"><strong>Submetido em:</strong> {format(new Date(record.data_solicitacao), 'dd/MM/yyyy HH:mm')}</p>
                    <p className="text-sm md:hidden"><strong>Mês:</strong> {formatMonth(record.mes)}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center"><Building className="mr-2 h-4 w-4 text-primary" />Nova Distribuição</h4>
                    <ul className="space-y-1">
                      {(record.alocacoes || []).map((alloc, index) => (
                        <li key={index} className="text-sm flex justify-between items-center">
                          <span>{alloc.obra?.nome || `Obra #${alloc.obra_id}`}</span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <BadgePercent className="h-3 w-3" />
                            {alloc.percentagem}%
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
    </motion.div>
  );
};

export default MonthlyHistoryTab;