import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addHours } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Loader2, AlertCircle } from 'lucide-react';

const getStatusVariant = (status) => {
  switch (status) {
    case 'Aprovado': return 'success';
    case 'Rejeitado': return 'destructive';
    default: return 'secondary';
  }
};

const MyMonthlyHistoryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [corrections, setCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'Todos',
    month: new Date(),
  });

  const fetchCorrections = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const fromDate = startOfMonth(filters.month);
      const toDate = endOfMonth(filters.month);

      let query = supabase
        .from('correcoes_mensais')
        .select(`
          *,
          alocacoes:correcoes_mensais_alocacoes(
            obra_id,
            percentagem,
            obra:obras(nome)
          )
        `)
        .eq('usuario_id', user.id)
        .gte('mes', format(fromDate, 'yyyy-MM-dd'))
        .lte('mes', format(toDate, 'yyyy-MM-dd'))
        .order('data_solicitacao', { ascending: false });

      if (filters.status !== 'Todos') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setCorrections(data || []);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao carregar histórico.' });
    } finally {
      setIsLoading(false);
    }
  }, [filters, user?.id, toast]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const handleFilterChange = (key, value) => {
    if (key === 'month') {
      const [year, month] = value.split('-').map(Number);
      value = new Date(year, month - 1, 15);
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => subMonths(new Date(), i));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

      {isLoading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : corrections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4 border rounded-lg bg-muted/20">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Sem histórico</h3>
          <p className="text-muted-foreground text-sm">Não há correções mensais neste período.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês Ref.</TableHead>
                <TableHead>Data Pedido</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corrections.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                     {/* Safe formatting with addHours to prevent timezone shift */}
                     {format(addHours(parseISO(c.mes), 12), 'MM/yyyy')}
                  </TableCell>
                  <TableCell>{format(new Date(c.data_solicitacao), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>
                    <ul className="text-xs space-y-1">
                      {c.alocacoes?.map((a, idx) => (
                        <li key={idx} className="flex justify-between w-full max-w-[150px]">
                           <span className="truncate pr-1">{a.obra?.nome}</span>
                           <span className="font-mono">{a.percentagem}%</span>
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell><Badge variant={getStatusVariant(c.status)}>{c.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
};

export default MyMonthlyHistoryTab;