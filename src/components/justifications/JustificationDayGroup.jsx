import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, CalendarDays, FileText, Paperclip, Download, WifiOff, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useOfflineManager } from '@/contexts/OfflineManager';
import { cn } from '@/lib/utils';
import JustificationActions from './JustificationActions';

const getStatusConfig = (status) => {
    switch(status) {
        case 'Aprovado': return { color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', label: 'Aprovado' };
        case 'Rejeitado': return { color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', label: 'Rejeitado' };
        default: return { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', label: 'Pendente' };
    }
};

const AttachmentViewer = ({ url }) => {
  const { toast } = useToast();
  const { isOnline } = useOfflineManager();

  if (!url) return null;

  if (!isOnline) return <Button variant="outline" size="sm" disabled className="w-full justify-start h-8 text-xs"><WifiOff className="mr-2 h-3 w-3" /> Offline</Button>;

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
        <Button variant="outline" size="sm" className="h-8 text-xs gap-2 text-primary border-primary/20 hover:bg-primary/5">
          <Paperclip className="h-3 w-3" /> Ver Anexo
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

const JustificationDayGroup = ({ justification, onUpdateStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = getStatusConfig(justification.status_validacao);
  const days = justification.dias || [];
  const sortedDates = days.map(d => parseISO(d)).sort((a, b) => a - b);
  
  // Display date logic: if multiple days, show range or count
  const dateDisplay = sortedDates.length > 0 
    ? sortedDates.length === 1 
        ? format(sortedDates[0], "EEEE, d 'de' MMMM", { locale: pt })
        : `${format(sortedDates[0], "d MMM", { locale: pt })} - ${format(sortedDates[sortedDates.length - 1], "d MMM", { locale: pt })} (${sortedDates.length} dias)`
    : 'Sem data';

  return (
    <Card className={cn(
        "relative text-sm transition-all duration-200",
        justification.status_validacao === 'Pendente' ? "border-amber-200/50" : ""
    )}>
        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">
                    {justification.tipos_justificação?.nome || 'Geral'}
                </Badge>
                <span className="text-xs text-muted-foreground capitalize">
                    {dateDisplay}
                </span>
            </div>
        </CardHeader>
        
        <CardContent className="p-3 py-2 space-y-2">
            <div className="flex justify-between items-start gap-4">
                 <div className="flex-1">
                    {justification.comentario && (
                        <div className="flex items-start gap-2 text-muted-foreground bg-muted/30 p-2 rounded-md text-xs italic border border-border/50">
                            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{justification.comentario}</span>
                        </div>
                    )}
                 </div>
                 
                 <div className="flex flex-col items-end gap-2 shrink-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Badge variant="outline" className={cn("cursor-help text-[10px] px-2 py-0.5", statusConfig.color)}>
                              {statusConfig.label}
                           </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Validado por: {justification.validado_por || 'Sistema'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                 </div>
            </div>

            <div className="flex items-center justify-between pt-1">
                 {justification.anexo_url ? (
                     <AttachmentViewer url={justification.anexo_url} />
                 ) : (
                     <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                        <Paperclip className="h-3 w-3 opacity-50" /> Sem anexo
                     </span>
                 )}
                 
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 hover:bg-muted"
                    onClick={() => setIsExpanded(!isExpanded)}
                 >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                 </Button>
            </div>
        </CardContent>
        
        <AnimatePresence>
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t bg-muted/20"
                >
                    <div className="p-3 space-y-3">
                         {/* Full Days List */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Dias Justificados</span>
                            <div className="flex flex-wrap gap-1">
                                {sortedDates.map((date, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] font-normal bg-background border border-border/50">
                                        {format(date, "d/MM/yyyy", { locale: pt })}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Full Comment */}
                        {justification.comentario && (
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-semibold uppercase text-muted-foreground">Comentário Completo</span>
                                <p className="text-xs text-foreground bg-background p-2 rounded border border-border/50">
                                    {justification.comentario}
                                </p>
                            </div>
                        )}

                        <JustificationActions 
                            justification={justification} 
                            onUpdateStatus={onUpdateStatus} 
                            className="mt-0 pt-0 border-t-0"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </Card>
  );
};

export default JustificationDayGroup;