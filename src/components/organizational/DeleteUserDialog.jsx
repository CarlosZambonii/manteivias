import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logAcao } from '@/lib/logService';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const DeleteUserDialog = ({ open, onOpenChange, user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const hasRelatedRecords = async (userId) => {
    const tablesToCheck = [
      'registros_ponto',
      'correcoes_ponto',
      'justificação',
      'registros_mensais',
    ];

    const checks = tablesToCheck.map(table => 
      supabase.from(table).select('id', { count: 'exact', head: true }).eq('usuario_id', userId)
    );
    
    const obraCheck = supabase.from('obras').select('id', { count: 'exact', head: true }).eq('encarregado_id', userId);
    checks.push(obraCheck);

    const results = await Promise.all(checks);

    for (const result of results) {
      if (result.error) {
        console.error('Error checking related records:', result.error);
        return { hasRecords: true, error: result.error.message };
      }
      if (result.count > 0) {
        return { hasRecords: true, error: null };
      }
    }

    return { hasRecords: false, error: null };
  };

  const handleDelete = async () => {
    if (!user) return;
    setLoading(true);

    const checkResult = await hasRelatedRecords(user.id);

    if (checkResult.hasRecords) {
      toast({
        variant: 'destructive',
        title: 'Exclusão não permitida',
        description: checkResult.error 
          ? `Ocorreu um erro ao verificar os registos: ${checkResult.error}`
          : 'Este utilizador possui registos associados (pontos, obras, etc.) e não pode ser excluído.',
      });
      setLoading(false);
      onOpenChange(false);
      return;
    }

    const { error } = await supabase.from('usuarios').delete().eq('id', user.id);
    setLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir',
        description: error.message,
      });
    } else {
      logAcao(currentUser, {
        acao: 'Exclusão',
        entidade: 'Utilizador',
        modulo: 'Organizacional',
        descricao: `Utilizador "${user.nome}" eliminado`,
      });
      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: `Utilizador ${user.nome} excluído com sucesso.`,
      });
      onSuccess();
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isto irá excluir permanentemente o utilizador{' '}
            <span className="font-bold">{user.nome}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleDelete} disabled={loading} variant="destructive">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sim, excluir utilizador
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;