import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Check, X, Clock, Info, MapPin, Loader2, AlertCircle, User, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const formatDate = (dateString) => dateString ? format(parseISO(dateString), 'dd/MM/yyyy', { locale: pt }) : '-';
const formatTime = (dateTimeString) => dateTimeString ? format(parseISO(dateTimeString), 'HH:mm', { locale: pt }) : '-';

const getStatusVariant = (status) => ({ 'Aprovado': 'success', 'Rejeitado': 'destructive' }[status] || 'secondary');
const getStatusIcon = (status) => {
  const components = { 'Aprovado': <Check className="mr-2 h-4 w-4" />, 'Rejeitado': <X className="mr-2 h-4 w-4" />, 'Pendente': <Clock className="mr-2 h-4 w-4" /> };
  return components[status] || <Info className="mr-2 h-4 w-4" />;
};

const RecordsHistoryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [worksites, setWorksites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    worksiteId: 'all',
    employeeId: 'all',
    status: 'Todos',
    month: new Date(),
  });
  const [sortConfig, setSortConfig] = useState({ key: 'hora_inicio_real', direction: 'descending' });

  // Extract primitive values from filters state to prevent infinite loops in useCallback
  const filterWorksiteId = filters.worksiteId;
  const filterEmployeeId = filters.employeeId;
  const filterStatus = filters.status;
  const filterMonthTime = filters.month.getTime();

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedRecords = useMemo(() => {
    let sortableItems = [...records];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        switch (sortConfig.key) {
          case 'usuario':
            aValue = a.usuarios?.nome || '';
            bValue = b.usuarios?.nome || '';
            break;
          case 'obra':
            aValue = a.obras?.nome || '';
            bValue = b.obras?.nome || '';
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }

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
  }, [records, sortConfig]);

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const fetchFiltersData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: worksitesData, error: worksitesError } = await supabase
        .from('obras')
        .select('id, nome')
        .eq('encarregado_id', user.id);
      if (worksitesError) throw worksitesError;
      setWorksites(worksitesData || []);

      const { data: employeesData, error: employeesError } = await supabase
        .rpc('get_all_employees_with_justifications', { admin_id: user.id });
      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar filtros', description: error.message });
    }
  }, [user?.id, toast]);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = startOfMonth(new Date(filterMonthTime));
      const toDate = endOfMonth(new Date(filterMonthTime));

      let query = supabase
        .from('registros_ponto')
        .select(`id, hora_inicio_real, hora_fim_real, hora_inicio_escolhido, hora_fim_escolhido, obras(id, nome), status_validacao, usuarios!registros_ponto_usuario_id_fkey(nome)`)
        .gte('hora_inicio_real', fromDate.toISOString())
        .lte('hora_inicio_real', toDate.toISOString());

      if (filterWorksiteId !== 'all') {
        query = query.eq('obra_id', filterWorksiteId);
      } else {
        const worksiteIds = worksites.map(w => w.id);
        if (worksiteIds.length > 0) {
          query = query.in('obra_id', worksiteIds);
        }
      }

      if (filterEmployeeId !== 'all') {
        query = query.eq('usuario_id', filterEmployeeId);
      }

      if (filterStatus !== 'Todos') {
        query = query.eq('status_validacao', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os registos.' });
    } finally {
      setIsLoading(false);
    }
  }, [filterWorksiteId, filterEmployeeId, filterStatus, filterMonthTime, worksites, toast]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  useEffect(() => {
    if (worksites.length > 0 || filterWorksiteId === 'all') {
      fetchRecords();
    }
  }, [fetchRecords, worksites.length, filterWorksiteId]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Select value={filters.worksiteId} onValueChange={(v) => handleFilterChange('worksiteId', v)}>
          <SelectTrigger><SelectValue placeholder="Filtrar por obra..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Obras</SelectItem>
            {worksites.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.id} - {w.nome}</SelectItem>)}
          </SelectContent>
        </Select>
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
      ) : sortedRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Nenhum registo encontrado</h3>
          <p className="text-muted-foreground text-sm">Não há registos para os filtros selecionados.</p>
        </div>
      ) : (
        <>
        <div className="rounded-lg border overflow-hidden hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => requestSort('usuario')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Colaborador{renderSortArrow('usuario')}</div></TableHead>
                <TableHead onClick={() => requestSort('hora_inicio_real')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Data{renderSortArrow('hora_inicio_real')}</div></TableHead>
                <TableHead>Horário (Real)</TableHead>
                <TableHead>Horário (Escolhido)</TableHead>
                <TableHead onClick={() => requestSort('obra')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Obra{renderSortArrow('obra')}</div></TableHead>
                <TableHead onClick={() => requestSort('status_validacao')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Status{renderSortArrow('status_validacao')}</div></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {record.usuarios?.nome || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(record.hora_inicio_real)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col font-mono">
                      <span>Início: {formatTime(record.hora_inicio_real)}</span>
                      <span>Fim: {record.hora_fim_real ? formatTime(record.hora_fim_real) : 'Em aberto'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col font-mono">
                      <span>Início: {record.hora_inicio_escolhido ? record.hora_inicio_escolhido.substring(0,5) : 'N/A'}</span>
                      <span>Fim: {record.hora_fim_escolhido ? record.hora_fim_escolhido.substring(0,5) : 'Em aberto'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {record.obras ? `${record.obras.id} - ${record.obras.nome}` : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(record.status_validacao)} className="capitalize">
                      {getStatusIcon(record.status_validacao)}
                      {record.status_validacao || 'Pendente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {sortedRecords.map(r => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="text-base">{r.usuarios?.nome}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Data:</strong> {formatDate(r.hora_inicio_real)}</p>
                  <p><strong>Horas Reais:</strong> {formatTime(r.hora_inicio_real)} - {r.hora_fim_real ? formatTime(r.hora_fim_real) : 'Em aberto'}</p>
                  <p><strong>Horas Escolhidas:</strong> {r.hora_inicio_escolhido?.substring(0,5) || 'N/A'} - {r.hora_fim_escolhido?.substring(0,5) || 'N/A'}</p>
                  <p><strong>Obra:</strong> {r.obras ? `${r.obras.id} - ${r.obras.nome}` : 'N/A'}</p>
                </CardContent>
                <CardFooter>
                  <Badge variant={getStatusVariant(r.status_validacao)} className="capitalize">
                    {getStatusIcon(r.status_validacao)}
                    {r.status_validacao || 'Pendente'}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
        </div>
        </>
      )}
    </motion.div>
  );
};

export default RecordsHistoryTab;