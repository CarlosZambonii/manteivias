import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Check, X, Clock, Info, MapPin, Loader2, AlertCircle, PlusCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TimePicker from '@/components/TimePicker';

const formatDate = (dateString) => dateString ? format(parseISO(dateString), 'dd/MM/yyyy', { locale: pt }) : '-';
const formatTime = (timeString) => timeString ? format(parseISO(`2000-01-01T${timeString}`), 'HH:mm', { locale: pt }) : '-';

const getStatusVariant = (status) => ({ 'Aprovado': 'success', 'Rejeitado': 'destructive' }[status] || 'secondary');
const getStatusIcon = (status) => {
  const components = { 'Aprovado': <Check className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />, 'Rejeitado': <X className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />, 'Pendente': <Clock className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> };
  return components[status] || <Info className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />;
};

const CorrectionsHistoryTab = ({ month }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [corrections, setCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [obras, setObras] = useState([]);

  // New correction form state
  const [newCorrection, setNewCorrection] = useState({
    data_correcao: format(new Date(), 'yyyy-MM-dd'),
    hora_inicio_sugerida: '08:00',
    hora_fim_sugerida: '17:00',
    turno: 'Dia Inteiro',
    obra_id: '',
    justificacao: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchObras = useCallback(async () => {
    const { data } = await supabase.from('obras').select('id, nome').eq('status', 'em execução');
    if (data) setObras(data);
  }, []);

  const fetchCorrections = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = startOfMonth(month);
      const toDate = endOfMonth(month);
      
      let query = supabase
        .from('correcoes_ponto')
        .select(`id, data_solicitacao, data_correcao, hora_inicio_sugerida, hora_fim_sugerida, turno, obras(nome), tipo, status, justificacao`)
        .eq('usuario_id', user.id)
        .gte('data_solicitacao', fromDate.toISOString())
        .lte('data_solicitacao', toDate.toISOString())
        .order('data_solicitacao', { ascending: false });

      if (statusFilter !== 'Todos') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCorrections(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as correções.' });
    } finally {
      setIsLoading(false);
    }
  }, [user.id, statusFilter, month, toast]);

  useEffect(() => {
    fetchCorrections();
    fetchObras();
  }, [fetchCorrections, fetchObras]);

  const handleTurnoChange = (val) => {
    let updates = { turno: val };
    if (val === 'Dia Inteiro') {
      updates.hora_inicio_sugerida = '08:00';
      updates.hora_fim_sugerida = '17:00';
    } else if (val === 'Manhã') {
      updates.hora_inicio_sugerida = '08:00';
      updates.hora_fim_sugerida = '12:00';
    } else if (val === 'Tarde') {
      updates.hora_inicio_sugerida = '13:00';
      updates.hora_fim_sugerida = '17:00';
    }
    setNewCorrection({ ...newCorrection, ...updates });
  };

  const handleNewCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!newCorrection.obra_id) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Selecione uma obra.' });
        return;
    }
    if (newCorrection.hora_inicio_sugerida && newCorrection.hora_fim_sugerida && newCorrection.hora_inicio_sugerida > newCorrection.hora_fim_sugerida) {
        toast({ variant: 'destructive', title: 'Horário Inválido', description: 'A hora de saída não pode ser anterior à hora de entrada.' });
        return;
    }
    setIsSubmitting(true);
    try {
        const payload = {
            usuario_id: user.id,
            obra_id: newCorrection.obra_id,
            data_correcao: newCorrection.data_correcao,
            hora_inicio_sugerida: newCorrection.hora_inicio_sugerida,
            hora_fim_sugerida: newCorrection.hora_fim_sugerida,
            turno: newCorrection.turno,
            tipo: 'Adição',
            status: 'Pendente',
            justificacao: newCorrection.justificacao,
            data_solicitacao: new Date().toISOString()
        };

        const { error } = await supabase.from('correcoes_ponto').insert([payload]);
        if (error) throw error;

        toast({ title: 'Sucesso', description: 'Pedido de correção enviado.' });
        setIsNewDialogOpen(false);
        fetchCorrections();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao enviar', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  const groupedCorrections = useMemo(() => {
      const groups = {};
      corrections.forEach(corr => {
          const key = corr.data_correcao;
          if (!groups[key]) groups[key] = [];
          groups[key].push(corr);
      });
      return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [corrections]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between mb-3 md:mb-4 gap-2 md:gap-4">
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-9 md:h-10 text-xs md:text-sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Correção / Registo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden rounded-xl bg-background">
                <form onSubmit={handleNewCorrectionSubmit} className="flex flex-col h-full max-h-[90vh]">
                    <DialogHeader className="px-4 py-3 md:px-5 md:py-4 border-b shrink-0 bg-muted/10">
                        <DialogTitle className="text-base md:text-lg text-primary">Pedir Correção</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 space-y-3 md:space-y-4">
                        <div className="grid gap-1">
                            <Label htmlFor="date" className="text-xs font-medium">Data</Label>
                            <Input 
                                id="date" 
                                type="date" 
                                required
                                value={newCorrection.data_correcao}
                                onChange={(e) => setNewCorrection({...newCorrection, data_correcao: e.target.value})}
                                className="h-8 md:h-9 text-xs md:text-sm"
                            />
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="turno" className="text-xs font-medium">Turno / Tipo</Label>
                            <Select 
                                value={newCorrection.turno} 
                                onValueChange={handleTurnoChange}
                            >
                                <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dia Inteiro" className="text-xs md:text-sm">Dia Inteiro</SelectItem>
                                    <SelectItem value="Manhã" className="text-xs md:text-sm">Manhã</SelectItem>
                                    <SelectItem value="Tarde" className="text-xs md:text-sm">Tarde</SelectItem>
                                    <SelectItem value="Extra" className="text-xs md:text-sm">Extra</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1">
                                <Label htmlFor="start" className="text-xs font-medium">Hora Início</Label>
                                <TimePicker
                                    value={newCorrection.hora_inicio_sugerida}
                                    onChange={(val) => setNewCorrection({...newCorrection, hora_inicio_sugerida: val})}
                                    className="h-8 md:h-9 text-xs md:text-sm"
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label htmlFor="end" className="text-xs font-medium">Hora Fim</Label>
                                <TimePicker
                                    value={newCorrection.hora_fim_sugerida}
                                    onChange={(val) => setNewCorrection({...newCorrection, hora_fim_sugerida: val})}
                                    className="h-8 md:h-9 text-xs md:text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid gap-1">
                            <Label className="text-xs font-medium">Obra</Label>
                            <Select 
                                value={newCorrection.obra_id} 
                                onValueChange={(val) => setNewCorrection({...newCorrection, obra_id: val})}
                            >
                                <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm"><SelectValue placeholder="Selecione a obra" /></SelectTrigger>
                                <SelectContent className="max-h-48">
                                    {obras.map(o => <SelectItem key={o.id} value={o.id.toString()} className="text-xs md:text-sm">{o.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1">
                            <Label htmlFor="justificacao" className="text-xs font-medium">Justificação (opcional)</Label>
                            <Textarea 
                                id="justificacao" 
                                placeholder="Motivo do pedido..."
                                value={newCorrection.justificacao}
                                onChange={(e) => setNewCorrection({...newCorrection, justificacao: e.target.value})}
                                className="min-h-[60px] h-[60px] text-xs md:text-sm resize-none"
                            />
                        </div>
                    </div>
                    
                    <DialogFooter className="px-4 py-3 md:px-5 md:py-3 border-t bg-muted/20 shrink-0 gap-2 sm:gap-0 sm:space-x-2 mt-0">
                        <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)} className="h-8 md:h-9 text-xs md:text-sm w-full sm:w-auto">Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting} className="h-8 md:h-9 text-xs md:text-sm w-full sm:w-auto">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Pedido'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 md:h-10 text-xs md:text-sm">
            <SelectValue placeholder="Filtrar por estado..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos" className="text-xs md:text-sm">Todos</SelectItem>
            <SelectItem value="Pendente" className="text-xs md:text-sm">Pendente</SelectItem>
            <SelectItem value="Aprovado" className="text-xs md:text-sm">Aprovado</SelectItem>
            <SelectItem value="Rejeitado" className="text-xs md:text-sm">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 md:h-64"><Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" /></div>
      ) : groupedCorrections.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 md:h-64 text-center p-4">
          <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4 opacity-50" />
          <h3 className="text-base md:text-lg font-semibold">Nenhuma correção encontrada</h3>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Não há pedidos para o filtro selecionado.</p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-4">
            <Accordion type="multiple" className="w-full space-y-2">
                {groupedCorrections.map(([dateKey, dayCorrections]) => (
                    <AccordionItem key={dateKey} value={dateKey} className="border rounded-lg md:rounded-xl bg-card overflow-hidden shadow-sm">
                        <AccordionTrigger className="px-3 py-2 md:px-4 md:py-3 hover:bg-muted/50 transition-colors [&[data-state=open]>div>svg]:rotate-180">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full pr-2 md:pr-4 gap-2 sm:gap-0">
                                <span className="font-semibold text-sm md:text-lg text-left">{formatDate(dateKey)}</span>
                                <div className="flex flex-wrap items-center gap-1 md:gap-2">
                                    <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0 md:py-0.5">{dayCorrections.length} pedido(s)</Badge>
                                    {dayCorrections.some(c => c.status === 'Pendente') && <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 md:px-2.5 py-0 md:py-0.5 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">Pendente(s)</Badge>}
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="bg-muted/20 p-0 border-t">
                            <div className="w-full overflow-x-auto no-scrollbar">
                                <Table className="min-w-[450px] w-full">
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-xs md:text-sm py-2 md:py-3 px-3 md:px-4">Turno</TableHead>
                                            <TableHead className="text-xs md:text-sm py-2 md:py-3 px-3 md:px-4">Horas Sugeridas</TableHead>
                                            <TableHead className="text-xs md:text-sm py-2 md:py-3 px-3 md:px-4">Obra</TableHead>
                                            <TableHead className="text-xs md:text-sm py-2 md:py-3 px-3 md:px-4 text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dayCorrections.map((correction) => (
                                            <TableRow key={correction.id}>
                                                <TableCell className="capitalize text-xs md:text-sm py-2 md:py-3 px-3 md:px-4">{correction.turno || '-'}</TableCell>
                                                <TableCell className="py-2 md:py-3 px-3 md:px-4">
                                                    <div className="flex flex-col font-mono text-[10px] md:text-sm text-muted-foreground whitespace-nowrap">
                                                        <span>{formatTime(correction.hora_inicio_sugerida)} - {formatTime(correction.hora_fim_sugerida)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 md:py-3 px-3 md:px-4">
                                                    <div className="flex items-center gap-1 md:gap-1.5">
                                                        <MapPin className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="truncate max-w-[120px] md:max-w-[180px] text-xs md:text-sm" title={correction.obras?.nome}>{correction.obras?.nome || 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-2 md:py-3 px-3 md:px-4 text-right">
                                                    <Badge variant={getStatusVariant(correction.status)} className="capitalize text-[10px] md:text-xs whitespace-nowrap">
                                                        {getStatusIcon(correction.status)}
                                                        {correction.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
      )}
    </motion.div>
  );
};

export default CorrectionsHistoryTab;