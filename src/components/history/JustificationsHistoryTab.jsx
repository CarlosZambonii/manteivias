import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Loader2, AlertCircle, PlusCircle, ChevronDown, Download, Edit, Trash2 } from 'lucide-react';
import { useOfflineManager } from '@/contexts/OfflineManager';
import * as XLSX from 'xlsx';

import JustificationForm from '@/components/justifications/JustificationForm';
import EditJustificationModal from '@/components/justifications/EditJustificationModal';

const getStatusVariant = (status) => ({ 'Aprovado': 'success', 'Rejeitado': 'destructive', 'Cancelado': 'secondary' }[status] || 'secondary');

const monthsList = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const JustificationsHistoryTab = ({ month }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isOnline, getOfflineData } = useOfflineManager();
  
  const [justifications, setJustifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState([new Date(month || new Date()).getMonth()]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Edit and Delete states
  const [editingJustification, setEditingJustification] = useState(null);
  const [deletingJustification, setDeletingJustification] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract primitives to avoid infinite loops
  const selectedMonthsStr = selectedMonths.join(',');
  const year = new Date(month || new Date()).getFullYear();

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

  const fetchJustifications = useCallback(async () => {
    if (selectedMonths.length === 0) {
        setJustifications([]);
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    try {
        const minMonth = Math.min(...selectedMonths);
        const maxMonth = Math.max(...selectedMonths);

        const fromDate = startOfMonth(new Date(year, minMonth));
        const toDate = endOfMonth(new Date(year, maxMonth));

        let data = [];
        if (isOnline) {
            const { data: remoteData, error } = await supabase
                .from('justificação')
                .select(`id, data_envio, status_validacao, comentario, dias, tipo_justificação_id, anexo_url, usuario_id, tipos_justificação(nome, codigo)`)
                .eq('usuario_id', user.id)
                .gte('data_envio', fromDate.toISOString())
                .lte('data_envio', toDate.toISOString());
            if (error) throw error;
            data = remoteData || [];
        } else {
            const offlineData = await getOfflineData('justificação');
            data = (offlineData || []).filter(j => 
                j.usuario_id === user.id && 
                new Date(j.data_envio) >= fromDate && 
                new Date(j.data_envio) <= toDate
            );
        }

        const filtered = data.filter(j => {
            const jDate = parseISO(j.data_envio);
            return selectedMonths.includes(jDate.getMonth()) && jDate.getFullYear() === year;
        });

        setJustifications(filtered.sort((a,b) => new Date(b.data_envio) - new Date(a.data_envio)));
    } catch (error) {
        console.error("Error fetching justifications:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as justificações.' });
    } finally {
        setIsLoading(false);
    }
  }, [user?.id, selectedMonthsStr, year, isOnline, toast, getOfflineData]);

  useEffect(() => { 
      fetchJustifications(); 
  }, [fetchJustifications]);

  const confirmDelete = async () => {
    if (!deletingJustification) return;
    setIsDeleting(true);
    try {
        const { error } = await supabase
            .from('justificação')
            .update({ status_validacao: 'Cancelado' })
            .eq('id', deletingJustification.id);
        
        if (error) throw error;

        toast({ title: 'Sucesso', description: 'Justificação cancelada com sucesso.' });
        setDeletingJustification(null);
        fetchJustifications();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao cancelar justificação: ' + error.message });
    } finally {
        setIsDeleting(false);
    }
  };

  const handleExportXLSX = () => {
    if (!isOnline) {
        toast({ variant: 'destructive', title: 'Modo Offline', description: 'A exportação requer ligação à internet.' });
        return;
    }
    if (justifications.length === 0) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não há dados para exportar.' });
        return;
    }

    const exportData = justifications.map(j => ({
        'Data do Pedido': format(parseISO(j.data_envio), 'dd/MM/yyyy'),
        'Tipo': j.tipos_justificação?.nome || '-',
        'Dias': j.dias ? j.dias.map(d => format(parseISO(d), 'dd/MM/yyyy')).join(', ') : '-',
        'Status': j.status_validacao
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Justificações");
    XLSX.writeFile(workbook, `historico_justificacoes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
      <div className="flex flex-col h-full">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <Button 
                onClick={() => setIsModalOpen(true)} 
                className="w-full md:w-auto h-11 md:h-10 text-sm shadow-sm hover:shadow-md transition-shadow"
            >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Justificação
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
                          id="all-months-just" 
                          checked={selectedMonths.length === 12}
                          onCheckedChange={handleToggleAllMonths}
                        />
                        <label htmlFor="all-months-just" className="text-sm font-medium leading-none cursor-pointer">
                          Todos os Meses
                        </label>
                      </div>
                      <ScrollArea className="h-64">
                        <div className="flex flex-col space-y-3 pt-2 pb-2 px-1">
                          {monthsList.map((mName, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`month-just-${idx}`} 
                                checked={selectedMonths.includes(idx)}
                                onCheckedChange={() => handleToggleMonth(idx)}
                              />
                              <label htmlFor={`month-just-${idx}`} className="text-sm font-medium leading-none cursor-pointer">
                                {mName}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button 
                    variant="outline" 
                    onClick={handleExportXLSX}
                    disabled={!isOnline || justifications.length === 0}
                    className={`w-full sm:w-auto h-11 md:h-10 px-4 ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!isOnline ? "A exportação requer ligação à internet" : "Exportar para XLSX"}
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                </Button>
            </div>
         </div>

         {isLoading ? (
            <div className="flex justify-center h-48 items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
         ) : justifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                <h3 className="text-lg font-semibold">Nenhuma justificação</h3>
                <p className="text-muted-foreground text-sm mt-1">Não há justificações para os meses selecionados.</p>
            </div>
         ) : (
             <div className="space-y-4">
                <div className="hidden md:block rounded-lg border overflow-hidden bg-card">
                   <Table>
                       <TableHeader>
                           <TableRow className="bg-muted/50 hover:bg-muted/50">
                               <TableHead className="font-semibold">Data do Pedido</TableHead>
                               <TableHead className="font-semibold">Tipo</TableHead>
                               <TableHead className="font-semibold">Dias</TableHead>
                               <TableHead className="font-semibold">Status</TableHead>
                               <TableHead className="font-semibold text-right">Ações</TableHead>
                           </TableRow>
                       </TableHeader>
                       <TableBody>
                           {justifications.map(j => {
                               const canModify = j.status_validacao !== 'Aprovado' && j.status_validacao !== 'Cancelado';
                               return (
                               <TableRow key={j.id} className={`hover:bg-muted/30 ${!canModify && j.status_validacao === 'Cancelado' ? 'opacity-60 bg-muted/20' : ''}`}>
                                   <TableCell>{format(parseISO(j.data_envio), 'dd/MM/yyyy', { locale: pt })}</TableCell>
                                   <TableCell className="font-medium">{j.tipos_justificação?.nome || '-'}</TableCell>
                                   <TableCell className="text-muted-foreground">
                                       {j.dias ? j.dias.map(d => format(parseISO(d), 'dd/MM')).join(', ') : '-'}
                                   </TableCell>
                                   <TableCell>
                                       <Badge variant={getStatusVariant(j.status_validacao)}>{j.status_validacao}</Badge>
                                   </TableCell>
                                   <TableCell className="text-right">
                                        {canModify ? (
                                            <div className="flex justify-end items-center gap-1.5">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => setEditingJustification(j)}
                                                    title="Editar justificação"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => setDeletingJustification(j)}
                                                    title="Apagar justificação"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">-</span>
                                        )}
                                   </TableCell>
                               </TableRow>
                           )})}
                       </TableBody>
                   </Table>
                </div>
                
                {/* Mobile Cards */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                   {justifications.map(j => {
                       const canModify = j.status_validacao !== 'Aprovado' && j.status_validacao !== 'Cancelado';
                       return (
                       <div key={j.id} className={`bg-card border p-4 rounded-xl shadow-sm flex flex-col gap-3 ${!canModify && j.status_validacao === 'Cancelado' ? 'opacity-60 bg-muted/20' : ''}`}>
                           <div className="flex justify-between items-start">
                               <span className="font-semibold text-sm">{j.tipos_justificação?.nome || '-'}</span>
                               <Badge variant={getStatusVariant(j.status_validacao)} className="text-[10px] uppercase">
                                   {j.status_validacao}
                               </Badge>
                           </div>
                           <div className="flex flex-col gap-1 text-xs text-muted-foreground border-t pt-2 mt-1">
                               <div className="flex justify-between">
                                   <span className="font-medium text-foreground/70">Pedido em:</span>
                                   <span>{format(parseISO(j.data_envio), 'dd/MM/yyyy')}</span>
                               </div>
                               <div className="flex justify-between">
                                   <span className="font-medium text-foreground/70">Dias:</span>
                                   <span className="max-w-[60%] text-right truncate" title={j.dias ? j.dias.map(d => format(parseISO(d), 'dd/MM')).join(', ') : ''}>
                                       {j.dias ? j.dias.map(d => format(parseISO(d), 'dd/MM')).join(', ') : '-'}
                                   </span>
                               </div>
                           </div>
                           {canModify && (
                               <div className="flex justify-end gap-2 mt-2 pt-3 border-t">
                                   <Button variant="outline" size="sm" onClick={() => setEditingJustification(j)} className="h-8 text-xs gap-1.5 border-blue-200 hover:bg-blue-50">
                                       <Edit className="h-3.5 w-3.5 text-blue-500" /> Editar
                                   </Button>
                                   <Button variant="outline" size="sm" onClick={() => setDeletingJustification(j)} className="h-8 text-xs gap-1.5 border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50">
                                       <Trash2 className="h-3.5 w-3.5" /> Apagar
                                   </Button>
                               </div>
                           )}
                       </div>
                   )})}
                </div>
             </div>
         )}

         {/* Modals and Dialogs */}
         <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto px-4 py-6 md:px-8 custom-scrollbar rounded-2xl">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl md:text-2xl font-bold">Nova Justificação</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <JustificationForm 
                        isModal={true}
                        onSuccess={() => {
                            setIsModalOpen(false);
                            fetchJustifications();
                        }}
                    />
                </div>
            </DialogContent>
         </Dialog>

        {/* Edit Modal */}
        {editingJustification && (
            <EditJustificationModal
                isOpen={!!editingJustification}
                onOpenChange={(open) => !open && setEditingJustification(null)}
                justification={editingJustification}
                onSuccess={() => {
                    setEditingJustification(null);
                    fetchJustifications();
                }}
            />
        )}

        {/* Delete Confirmation Alert */}
        <AlertDialog open={!!deletingJustification} onOpenChange={(open) => !open && setDeletingJustification(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Justificação</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja cancelar esta justificação? Ela será marcada como "Cancelada" no histórico e esta ação não poderá ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Voltar</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => { e.preventDefault(); confirmDelete(); }} 
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Confirmar Cancelamento
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
  );
};

export default JustificationsHistoryTab;