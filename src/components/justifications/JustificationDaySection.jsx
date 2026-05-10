import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, CalendarDays, Paperclip, AlertTriangle, Download, WifiOff, FileText, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt as ptLocale } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useOfflineManager } from '@/contexts/OfflineManager';
import { useLanguage } from '@/hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';

const RejectDialog = ({ open, onOpenChange, onConfirm, t }) => {
  const [comment, setComment] = useState('');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('justifications.rejectDialogTitle')}</DialogTitle>
          <DialogDescription>{t('justifications.rejectDialogSubtitle')}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="comment" className="mb-2 block">{t('common.reason')}</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('justifications.rejectPlaceholder')}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button variant="destructive" onClick={() => onConfirm(comment)} disabled={!comment}>{t('common.reject')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AttachmentDialog = ({ url, t }) => {
  const { isOnline } = useOfflineManager();
  const { toast } = useToast();

  if (!url) return null;

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!isOnline) {
      toast({ variant: 'outline', title: 'Offline', description: t('common.noAttachment') });
      return;
    }
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = url.split('/').pop().split('?')[0];
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: t('common.success'), description: 'Download iniciado.' });
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: 'Falha ao baixar anexo.' });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-primary/20 text-primary hover:bg-primary/5">
          <Paperclip className="h-3 w-3" /> {t('common.viewAttachment')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('common.viewAttachment')}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center p-4 bg-muted/30 rounded-lg min-h-[200px] items-center">
          <img
            src={url}
            alt="Anexo"
            className="max-h-[60vh] w-auto rounded shadow-sm object-contain"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div style={{ display: 'none' }} className="flex-col items-center gap-2 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-50" />
            <span className="text-sm">Visualização indisponível</span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleDownload} className="w-full sm:w-auto gap-2">
            <Download className="h-4 w-4" /> {t('common.download')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const JustificationDaySection = ({ justification, onUpdateStatus, onEdit, onDelete }) => {
  const { user, isAdmin, isReadOnlyAdmin } = useAuth();
  const { t } = useLanguage();
  const [isRejecting, setIsRejecting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isPending = justification.status_validacao === 'Pendente';
  const isCancelled = justification.status_validacao === 'Cancelado';
  const days = justification.dias || [];
  const sortedDates = days.map(d => parseISO(d)).sort((a, b) => a - b);

  const dateDisplay = sortedDates.length > 0
    ? sortedDates.length === 1
      ? format(sortedDates[0], "d 'de' MMM", { locale: ptLocale })
      : `${format(sortedDates[0], "d MMM", { locale: ptLocale })} - ${format(sortedDates[sortedDates.length - 1], "d MMM", { locale: ptLocale })} (${sortedDates.length} dias)`
    : 'Sem data';

  const handleAction = async (status, comment = null) => {
    setIsProcessing(true);
    try {
      if (onUpdateStatus) await onUpdateStatus(justification, status, comment);
    } finally {
      setIsProcessing(false);
      setIsRejecting(false);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(justification);
    else window.dispatchEvent(new CustomEvent('request-edit-justification', { detail: justification }));
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(justification);
    else window.dispatchEvent(new CustomEvent('request-delete-justification', { detail: justification }));
  };

  return (
    <Card className={`relative text-sm transition-all duration-200 hover:shadow-md ${isPending ? 'border-amber-200/60 bg-amber-50/10' : ''} ${isCancelled ? 'opacity-60 bg-muted/30' : ''}`}>
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize shadow-sm">
            {justification.tipos_justificação?.nome || 'Geral'}
          </Badge>
          <span className="text-muted-foreground text-xs flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {dateDisplay}
          </span>
        </div>
        {!isPending && (
          <Badge variant={justification.status_validacao === 'Aprovado' ? 'success' : isCancelled ? 'secondary' : 'destructive'} className="shadow-sm">
            {t(`status.${justification.status_validacao}`) || justification.status_validacao}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-3 py-2 space-y-2">
        <div className="bg-muted/30 p-2.5 rounded-md border border-border/40">
          <p className={`text-xs text-muted-foreground italic leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
            "{justification.comentario || t('justifications.withoutComment')}"
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            {justification.anexo_url ? (
              <AttachmentDialog url={justification.anexo_url} t={t} />
            ) : (
              <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 px-1">
                <WifiOff className="h-3 w-3" /> {t('common.noAttachment')}
              </span>
            )}
          </div>

          {(justification.comentario?.length > 60 || sortedDates.length > 1) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pt-2 border-t mt-2"
            >
              <div className="text-xs space-y-2">
                <div>
                  <span className="font-semibold text-muted-foreground block mb-1">{t('justifications.daysIncluded')}</span>
                  <div className="flex flex-wrap gap-1">
                    {sortedDates.map((d, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] font-normal bg-background border border-border/60">
                        {format(d, "dd/MM/yyyy")}
                      </Badge>
                    ))}
                  </div>
                </div>
                {justification.status_validacao === 'Rejeitado' && justification.rejeicao_comentario && (
                  <div className="bg-red-50 text-red-600 p-2 rounded border border-red-100">
                    <span className="font-bold block text-[10px] uppercase">{t('justifications.rejectReasonLabel')}</span>
                    {justification.rejeicao_comentario}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="p-3 pt-0 flex justify-between gap-2 border-t mt-2">
        <div className="flex items-center gap-1.5">
          {!isCancelled && (justification.usuario_id === user?.id || (isAdmin && !isReadOnlyAdmin)) && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-600" onClick={handleEditClick}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50" onClick={handleDeleteClick}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>

        {isPending && !isReadOnlyAdmin && onUpdateStatus && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={() => setIsRejecting(true)}
              disabled={isProcessing}
            >
              {t('common.reject')}
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-green-600 hover:bg-green-700 shadow-sm transition-all hover:shadow"
              onClick={() => handleAction('Aprovado')}
              disabled={isProcessing}
            >
              {t('common.approve')}
            </Button>
          </div>
        )}
      </CardFooter>

      <RejectDialog
        open={isRejecting}
        onOpenChange={setIsRejecting}
        onConfirm={(comment) => handleAction('Rejeitado', comment)}
        t={t}
      />
    </Card>
  );
};

export default JustificationDaySection;
