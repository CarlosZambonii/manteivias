import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, CalendarDays, FileText, MessageSquare, Paperclip, Download, WifiOff, Edit, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import JustificationActions from './JustificationActions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useOfflineManager } from '@/contexts/OfflineManager';

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
};

const formatDate = (dateString) => dateString ? format(parseISO(dateString), 'dd/MM/yyyy', { locale: pt }) : '-';

const getStatusConfig = (status) => {
    switch(status) {
        case 'Aprovado': return { color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', label: 'Aprovado' };
        case 'Rejeitado': return { color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', label: 'Rejeitado' };
        case 'Cancelado': return { color: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 opacity-70', label: 'Cancelado' };
        default: return { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', label: 'Pendente' };
    }
};

const AttachmentViewer = ({ url }) => {
  const { toast } = useToast();
  const { isOnline } = useOfflineManager();

  if (!url) return null;

  if (!isOnline) return <Button variant="outline" size="sm" disabled className="w-full justify-start"><WifiOff className="mr-2 h-4 w-4" /> Anexo (Offline)</Button>;

  const handleDownload = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro na rede.');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const fileName = url.split('/').pop().split('?')[0];
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast({ title: 'Sucesso', description: 'Download iniciado.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao baixar anexo.' });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto justify-start text-primary border-primary/20 hover:bg-primary/5">
          <Paperclip className="mr-2 h-4 w-4" /> Ver Anexo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Anexo da Justificação</DialogTitle>
        </DialogHeader>
        <div className="my-4 flex justify-center bg-muted/30 rounded-lg p-4">
            <img 
                src={url} 
                alt="Anexo" 
                className="max-h-[60vh] w-auto rounded-md object-contain shadow-sm" 
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display='flex' }} 
            />
            <div style={{display: 'none'}} className="flex-col items-center justify-center p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Pré-visualização indisponível.</p>
            </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
           <Button onClick={handleDownload} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Baixar
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const JustificationCard = ({ justification, onUpdateStatus, onEdit, onDelete, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const employee = justification.usuarios;
  const statusConfig = getStatusConfig(justification.status_validacao);
  const days = justification.dias || [];
  const sortedDates = days.map(d => parseISO(d)).sort((a, b) => a - b);
  
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(justification);
    else window.dispatchEvent(new CustomEvent('request-edit-justification', { detail: justification }));
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(justification);
    else window.dispatchEvent(new CustomEvent('request-delete-justification', { detail: justification }));
  };

  const canModify = ['Pendente', 'Rejeitado'].includes(justification.status_validacao);

  return (
    <Card className={cn("overflow-hidden border border-border/60 shadow-sm hover:shadow-lg transition-all duration-300 bg-card group", justification.status_validacao === 'Cancelado' && 'opacity-60 bg-muted/30', className)}>
      <CardContent className="p-0">
        <div 
          className="p-4 cursor-pointer hover:bg-muted/30 transition-colors relative"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border group-hover:border-primary/50 transition-colors">
                  <AvatarImage src={employee?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(employee?.nome)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-sm text-foreground leading-tight">
                    {employee?.nome || 'Colaborador Desconhecido'}
                  </h4>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {employee?.funcao || 'Funcionário'}
                  </span>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
                 <Badge variant="outline" className={cn("capitalize px-2 py-0.5 text-xs font-medium border shadow-sm", statusConfig.color)}>
                    {statusConfig.label}
                 </Badge>
                 <motion.div 
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                 >
                    <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                 </motion.div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-2 gap-3 pb-1">
             <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/40">
                <FileText className="h-4 w-4 text-blue-500" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Tipo</span>
                    <span className="text-sm font-medium truncate">{justification.tipos_justificação?.nome || 'Geral'}</span>
                </div>
             </div>
             <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/40">
                <CalendarDays className="h-4 w-4 text-orange-500" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Período</span>
                    <span className="text-sm font-medium truncate">{days.length} dia{days.length !== 1 ? 's' : ''}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="border-t border-border/50 bg-muted/10"
            >
              <div className="p-4 space-y-4">
                {/* Days List */}
                <div className="bg-background rounded-lg border border-border/50 p-3 shadow-sm">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-2">
                        <CalendarDays className="h-3 w-3" /> Detalhe dos Dias
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                        {sortedDates.map((date, idx) => (
                            <Badge key={idx} variant="secondary" className="font-normal text-xs bg-muted/60 hover:bg-muted">
                                {format(date, "d 'de' MMM", { locale: pt })}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Comment & Attachment */}
                <div className="space-y-3">
                    {justification.comentario && (
                        <div className="bg-background rounded-lg p-3 border border-border/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-muted-foreground uppercase">
                                <MessageSquare className="h-3 w-3" /> Motivo
                            </div>
                            <p className="text-sm text-foreground leading-relaxed italic">
                                "{justification.comentario}"
                            </p>
                        </div>
                    )}
                    
                    {justification.anexo_url && (
                        <AttachmentViewer url={justification.anexo_url} />
                    )}
                </div>

                {/* Actions & Modifications */}
                <div className="flex items-center justify-between pt-2">
                    {canModify ? (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleEdit} className="h-8 gap-1">
                                <Edit className="h-3.5 w-3.5" /> Editar
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleDelete} className="h-8 gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                                <Trash2 className="h-3.5 w-3.5" /> Apagar
                            </Button>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Ações não disponíveis</span>
                    )}

                    <div className="ml-auto">
                        <JustificationActions 
                            justification={justification} 
                            onUpdateStatus={onUpdateStatus} 
                        />
                    </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default JustificationCard;