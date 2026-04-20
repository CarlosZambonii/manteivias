import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

const JustificationActions = ({ justification, onUpdateStatus, className }) => {
  const { isReadOnlyAdmin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAction = async (e, status) => {
    e.stopPropagation(); // Prevent card expansion
    setIsLoading(true);
    try {
      await onUpdateStatus(justification, status);
      // Success toast is usually handled by parent or here. 
      // Assuming parent handles it based on previous implementation, 
      // but CorrectionActions handled it. Let's rely on parent for state update 
      // but we can show immediate feedback if parent doesn't throw.
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o estado.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (justification.status_validacao !== 'Pendente') {
     return (
        <div className={cn("w-full text-center py-2 bg-muted/30 rounded-md mt-2", className)}>
             <span className="text-xs text-muted-foreground italic">
                {justification.status_validacao === 'Aprovado' ? 'Aprovado' : 'Rejeitado'} em {justification.data_validacao ? new Date(justification.data_validacao).toLocaleDateString() : 'N/A'}
             </span>
        </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3 w-full mt-4 pt-3 border-t border-border/50", className)}>
      {isLoading ? (
        <Button disabled className="w-full" variant="outline">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Processando...
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
            Rejeitar
          </Button>
          <Button 
            onClick={(e) => handleAction(e, 'Aprovado')} 
            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 shadow-sm transition-all active:scale-[0.98]"
            disabled={isReadOnlyAdmin}
          >
            <Check className="h-4 w-4 mr-2" /> 
            Aprovar
          </Button>
        </>
      )}
    </div>
  );
};

export default JustificationActions;