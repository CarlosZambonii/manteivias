import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Trash2, Building } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatObraDisplay } from '@/utils/formatObraDisplay';

const SubcontractorWorksAssignmentDialog = ({ isOpen, onOpenChange, subcontractor }) => {
  const { user, isAdmin, isAdminStar, isAdminC, isEncarregado } = useAuth();
  const { toast } = useToast();
  
  const [worksites, setWorksites] = useState([]);
  const [assignedWorksiteIds, setAssignedWorksiteIds] = useState([]);
  const [selectedWorksiteIds, setSelectedWorksiteIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    if (!user || !subcontractor) return;
    setIsLoading(true);
    try {
      let worksitesQuery = supabase
        .from('obras')
        .select('id, nome, status')
        .eq('status', 'em execução')
        .order('id', { ascending: true });

      const isAnyAdmin = isAdmin || isAdminStar || isAdminC;
      if (!isAnyAdmin && isEncarregado) {
        worksitesQuery = worksitesQuery.eq('encarregado_id', user.id);
      }

      const { data: worksitesData, error: worksitesError } = await worksitesQuery;
      if (worksitesError) throw worksitesError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('subcontractor_obra_assignments')
        .select('obra_id')
        .eq('subcontractor_id', subcontractor.id);

      if (assignmentsError) throw assignmentsError;

      const currentAssignedIds = assignmentsData.map(a => a.obra_id);
      
      setWorksites(worksitesData || []);
      setAssignedWorksiteIds(currentAssignedIds);
      setSelectedWorksiteIds([]);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, subcontractor, isAdmin, isAdminStar, isAdminC, isEncarregado, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  const handleToggleSelect = (worksiteId) => {
    setSelectedWorksiteIds(prev => 
      prev.includes(worksiteId)
        ? prev.filter(id => id !== worksiteId)
        : [...prev, worksiteId]
    );
  };

  const handleDeleteAssignment = async (worksiteId) => {
    try {
      const { error } = await supabase
        .from('subcontractor_obra_assignments')
        .delete()
        .eq('subcontractor_id', subcontractor.id)
        .eq('obra_id', worksiteId);

      if (error) throw error;

      toast({
        title: 'Atribuição removida',
        description: 'A obra foi removida do subempreiteiro com sucesso.'
      });

      setAssignedWorksiteIds(prev => prev.filter(id => id !== worksiteId));
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao remover',
        description: error.message
      });
    }
  };

  const handleSave = async () => {
    if (selectedWorksiteIds.length === 0) {
      onOpenChange(false);
      return;
    }

    if (!user || !user.id) {
      toast({
        variant: 'destructive',
        title: 'Erro de autenticação',
        description: 'Usuário não identificado. Por favor, faça login novamente.'
      });
      return;
    }

    const allowedRoles = ['admin', 'admin_star', 'admin_c', 'rh', 'admin_sub', 'encarregado'];
    if (!allowedRoles.includes(user.tipo_usuario)) {
      toast({
        variant: 'destructive',
        title: 'Permissão negada',
        description: 'Você não tem permissão para atribuir obras a subempreiteiros.'
      });
      return;
    }

    setIsSaving(true);
    try {
      const newAssignments = selectedWorksiteIds.map(obraId => ({
        subcontractor_id: subcontractor.id,
        obra_id: obraId,
        assigned_by: user.id,
        assigned_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('subcontractor_obra_assignments')
        .insert(newAssignments);

      if (error) {
        if (error.code === '42501' || error.message.includes('policy')) {
           throw new Error('Permissão negada pela política de segurança do sistema. Verifique se tem as permissões necessárias.');
        }
        throw error;
      }

      toast({
        variant: 'success',
        title: 'Obras atribuídas!',
        description: `${newAssignments.length} obra(s) foram atribuída(s) com sucesso.`
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar as atribuições.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredWorksites = worksites.filter(site => {
    const searchLower = searchTerm.toLowerCase();
    return (
      site.nome.toLowerCase().includes(searchLower) ||
      site.id.toString().includes(searchLower)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6 gap-0">
        <DialogHeader className="mb-4 shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Atribuir Obras</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Gerir obras atribuídas a <span className="font-semibold text-foreground">{subcontractor?.nome}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden mb-4 min-h-0">
          <div className="relative shrink-0">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por ID ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-10 sm:h-11"
            />
          </div>

          <div className="flex-1 border rounded-md overflow-hidden relative min-h-[200px]">
            <ScrollArea className="h-[300px] sm:h-[400px] w-full overflow-y-auto">
              <div className="p-2 sm:p-3">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full min-h-[100px]">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredWorksites.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground p-4">
                    Nenhuma obra encontrada.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredWorksites.map((worksite) => {
                      const isAssigned = assignedWorksiteIds.includes(worksite.id);
                      const isSelected = selectedWorksiteIds.includes(worksite.id);

                      return (
                        <div 
                          key={worksite.id} 
                          className={`flex items-center justify-between p-2 sm:p-3 rounded-md transition-colors border ${
                            isAssigned 
                              ? 'bg-secondary/30 border-transparent' 
                              : isSelected 
                                ? 'bg-primary/5 border-primary/20' 
                                : 'hover:bg-muted border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-1 overflow-hidden">
                            {!isAssigned && (
                              <Checkbox 
                                id={`work-${worksite.id}`}
                                checked={isSelected}
                                onCheckedChange={() => handleToggleSelect(worksite.id)}
                                className="h-5 w-5 shrink-0"
                              />
                            )}
                            <div className="flex flex-col flex-1 overflow-hidden">
                              <label 
                                htmlFor={`work-${worksite.id}`}
                                className={`text-sm sm:text-base font-medium leading-none cursor-pointer truncate ${isAssigned ? 'text-muted-foreground' : ''}`}
                              >
                                {formatObraDisplay(worksite.id, worksite.nome)}
                              </label>
                              {isAssigned && (
                                <span className="text-xs text-green-600 font-medium flex items-center mt-1">
                                  <Building className="h-3 w-3 mr-1" /> Já atribuída
                                </span>
                              )}
                            </div>
                          </div>

                          {isAssigned && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 ml-2 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => handleDeleteAssignment(worksite.id)}
                              title="Remover atribuição"
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
            {selectedWorksiteIds.length} nova(s) selecionada(s)
          </div>
          <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || selectedWorksiteIds.length === 0} className="flex-1 sm:flex-none">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubcontractorWorksAssignmentDialog;