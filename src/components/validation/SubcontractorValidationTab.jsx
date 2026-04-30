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
import { AlertCircle, RefreshCw, Briefcase, Building, Edit, Clock, History, ArrowUpDown } from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!currentUser) return;
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
        const docFields = await fetchDocumentFields();
        setDocumentFields(docFields);

        let query = supabase
          .from('usuarios')
          .select('*')
          .eq('tipo_usuario', 'subempreiteiro');

        if (worksiteFilter) {
            if (worksiteFilter.length === 0) {
                setWorkers([]);
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
                return;
            }
            query = query.in('id', subIds);
        } else if (isEncarregado) {
            const { data: myObras, error: obrasError } = await supabase
                .from('obras')
                .select('id')
                .eq('encarregado_id', currentUser.id);

            if (obrasError) throw obrasError;

            const myObraIds = myObras.map(o => o.id);

            if (myObraIds.length === 0) {
                setWorkers([]);
                return;
            }

            const { data: assignments, error: assignError } = await supabase
                .from('subcontractor_obra_assignments')
                .select('subcontractor_id')
                .in('obra_id', myObraIds);

            if (assignError) throw assignError;

            const subIds = assignments.map(a => a.subcontractor_id);

            if (subIds.length === 0) {
                setWorkers([]);
                return;
            }

            query = query.in('id', subIds);
        }

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
        setIsRefreshing(false);
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

    sortableItems = sortableItems.filter((worker) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        worker.nome?.toLowerCase().includes(term) ||
        worker.empresa?.toLowerCase().includes(term) ||
        worker.funcao?.toLowerCase().includes(term)
      );
    });

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
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
    fetchData(true);
    setEditingWorker(null);
    setRegisteringWorker(null);
  };

  const canEditDocs = !isEncarregado && (currentUser?.tipo_usuario !== 'admin' || hasPermission('can_manage_subcontractor_docs'));

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <Input
              placeholder="Filtrar por nome, empresa, função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={isLoading || isRefreshing}
              className="w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : sortedAndFilteredWorkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-muted/20 rounded-lg border-2 border-dashed">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Nenhum subempreiteiro encontrado</h3>
            <p className="text-muted-foreground text-sm">Não há trabalhadores subempreiteiros correspondentes à pesquisa.</p>
            {searchTerm && (
              <Button variant="link" onClick={() => setSearchTerm('')}>
                Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => requestSort('nome')} className="cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center">Nome {renderSortArrow('nome')}</div>
                    </TableHead>
                    <TableHead onClick={() => requestSort('empresa')} className="cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center">Empresa {renderSortArrow('empresa')}</div>
                    </TableHead>
                    <TableHead onClick={() => requestSort('funcao')} className="cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center">Função {renderSortArrow('funcao')}</div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredWorkers.map((worker) => {
                    const docsComplete = areDocumentsComplete(worker);
                    return (
                      <TableRow key={worker.id}>
                        <TableCell className="font-medium">{worker.nome}</TableCell>
                        <TableCell>{worker.empresa}</TableCell>
                        <TableCell>{worker.funcao}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => setHistoryWorker(worker)}>
                            <History className="mr-2 h-4 w-4" />Histórico
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex="0">
                                  <Button
                                    variant={docsComplete ? 'success' : 'outline'}
                                    size="sm"
                                    onClick={() => setRegisteringWorker(worker)}
                                    disabled={!docsComplete || isReadOnlyAdmin}
                                  >
                                    <Clock className="mr-2 h-4 w-4" />Registo
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {!docsComplete && (
                                <TooltipContent><p>Documentação pendente.</p></TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                          {canEditDocs && (
                            <Button variant="secondary" size="sm" onClick={() => setEditingWorker(worker)} disabled={isReadOnlyAdmin}>
                              <Edit className="mr-2 h-4 w-4" />Docs
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:hidden">
              {sortedAndFilteredWorkers.map((worker) => {
                const docsComplete = areDocumentsComplete(worker);
                return (
                  <Card key={worker.id} className="w-full">
                    <CardHeader>
                      <CardTitle className="text-base font-bold">{worker.nome}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                      <div className="flex items-center"><Building className="h-4 w-4 mr-2 text-primary" /> Empresa: {worker.empresa}</div>
                      <div className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-primary" /> Função: {worker.funcao}</div>
                    </CardContent>
                    <CardFooter className="flex flex-wrap justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setHistoryWorker(worker)}>
                        <History className="mr-2 h-4 w-4" />Histórico
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex="0">
                              <Button
                                variant={docsComplete ? 'success' : 'outline'}
                                size="sm"
                                onClick={() => setRegisteringWorker(worker)}
                                disabled={!docsComplete || isReadOnlyAdmin}
                              >
                                <Clock className="mr-2 h-4 w-4" />Registo
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!docsComplete && (
                            <TooltipContent><p>Documentação pendente.</p></TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      {canEditDocs && (
                        <Button variant="secondary" size="sm" onClick={() => setEditingWorker(worker)} disabled={isReadOnlyAdmin}>
                          <Edit className="mr-2 h-4 w-4" />Docs
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </>
        )}
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
