import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logAcao } from '@/lib/logService';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { sendApprovalNotification } from '@/services/NotificationService';
import { useLanguage } from '@/hooks/useLanguage';

const CorrectionActions = ({ correction, onUpdateStatus, className }) => {
  const { user, isReadOnlyAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAction = async (e, status) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('correcoes_ponto')
        .update({ status, validado_por: user.id, data_validacao: new Date().toISOString() })
        .eq('id', correction.id);

      if (error) throw error;

      logAcao(user, {
        acao: 'Edição',
        entidade: 'Correção de Ponto',
        modulo: 'Validações',
        descricao: `Correção ${status === 'Aprovado' ? 'aprovada' : 'rejeitada'}`,
      });
      sendApprovalNotification(correction.usuario_id, 'correcao', status);
      toast({
        variant: status === 'Aprovado' ? 'success' : 'default',
        title: status === 'Aprovado' ? t('common.approve') : t('common.reject'),
        description: status === 'Aprovado' ? t('corrections.approveSuccess') : t('corrections.rejectSuccess'),
      });

      if (onUpdateStatus) {
        onUpdateStatus({ id: correction.id, status });
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
    }
  };

  if (correction.status !== 'Pendente') {
    return (
      <div className={cn("w-full text-center py-2 bg-muted/30 rounded-md", className)}>
        <span className="text-xs text-muted-foreground italic">
          {t('common.processedAt')} {correction.data_validacao ? new Date(correction.data_validacao).toLocaleDateString() : t('common.na')}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 w-full mt-2 pt-2 border-t border-border/50", className)}>
      {isLoading ? (
        <Button disabled className="w-full" variant="outline">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {t('common.processing')}
        </Button>
      ) : (
        <>
          <Button
            onClick={(e) => handleAction(e, 'Rejeitado')}
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
  );
};

export default CorrectionActions;
