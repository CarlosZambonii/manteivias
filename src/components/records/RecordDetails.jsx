import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { pt } from 'date-fns/locale';

import { Loader2, AlertCircle, Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const getStatusVariant = (status) => ({ 'Aprovado': 'success', 'Rejeitado': 'destructive' }[status] || 'secondary');
const getStatusIcon = (status) => {
  const components = { 'Aprovado': <CheckCircle className="mr-2 h-4 w-4" />, 'Rejeitado': <XCircle className="mr-2 h-4 w-4" />, 'Pendente': <Clock className="mr-2 h-4 w-4" /> };
  return components[status] || components['Pendente'];
};
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('pt-PT') : '-';
const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : '-';

const RecordDetails = ({ employee, worksite }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [month, setMonth] = useState(new Date());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = startOfMonth(month);
      const toDate = endOfMonth(month);

      let query = supabase
        .from('registros_ponto')
        .select(`*, obras(nome)`)
        .eq('usuario_id', employee.id)
        .eq('obra_id', worksite.id)
        .gte('hora_inicio_real', fromDate.toISOString())
        .lte('hora_inicio_real', toDate.toISOString())
        .order('hora_inicio_real', { ascending: false });

      if (statusFilter !== 'Todos') {
        query = query.eq('status_validacao', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar registos', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [employee.id, worksite.id, statusFilter, month, toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleUpdateStatus = async (record, status) => {
    const originalRecords = [...records];
    setRecords(records.map(r => r.id === record.id ? { ...r, status_validacao: status } : r));

    try {
      const { error } = await supabase.functions.invoke('update-record-status', {
        body: { recordId: record.id, status, adminId: user.id },
      });
      if (error) throw error;

      const statusText = status === 'Aprovado' ? 'aprovado' : 'rejeitado';
      
      toast({
        variant: 'success',
        title: `Registo ${statusText}!`,
        description: `O estado do registo foi atualizado.`,
      });
      fetchRecords();
    } catch (error) {
      setRecords(originalRecords);
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: 'Não foi possível atualizar o registo.' });
    }
  };

  const handleMonthSelect = (newDate) => {
    setMonth(newDate || new Date());
    setIsPopoverOpen(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {['Todos', 'Pendente', 'Aprovado', 'Rejeitado'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(month, "MMMM yyyy", { locale: pt })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={month}
              onSelect={handleMonthSelect}
              initialFocus
              locale={pt}
              className="rounded-md border bg-background"
              defaultMonth={month}
              onMonthChange={setMonth}
              disableNavigation={false}
            />
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum registo encontrado</h3>
          <p className="text-muted-foreground text-sm">Não há registos para os filtros selecionados.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-center">Entrada</TableHead>
                <TableHead className="text-center">Saída</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{formatDate(record.hora_inicio_real)}</TableCell>
                  <TableCell className="text-center font-mono">{formatTime(record.hora_inicio_escolhido)}</TableCell>
                  <TableCell className="text-center font-mono">{formatTime(record.hora_fim_escolhido)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(record.status_validacao)} className="capitalize">
                      {getStatusIcon(record.status_validacao)}
                      {record.status_validacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button onClick={() => handleUpdateStatus(record, 'Aprovado')} size="icon" className="bg-green-600 hover:bg-green-700 h-8 w-8" disabled={record.status_validacao === 'Aprovado'}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleUpdateStatus(record, 'Rejeitado')} size="icon" variant="destructive" className="h-8 w-8" disabled={record.status_validacao === 'Rejeitado'}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  );
};

export default RecordDetails;