import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Briefcase, Building, Edit, Clock, History, ArrowUpDown } from 'lucide-react';
import EditSubcontractorDialog from '@/components/validation/EditSubcontractorDialog';
import RegisterSubcontractorTimeDialog from '@/components/validation/RegisterSubcontractorTimeDialog';
import SubcontractorHistoryDialog from '@/components/validation/SubcontractorHistoryDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

const SubcontractorValidationTab = ({ worksiteFilter }) => {
  const { toast } = useToast();
  const { user: currentUser, isReadOnlyAdmin, isEncarregado } = useAuth();
  const { hasPermission } = useAdminPermissions();
  const [workers, setWorkers] = useState([]);
  const [documentFields, setDocumentFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'ascending' });
  const [editingWorker, setEditingWorker] = useState(null);
  const [registeringWorker, setRegisteringWorker] = useState(null);
  const [historyWorker, setHistoryWorker] = useState(null);

  const fetchDocumentFields = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_document_columns');
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar tipos de documento.' });
      return [];
    }
    return data.map(item => item.column_name) || [];
  }, [toast]);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    
    try {
        const docFields = await fetchDocumentFields();
        setDocumentFields(docFields);
        
        const selectColumns = ['*', ...docFields].join(',');
        let query = supabase.from('subempreiteiros').select(selectColumns);

        if (worksiteFilter) {
            if (worksiteFilter.length === 0) {
                setWorkers([]);
                setIsLoading(false);
                return;
            }
            const { data: assignments, error: assignError } = await supabase
                .from('subcontractor_obra_assignments')
                .select('subcontractor_id')
                .in('obra_id', worksiteFilter);
            
            if (assignError) throw assignError;

            const subIds = assignments.map(a => a.subcontractor_id);

            if (subIds.length === 0) {
                setWorkers([]);
                setIsLoading(false);
                return;
            }
            query = query.in('id', subIds);
        } else if (isEncarregado) {
            // 1. Get Encarregado's Obras (Fallback if worksiteFilter isn't provided)
            const { data: myObras, error: obrasError } = await supabase
                .from('obras')
                .select('id')
                .eq('encarregado_id', currentUser.id);

            if (obrasError) throw obrasError;

            const myObraIds = myObras.map(o => o.id);

            if (myObraIds.length === 0) {
                setWorkers([]);
                setIsLoading(false);
                return;
            }

            // 2. Get assigned subcontractors
            const { data: assignments, error: assignError } = await supabase
                .from('subcontractor_obra_assignments')
                .select('subcontractor_id')
                .in('obra_id', myObraIds);
            
            if (assignError) throw assignError;

            const subIds = assignments.map(a => a.subcontractor_id);

            if (subIds.length === 0) {
                setWorkers([]);
                setIsLoading(false);
                return;
            }

            query = query.in('id', subIds);
        }

        // Apply common filters
        query = query.order('nome', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;
        setWorkers(data || []);

    } catch (error) {
        console.error('Erro ao carregar trabalhadores:', error);
        toast({
            variant: 'destructive',
            title: 'Erro ao carregar trabalhadores',
            description: "Não foi possível carregar os dados. " + error.message,
        });
        setWorkers([]);
    } finally {
        setIsLoading(false);
    }
  }, [toast, fetchDocumentFields, isEncarregado, currentUser, worksiteFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const areDocumentsComplete = useCallback((worker) => {
    if (documentFields.length === 0) return false;
    return documentFields.every(field => worker[field]);
  }, [documentFields]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredWorkers = useMemo(() => {
    let sortableItems = [...workers];
    
    // Filtering
    sortableItems = sortableItems.filter((worker) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        worker.nome?.toLowerCase().includes(term) ||
        worker.empresa?.toLowerCase().includes(term) ||
        worker.funcao?.toLowerCase().includes(term)
      );
    });

    // Sorting
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [workers, searchTerm, sortConfig]);
  
  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const handleSuccess = () => {
    fetchData();
    setEditingWorker(null);
    setRegisteringWorker(null);
  };

  const openEditDialog = (worker) => setEditingWorker(worker);
  const openRegisterTimeDialog = (worker) => setRegisteringWorker(worker);
  const openHistoryDialog = (worker) => setHistoryWorker(worker);

  // Check if current admin role allows viewing docs button
  const canEditDocs = !isEncarregado && (currentUser?.tipo_usuario !== 'admin' || hasPermission('can_manage_subcontractor_docs'));

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome, empresa, função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => requestSort('nome')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Nome {renderSortArrow('nome')}</div></TableHead>
                <TableHead onClick={() => requestSort('empresa')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Empresa {renderSortArrow('empresa')}</div></TableHead>
                <TableHead onClick={() => requestSort('funcao')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Função {renderSortArrow('funcao')}</div></TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : sortedAndFilteredWorkers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum trabalhador subempreiteiro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredWorkers.map((worker) => {
                  const docsComplete = areDocumentsComplete(worker);
                  return (
                    <TableRow key={worker.id}>
                      <TableCell className="font-medium">{worker.nome}</TableCell>
                      <TableCell>{worker.empresa}</TableCell>
                      <TableCell>{worker.funcao}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openHistoryDialog(worker)}>
                          <History className="mr-2 h-4 w-4" />
                          Histórico
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex="0">
                                <Button 
                                  variant={docsComplete ? 'success' : 'outline'} 
                                  size="sm" 
                                  onClick={() => openRegisterTimeDialog(worker)} 
                                  disabled={!docsComplete || isReadOnlyAdmin}
                                >
                                  <Clock className="mr-2 h-4 w-4" />
                                  Registo
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {!docsComplete && (
                              <TooltipContent>
                                <p>Documentação pendente.</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        {canEditDocs && (
                          <Button variant="secondary" size="sm" onClick={() => openEditDialog(worker)} disabled={isReadOnlyAdmin}>
                            <Edit className="mr-2 h-4 w-4" />
                            Docs
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 gap-4 md:hidden">
            {isLoading ? (
                <div className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </div>
            ) : sortedAndFilteredWorkers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    Nenhum trabalhador subempreiteiro encontrado.
                </div>
            ) : (
                sortedAndFilteredWorkers.map((worker) => {
                  const docsComplete = areDocumentsComplete(worker);
                  return (
                    <Card key={worker.id} className="w-full">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span className="text-base font-bold">{worker.nome}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <div className="flex items-center"><Building className="h-4 w-4 mr-2 text-primary" /> Empresa: {worker.empresa}</div>
                            <div className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-primary" /> Função: {worker.funcao}</div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openHistoryDialog(worker)}>
                              <History className="mr-2 h-4 w-4" />
                              Histórico
                            </Button>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span tabIndex="0">
                                    <Button 
                                      variant={docsComplete ? 'success' : 'outline'} 
                                      size="sm" 
                                      onClick={() => openRegisterTimeDialog(worker)} 
                                      disabled={!docsComplete || isReadOnlyAdmin}
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      Registo
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {!docsComplete && (
                                  <TooltipContent>
                                    <p>Documentação pendente.</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            {canEditDocs && (
                              <Button variant="secondary" size="sm" onClick={() => openEditDialog(worker)} disabled={isReadOnlyAdmin}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Docs
                              </Button>
                            )}
                        </CardFooter>
                    </Card>
                  );
                })
            )}
        </div>
      </motion.div>
      {editingWorker && (
        <EditSubcontractorDialog
          open={!!editingWorker}
          onOpenChange={(isOpen) => !isOpen && setEditingWorker(null)}
          user={editingWorker}
          onSuccess={handleSuccess}
        />
      )}
      {registeringWorker && (
        <RegisterSubcontractorTimeDialog
          open={!!registeringWorker}
          onOpenChange={(isOpen) => !isOpen && setRegisteringWorker(null)}
          worker={registeringWorker}
          onSuccess={handleSuccess}
        />
      )}
      {historyWorker && (
        <SubcontractorHistoryDialog
          open={!!historyWorker}
          onOpenChange={(isOpen) => !isOpen && setHistoryWorker(null)}
          worker={historyWorker}
        />
      )}
    </>
  );
};

export default SubcontractorValidationTab;