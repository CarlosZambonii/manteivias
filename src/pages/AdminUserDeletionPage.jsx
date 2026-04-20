import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';

const AdminUserDeletionPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const userIdsToDelete = [252, 262];

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-users-cascade', {
        body: { userIds: userIdsToDelete }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Sucesso",
          description: data.message || "Utilizadores e dados dependentes eliminados com sucesso.",
          variant: "default",
        });
      } else {
        throw new Error(data?.error || "Erro desconhecido ao eliminar utilizadores.");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro na Eliminação",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-8 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Utilitário de Eliminação</h1>
        <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
        </Button>
      </div>

      <Card className="border-destructive">
        <CardHeader className="bg-destructive/10 text-destructive">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Aviso de Eliminação em Cascata
          </CardTitle>
          <CardDescription className="text-destructive/80 font-medium">
            Esta operação é irreversível e irá eliminar permanentemente os utilizadores e os seus dados associados.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Utilizadores a Eliminar:</h3>
            <ul className="list-disc list-inside pl-4 text-muted-foreground">
              {userIdsToDelete.map(id => (
                <li key={id}>ID: {id}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-2">Dados que serão eliminados em cascata:</h3>
            <ul className="list-disc list-inside pl-4 text-muted-foreground">
              <li>Registos da tabela <strong>subcontractor_obra_assignments</strong> onde <em>assigned_by = 262</em></li>
              <li>Registos da tabela <strong>suggestions</strong> onde <em>submitted_by = 252</em></li>
              <li>Registos da tabela <strong>usuarios</strong> com os IDs indicados</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-6 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                Executar Eliminação
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem a certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Irá apagar os utilizadores {userIdsToDelete.join(', ')} e todos os dados indicados das tabelas relacionadas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Confirmar Eliminação
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminUserDeletionPage;