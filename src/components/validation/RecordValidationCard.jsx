import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, X, MapPin, AlertTriangle, Trash2 } from 'lucide-react';
import { calculateDistance } from '@/utils/calculateDistance';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import RecordLocationMap from '@/components/records/RecordLocationMap';
import { format, parseISO } from 'date-fns';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { sendApprovalNotification } from '@/services/NotificationService';
import { useLanguage } from '@/hooks/useLanguage';

const formatTime = (isoString) => isoString ? format(parseISO(isoString), 'HH:mm') : '--:--';
const formatTimeStr = (str) => str ? str.substring(0, 5) : '--:--';

const ShiftBadge = ({ turno }) => {
  let color = 'bg-gray-100 text-gray-800';
  if (turno === 'Manha') color = 'bg-blue-100 text-blue-800';
  if (turno === 'Tarde') color = 'bg-orange-100 text-orange-800';
  if (turno === 'Extra') color = 'bg-purple-100 text-purple-800';
  return <Badge className={`${color} border-0 capitalize`}>{turno}</Badge>;
};

const LocationStatus = ({ record, t }) => {
  let isStartOnSite = false;
  let distance = null;

  if (record.dentro_raio_500m !== null && record.dentro_raio_500m !== undefined) {
    isStartOnSite = record.dentro_raio_500m;
    distance = record.distancia_metros;
  } else {
    const worksiteCoords = record.obra ? { lat: record.obra.latitude, lon: record.obra.longitude } : null;
    const startCoords = record.lat_inicio ? { lat: record.lat_inicio, lon: record.lon_inicio } : null;
    if (worksiteCoords && startCoords) {
      distance = calculateDistance(startCoords.lat, startCoords.lon, worksiteCoords.lat, worksiteCoords.lon);
      isStartOnSite = distance <= 500;
    }
  }

  const badgeColor = isStartOnSite ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  const badgeText = isStartOnSite ? t('records.onSite') : t('records.offSite');

  if (distance === null && !record.lat_inicio) {
    return <span className="text-xs text-muted-foreground italic">{t('records.noGps')}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`${badgeColor} border-transparent cursor-help text-[10px] px-1.5 py-0`}>
            {badgeText}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('records.distance')} {distance !== null ? `${Math.round(distance)}m` : t('common.na')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const RejectDialog = ({ open, onOpenChange, onConfirm, t }) => {
  const [comment, setComment] = useState('');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('records.rejectDialogTitle')}</DialogTitle>
          <DialogDescription>{t('records.rejectDialogSubtitle')}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="comment">{t('common.reason')}</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={t('records.rejectPlaceholder')}
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

const RecordValidationCard = ({ record, onUpdateStatus, onDeleteSuccess }) => {
  const { user, isReadOnlyAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { hasPermission } = useAdminPermissions();
  const [isRejecting, setIsRejecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeCorrections = record.correcoes_ponto?.filter(c => c.status !== 'Rejeitado' && c.status !== 'Cancelado') || [];
  const hasActiveCorrections = activeCorrections.length > 0;

  const canDelete = hasPermission('can_validate_daily_records') && !isReadOnlyAdmin && !hasActiveCorrections;
  const isPending = record.status_validacao === 'Pendente' || record.status_validacao === 'Fechado Automaticamente';
  const canAction = isPending && !isReadOnlyAdmin && !hasActiveCorrections;

  const handleAction = async (status, comment = '') => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('update-record-status', {
        body: { recordId: record.id, status, adminId: user.id, rejectionComment: comment },
      });
      if (error) throw error;

      toast({
        variant: 'success',
        title: status === 'Aprovado' ? t('records.approved') : t('records.rejected'),
      });

      sendApprovalNotification(record.usuario_id, 'registo', status, comment);
      onUpdateStatus({ ...record, status_validacao: status, rejection_comment: comment });
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('records.updateError') });
    } finally {
      setIsProcessing(false);
      setIsRejecting(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      const { data: corrections, error: checkError } = await supabase
        .from('correcoes_ponto')
        .select('id')
        .eq('registro_ponto_id', record.id)
        .limit(1);

      if (checkError) throw checkError;

      if (corrections && corrections.length > 0) {
        const { error } = await supabase
          .from('registros_ponto')
          .update({ status_validacao: 'Cancelado', updated_at: new Date().toISOString() })
          .eq('id', record.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('registros_ponto').delete().eq('id', record.id);
        if (error) throw error;
      }

      toast({ title: t('common.success'), description: t('records.deleteSuccess'), variant: 'success' });
      if (onDeleteSuccess) onDeleteSuccess(record.id);
    } catch (error) {
      console.error('Error processing record:', error);
      toast({ title: t('common.error'), description: t('records.deleteError'), variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className={`relative text-sm ${record.status_validacao === 'Fechado Automaticamente' ? 'border-yellow-200 bg-yellow-50/30' : ''} ${hasActiveCorrections ? 'border-yellow-300 bg-yellow-50/20' : ''}`}>
        {record.status_validacao === 'Fechado Automaticamente' && !hasActiveCorrections && (
          <div className="absolute top-2 right-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger><AlertTriangle className="h-4 w-4 text-yellow-500" /></TooltipTrigger>
                <TooltipContent>{t('records.autoClosedWarning')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <ShiftBadge turno={record.turno} />
            <span className="text-muted-foreground text-xs">{record.obra?.nome || t('records.unknownWorksite')}</span>
          </div>
        </CardHeader>

        <CardContent className="p-3 py-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-base">
              {formatTimeStr(record.hora_inicio_escolhido)} - {formatTimeStr(record.hora_fim_escolhido)}
            </span>
            <LocationStatus record={record} t={t} />
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{t('records.real')} {formatTime(record.hora_inicio_real)} - {record.hora_fim_real ? formatTime(record.hora_fim_real) : '...'}</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5"><MapPin className="h-3 w-3" /></Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl h-[80vh]">
                <DialogHeader><DialogTitle>{t('common.location')}</DialogTitle></DialogHeader>
                <RecordLocationMap record={record} />
              </DialogContent>
            </Dialog>
          </div>

          {hasActiveCorrections && (
            <div className="text-xs text-yellow-800 mt-2 bg-yellow-100 p-2 rounded flex items-start font-medium">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{t('records.pendingCorrectionsWarning')}</span>
            </div>
          )}

          {record.rejeicao_comentario && (
            <div className="text-xs text-red-500 mt-2 bg-red-50 p-1 rounded">
              {t('records.rejectReasonLabel')} {record.rejeicao_comentario}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-3 pt-0 flex justify-end gap-2">
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mr-auto"
              onClick={() => setIsDeleting(true)}
              disabled={isProcessing || hasActiveCorrections}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {!isPending && (
            <Badge variant={record.status_validacao === 'Aprovado' ? 'success' : 'destructive'}>
              {t(`status.${record.status_validacao}`) || record.status_validacao}
            </Badge>
          )}

          {canAction && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => setIsRejecting(true)}
                disabled={isProcessing}
              >
                {t('common.reject')}
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                onClick={() => handleAction('Aprovado')}
                disabled={isProcessing}
              >
                {t('common.approve')}
              </Button>
            </>
          )}
        </CardFooter>

        <RejectDialog
          open={isRejecting}
          onOpenChange={setIsRejecting}
          onConfirm={(comment) => handleAction('Rejeitado', comment)}
          t={t}
        />
      </Card>

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('records.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('records.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('common.back')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? t('common.processing') : t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RecordValidationCard;
