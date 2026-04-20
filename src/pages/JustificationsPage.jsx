import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, RefreshCw, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import JustificationForm from '@/components/justifications/JustificationForm';
import JustificationsByUserList from '@/components/justifications/JustificationsByUserList';
import EditJustificationModal from '@/components/justifications/EditJustificationModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

const JustificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [justifications, setJustifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  // States for Edit/Delete actions
  const [editingJustification, setEditingJustification] = useState(null);
  const [deletingJustification, setDeletingJustification] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMyJustifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        let query = supabase
            .from('justificação')
            .select(`
              *,
              usuarios:usuario_id(id, nome, avatar_url),
              tipos_justificação(nome)
            `)
            .eq('usuario_id', user.id)
            .order('data_envio', { ascending: false });
        
        if (statusFilter !== 'Todos') {
            query = query.eq('status_validacao', statusFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        setJustifications(data || []);
    } catch (error) {
        console.error("Error fetching justifications:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as justificações.' });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast, statusFilter]);

  useEffect(() => {
    fetchMyJustifications();
  }, [fetchMyJustifications]);

  // Global event listeners to catch edit/delete requests from deep components without prop drilling
  useEffect(() => {
    const handleEditRequest = (e) => setEditingJustification(e.detail);
    const handleDeleteRequest = (e) => setDeletingJustification(e.detail);

    window.addEventListener('request-edit-justification', handleEditRequest);
    window.addEventListener('request-delete-justification', handleDeleteRequest);

    return () => {
      window.removeEventListener('request-edit-justification', handleEditRequest);
      window.removeEventListener('request-delete-justification', handleDeleteRequest);
    };
  }, []);

  const handleJustificationSubmitted = () => {
      setIsDialogOpen(false);
      fetchMyJustifications();
  };

  const handleEditSuccess = () => {
      setEditingJustification(null);
      fetchMyJustifications();
  };

  const confirmDelete = async () => {
      if (!deletingJustification) return;
      setIsDeleting(true);
      try {
          // Update status to 'Cancelado' instead of actual deletion
          const { error } = await supabase
              .from('justificação')
              .update({ status_validacao: 'Cancelado' })
              .eq('id', deletingJustification.id);
          
          if (error) throw error;

          toast({ title: 'Sucesso', description: 'Justificação cancelada com sucesso.' });
          setDeletingJustification(null);
          fetchMyJustifications();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao cancelar justificação: ' + error.message });
      } finally {
          setIsDeleting(false);
      }
  };

  return (
    <>
      <Helmet>
        <title>{t('justification.pageTitle') || 'Justificações'}</title>
        <meta name="description" content="Gerencie suas justificações de ausência." />
      </Helmet>
      
      <motion.div 
        className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Page Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-1">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Minhas Justificações
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Consulte o histórico e estado das suas justificações.
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                 <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[150px]">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="Pendente">Pendentes</SelectItem>
                        <SelectItem value="Aprovado">Aprovados</SelectItem>
                        <SelectItem value="Rejeitado">Rejeitados</SelectItem>
                        <SelectItem value="Cancelado">Cancelados</SelectItem>
                    </SelectContent>
                </Select>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-sm whitespace-nowrap">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Nova Justificação</span>
                            <span className="sm:hidden">Nova</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <JustificationForm onSuccess={handleJustificationSubmitted} />
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        {/* Content Area */}
        <div className="space-y-4">
            <JustificationsByUserList 
                justifications={justifications}
                isLoading={isLoading}
                onUpdateStatus={null} // Read-only for employee interactions, handled via Edit/Delete
            />
        </div>

        {/* Edit Modal */}
        {editingJustification && (
            <EditJustificationModal
                isOpen={!!editingJustification}
                onOpenChange={(open) => !open && setEditingJustification(null)}
                justification={editingJustification}
                onSuccess={handleEditSuccess}
            />
        )}

        {/* Delete Confirmation Alert */}
        <AlertDialog open={!!deletingJustification} onOpenChange={(open) => !open && setDeletingJustification(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Justificação</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja cancelar esta justificação? Ela será marcada como "Cancelada" no histórico. Esta ação não pode ser desfeita.
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

      </motion.div>
    </>
  );
};

export default JustificationsPage;