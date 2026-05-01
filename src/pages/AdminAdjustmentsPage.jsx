import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Check, X, Clock, Info, User, Calendar, MapPin, Loader2, AlertCircle, Wrench } from 'lucide-react';
import CorrectionActions from '@/components/corrections/CorrectionActions';
import MonthSelector from '@/components/MonthSelector';

const formatDate = (dateString) => dateString ? format(parseISO(dateString), 'dd/MM/yyyy', { locale: pt }) : '-';
const formatTime = (timeString) => timeString ? format(parseISO(`2000-01-01T${timeString}`), 'HH:mm', { locale: pt }) : '-';

const getStatusVariant = (status) => {
  if (status === 'Aprovado') return 'success';
  if (status === 'Rejeitado') return 'destructive';
  return 'secondary';
};

const getStatusIcon = (status) => {
  if (status === 'Aprovado') return <Check className="mr-2 h-4 w-4" />;
  if (status === 'Rejeitado') return <X className="mr-2 h-4 w-4" />;
  return <Clock className="mr-2 h-4 w-4" />;
};

const AdminAdjustmentsPage = () => {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [corrections, setCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const fetchCorrections = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = startOfMonth(selectedMonth);
      const toDate = endOfMonth(selectedMonth);

      const { data: managedObras, error: obrasError } = await supabase
        .from('obras')
        .select('id')
        .eq('encarregado_id', adminUser.id);

      if (obrasError) throw obrasError;

      const obraIds = managedObras.map(o => o.id);
      if (obraIds.length === 0) {
        setCorrections([]);
        return;
      }

      let query = supabase
        .from('correcoes_ponto')
        .select(`
          id,
          data_solicitacao,
          data_correcao,
          hora_inicio_sugerida,
          hora_fim_sugerida,
          justificacao,
          status,
          usuarios ( id, nome, funcao ),
          obras ( id, nome )
        `)
        .in('obra_id', obraIds)
        .gte('data_solicitacao', fromDate.toISOString())
        .lte('data_solicitacao', toDate.toISOString())
        .order('data_solicitacao', { ascending: false });

      if (statusFilter !== 'Todos') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCorrections(data);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as correções.' });
    } finally {
      setIsLoading(false);
    }
  }, [adminUser.id, statusFilter, selectedMonth, toast]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const handleStatusUpdate = async (correctionId, newStatus) => {
    try {
      const { error } = await supabase
        .from('correcoes_ponto')
        .update({ status: newStatus, validado_por: adminUser.id, data_validacao: new Date().toISOString() })
        .eq('id', correctionId);
  
      if (error) throw error;
  
      setCorrections(prev => prev.map(c => c.id === correctionId ? { ...c, status: newStatus } : c));
      toast({ variant: 'success', title: 'Sucesso!', description: `Correção ${newStatus.toLowerCase()} com sucesso.` });
      fetchCorrections();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o estado da correção.' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Correções Pendentes | Gestão de Ponto</title>
        <meta name="description" content="Aprove ou rejeite correções de ponto submetidas pelos trabalhadores." />
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto p-4 sm:p-6">
        <Card className="bg-gradient-to-br from-card to-muted/30 border-primary/20 shadow-lg">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-3xl font-bold flex items-center gap-3"><Wrench className="h-8 w-8 text-primary" />Gerir Correções</CardTitle>
              <CardDescription>Valide os pedidos de correção de ponto dos colaboradores.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
              <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : corrections.length === 0 ? (
              <div className="text-center py-10 px-4 bg-muted/50 rounded-lg">
                <AlertCircle className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-medium">Nenhuma correção encontrada</h3>
                <p className="mt-1 text-sm text-muted-foreground">Não há correções com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Data Correção</TableHead>
                      <TableHead>Horas Sugeridas</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corrections.map((correction) => (
                      <TableRow key={correction.id} className={correction.status === 'Pendente' ? 'bg-yellow-500/10' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="font-medium">{correction.usuarios.nome}</div>
                          </div>
                          <div className="text-xs text-muted-foreground ml-6">{correction.usuarios.funcao}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(correction.data_correcao)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">{formatTime(correction.hora_inicio_sugerida)} - {formatTime(correction.hora_fim_sugerida)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {correction.obras.nome}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(correction.status)} className="capitalize">
                            {getStatusIcon(correction.status)}
                            {correction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <CorrectionActions correction={correction} onUpdateStatus={handleStatusUpdate} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default AdminAdjustmentsPage;