import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { logAcao } from '@/lib/logService';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { sendApprovalNotification } from '@/services/NotificationService';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';

const CorrectionActions = ({ correction, onUpdateStatus, className }) => {
  const { user, isReadOnlyAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);
  const [rejectComment, setRejectComment] = React.useState('');

  const handleAction = async (e, status, comment = '') => {
    if (e) e.stopPropagation();
    setIsLoading(true);
    try {
      const updateData = { status, validado_por: user.id, data_validacao: new Date().toISOString() };
      if (status === 'Rejeitado' && comment) {
        updateData.rejeicao_comentario = comment;
      }

      const { error } = await supabase
        .from('correcoes_ponto')
        .update(updateData)
        .eq('id', correction.id);

      if (error) throw error;

      if (status === 'Aprovado' && correction.registro_ponto_id) {
        const { error: deleteError } = await supabase
          .from('registros_ponto')
          .delete()
          .eq('id', correction.registro_ponto_id);
        if (deleteError) throw deleteError;
      }

      logAcao(user, {
        acao: 'Edição',
        entidade: 'Correção de Ponto',
        modulo: 'Validações',
        descricao: `Correção ${status === 'Aprovado' ? 'aprovada' : 'rejeitada'}`,
      });
      sendApprovalNotification(correction.usuario_id, 'correcao', status, comment);
      toast({
        variant: status === 'Aprovado' ? 'success' : 'default',
        title: status === 'Aprovado' ? t('common.approve') : t('common.reject'),
        description: status === 'Aprovado' ? t('corrections.approveSuccess') : t('corrections.rejectSuccess'),
      });

      if (onUpdateStatus) {
        onUpdateStatus({ id: correction.id, status, rejeicao_comentario: comment });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('corrections.updateError'),
      });
    } finally {
      setIsLoading(false);
      setIsRejectDialogOpen(false);
      setRejectComment('');
    }
  };

  if (correction.status !== 'Pendente') {
    return (
      <div className={cn("w-full py-2 px-3 bg-muted/30 rounded-md", className)}>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="italic">{t('common.processedAt')}</span>
          <span className="font-medium tabular-nums">
            {correction.data_validacao
              ? format(new Date(correction.data_validacao), 'dd/MM/yyyy HH:mm')
              : t('common.na')}
          </span>
        </div>
        {correction.rejeicao_comentario && (
          <p className="mt-1 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
            Motivo: {correction.rejeicao_comentario}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex items-center gap-3 w-full mt-2 pt-2 border-t border-border/50", className)}>
        {isLoading ? (
          <Button disabled className="w-full" variant="outline">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {t('common.processing')}
          </Button>
        ) : (
          <>
            <Button
              onClick={(e) => { e.stopPropagation(); setIsRejectDialogOpen(true); }}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-900/20 h-10"
              disabled={isReadOnlyAdmin}
            >
              <X className="h-4 w-4 mr-2" />
              {t('common.reject')}
            </Button>
            <Button
              onClick={(e) => handleAction(e, 'Aprovado')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 shadow-sm transition-all active:scale-[0.98]"
              disabled={isReadOnlyAdmin}
            >
              <Check className="h-4 w-4 mr-2" />
              {t('common.approve')}
            </Button>
          </>
        )}
      </div>

      <Dialog open={isRejectDialogOpen} onOpenChange={(open) => { setIsRejectDialogOpen(open); if (!open) setRejectComment(''); }}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Rejeitar Correção</DialogTitle>
            <DialogDescription>Indique o motivo da rejeição (opcional).</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="reject-comment">Motivo</Label>
            <Textarea
              id="reject-comment"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleAction(null, 'Rejeitado', rejectComment)}>
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CorrectionActions;
