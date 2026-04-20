import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Check, X, Clock, Info, FileText, CalendarDays, Paperclip, ExternalLink, XCircle, Loader2, AlertCircle, User, Download, FileSignature } from 'lucide-react';
import { useOfflineManager } from '@/contexts/OfflineManager';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import * as XLSX from 'xlsx';

const formatDate = (dateString) => dateString ? format(parseISO(dateString), 'dd/MM/yyyy', { locale: pt }) : '-';

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
};

const PeriodDisplay = ({ days }) => {
  if (!days || days.length === 0) return <span>-</span>;
  const sortedDates = days.map(d => parseISO(d)).sort((a, b) => a - b);
  if (sortedDates.length === 1) return <span>{formatDate(sortedDates[0].toISOString())}</span>;
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="link" className="p-0 h-auto font-normal min-h-[44px] sm:min-h-0 text-primary">{sortedDates.length} dias</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[425px] w-[95vw]">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" />Período da Justificação</DialogTitle></DialogHeader>
        <div className="max-h-60 overflow-y-auto pr-2"><ul className="list-disc pl-5 space-y-1 text-muted-foreground">{sortedDates.map(date => (<li key={date.toISOString()} className="text-sm">{format(date, 'PPP', { locale: pt })}</li>))}</ul></div>
        <DialogFooter className="mt-4"><DialogTrigger asChild><Button type="button" variant="secondary" className="w-full min-h-[44px]">Fechar</Button></DialogTrigger></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AttachmentViewer = ({ url }) => {
  if (!url) return <span className="text-muted-foreground text-xs">-</span>;
  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="min-h-[44px] md:min-h-0 w-full sm:w-auto"><Paperclip className="mr-2 h-4 w-4" /> Ver Anexo</Button></DialogTrigger>
      <DialogContent className="sm:max-w-lg w-[95vw] p-4 sm:p-6">
        <DialogHeader><DialogTitle>Visualizar Anexo</DialogTitle></DialogHeader>
        <div className="my-4">
          <a href={url} target="_blank" rel="noopener noreferrer" className="block p-2 sm:p-4 rounded-lg bg-muted/50 hover:bg-accent transition-colors border">
            <img src={url} alt="Anexo" className="max-h-60 sm:max-h-80 w-auto mx-auto rounded-md object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display='flex' }} />
            <div style={{display: 'none'}} className="items-center justify-center p-8 flex-col text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">Não é possível pré-visualizar este ficheiro. Clique para abrir.</p>
            </div>
          </a>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
           <DialogTrigger asChild><Button type="button" variant="secondary" className="w-full min-h-[44px]"><XCircle className="mr-2 h-4 w-4" /> Fechar</Button></DialogTrigger>
           <Button asChild className="w-full min-h-[44px]"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Abrir no navegador</a></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const getStatusVariant = (status) => ({ 'Aprovado': 'success', 'Rejeitado': 'destructive' }[status] || 'secondary');

const JustificationsHistoryTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline } = useOfflineManager();
  const [justifications, setJustifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [worksites, setWorksites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    worksiteId: 'all',
    employeeId: 'all',
    status: 'Todos',
    month: new Date(),
  });

  const fetchFiltersData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: worksitesData, error: worksitesError } = await supabase
        .from('obras')
        .select('id, nome');
      if (worksitesError) throw worksitesError;
      setWorksites(worksitesData || []);

      const { data: employeesData, error: employeesError } = await supabase
        .from('usuarios')
        .select('id, nome');
      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar filtros', description: error.message });
    }
  }, [user?.id, toast]);

  const fetchJustifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = startOfMonth(filters.month);
      const toDate = endOfMonth(filters.month);

      let query = supabase
        .from('justificação')
        .select(`
          id, 
          data_envio, 
          comentario, 
          status_validacao, 
          anexo_url, 
          dias, 
          data_validacao,
          tipos_justificação(nome), 
          usuarios!justificacao_usuario_id_fkey(id, nome, avatar_url)
        `)
        .gte('data_envio', fromDate.toISOString())
        .lte('data_envio', toDate.toISOString())
        .order('data_envio', { ascending: false });

      if (filters.employeeId !== 'all') {
        query = query.eq('usuario_id', filters.employeeId);
      }
      
      if (filters.status !== 'Todos') {
        query = query.eq('status_validacao', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (filters.worksiteId !== 'all' && data) {
        const { data: records, error: recordsError } = await supabase
          .from('registros_ponto')
          .select('usuario_id')
          .eq('obra_id', filters.worksiteId);
        if (recordsError) throw recordsError;
        const userIdsInWorksite = new Set(records.map(r => r.usuario_id));
        const filteredData = data.filter(j => j.usuarios && userIdsInWorksite.has(j.usuarios.id));
        setJustifications(filteredData);
      } else {
        setJustifications(data || []);
      }

    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as justificações.' });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);

  useEffect(() => {
    fetchJustifications();
  }, [fetchJustifications]);

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
    if (!justifications || justifications.length === 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para exportar.' });
      return;
    }

    const exportData = justifications.map(j => ({
      colaborador: j.usuarios?.nome || 'N/A',
      data_envio: j.data_envio ? format(parseISO(j.data_envio), 'yyyy-MM-dd HH:mm') : '',
      tipo: j.tipos_justificação?.nome || '',
      dias: Array.isArray(j.dias) ? j.dias.join(', ') : '',
      comentario: j.comentario || '',
      status: j.status_validacao || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Justificações");
    XLSX.writeFile(workbook, `historico_justificacoes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => subMonths(new Date(), i));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col gap-3 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={filters.worksiteId} onValueChange={(v) => handleFilterChange('worksiteId', v)}>
              <SelectTrigger className="h-11 md:h-10"><SelectValue placeholder="Filtrar por obra..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Obras</SelectItem>
                {worksites.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.employeeId} onValueChange={(v) => handleFilterChange('employeeId', v)}>
              <SelectTrigger className="h-11 md:h-10"><SelectValue placeholder="Filtrar por colaborador..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Colaboradores</SelectItem>
                {employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
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
          <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleExportXLSX}
                disabled={!isOnline || justifications.length === 0}
                className={`w-full md:w-auto h-11 md:h-10 px-4 ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={!isOnline ? "A exportação requer ligação à internet" : "Exportar para XLSX"}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
          </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : justifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4 border border-dashed rounded-lg bg-muted/20">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold">Nenhuma justificação encontrada</h3>
          <p className="text-muted-foreground text-sm mt-1">Não há justificações para os filtros selecionados.</p>
        </div>
      ) : (
        <>
            {/* Desktop Table View */}
            <div className="rounded-lg border overflow-hidden hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Data Envio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Anexo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {justifications.map((justification) => (
                    <TableRow key={justification.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                             <AvatarImage src={justification.usuarios?.avatar_url} loading="lazy" />
                             <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(justification.usuarios?.nome)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{justification.usuarios?.nome || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(justification.data_envio)}</TableCell>
                      <TableCell>{justification.tipos_justificação?.nome || 'N/A'}</TableCell>
                      <TableCell><PeriodDisplay days={justification.dias} /></TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(justification.status_validacao)} className="capitalize">
                          {justification.status_validacao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right"><AttachmentViewer url={justification.anexo_url} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
                {justifications.map((justification) => (
                    <div key={justification.id} className="bg-card rounded-lg border p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: justification.status_validacao === 'Aprovado' ? '#22c55e' : justification.status_validacao === 'Rejeitado' ? '#ef4444' : '#eab308' }} />
                        <div className="flex items-center justify-between pl-2">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                    <AvatarImage src={justification.usuarios?.avatar_url} loading="lazy" />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                        {getInitials(justification.usuarios?.nome)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-base line-clamp-1">{justification.usuarios?.nome}</h4>
                                    <span className="text-xs text-muted-foreground">Enviado a {formatDate(justification.data_envio)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-md p-3 text-sm">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Tipo</span>
                                <div className="flex items-center gap-1.5 font-medium">
                                    <FileSignature className="h-4 w-4 text-primary" />
                                    <span className="line-clamp-1">{justification.tipos_justificação?.nome}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Status</span>
                                <div><Badge variant={getStatusVariant(justification.status_validacao)}>{justification.status_validacao}</Badge></div>
                            </div>
                            <div className="flex flex-col gap-1 col-span-2 border-t pt-2 mt-1">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Período</span>
                                <PeriodDisplay days={justification.dias} />
                            </div>
                            {justification.comentario && (
                                <div className="flex flex-col gap-1 col-span-2 border-t pt-2">
                                    <span className="text-xs text-muted-foreground uppercase font-semibold">Comentário</span>
                                    <p className="text-sm italic text-foreground/80 bg-background/50 p-2 rounded border border-dashed">"{justification.comentario}"</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 flex justify-end">
                             <AttachmentViewer url={justification.anexo_url} />
                        </div>
                    </div>
                ))}
            </div>
        </>
      )}
    </motion.div>
  );
};

export default JustificationsHistoryTab;