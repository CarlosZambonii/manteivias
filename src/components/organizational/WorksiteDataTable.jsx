import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, PlayCircle, PauseCircle, XCircle, Loader2, HardHat, User, MapPin, Hash, Search, ArrowUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DeleteWorksiteDialog from '@/components/organizational/DeleteWorksiteDialog';
import EditWorksiteDialog from '@/components/organizational/EditWorksiteDialog';
import { useAuth } from '@/contexts/AuthContext';

const WorksiteDataTable = () => {
  const { toast } = useToast();
  const { isReadOnlyAdmin } = useAuth();
  const [worksites, setWorksites] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });
  const [loadingWorksiteId, setLoadingWorksiteId] = useState(null);
  const [editingWorksite, setEditingWorksite] = useState(null);
  const [deletingWorksite, setDeletingWorksite] = useState(null);

  const fetchWorksites = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('obras')
      .select(`
        id,
        nome,
        address,
        latitude,
        longitude,
        status,
        encarregado_id,
        encarregado:usuarios (id, nome)
      `);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar obras',
        description: error.message,
      });
      setWorksites([]);
    } else {
      setWorksites(data);
    }
    setIsLoading(false);
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome')
      .in('tipo_usuario', ['admin', 'admin_star', 'encarregado'])
      .eq('status', 'Ativo')
      .order('nome', { ascending: true });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar encarregados', description: error.message });
    } else {
      setUsers(data);
    }
  }, [toast]);

  useEffect(() => {
    fetchWorksites();
    fetchUsers();
  }, [fetchWorksites, fetchUsers]);

  const handleStatusChange = useCallback(async (worksiteId, currentStatus) => {
    setLoadingWorksiteId(worksiteId);
    let newStatus;
    if (currentStatus === 'em execução') {
      newStatus = 'inativa';
    } else if (currentStatus === 'inativa') {
      newStatus = 'em execução';
    } else {
      newStatus = 'em execução';
    }

    try {
      const { error } = await supabase
        .from('obras')
        .update({ status: newStatus })
        .eq('id', worksiteId);

      if (error) throw error;

      fetchWorksites();
      toast({
        title: 'Status da obra atualizado!',
        description: `A obra agora está ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar estado',
        description: error.message,
      });
    } finally {
      setLoadingWorksiteId(null);
    }
  }, [toast, fetchWorksites]);
  
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredWorksites = useMemo(() => {
    let sortableItems = [...worksites];
    
    sortableItems = sortableItems
      .filter((worksite) => {
        if (statusFilter === 'all') return true;
        if (!worksite.status) return false;
        return worksite.status.toLowerCase() === statusFilter;
      })
      .filter((worksite) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          worksite.id.toString().includes(term) ||
          worksite.nome?.toLowerCase().includes(term) ||
          worksite.address?.toLowerCase().includes(term) ||
          worksite.encarregado?.nome?.toLowerCase().includes(term)
        );
      });
      
    if (sortConfig.key !== null) {
        sortableItems.sort((a, b) => {
          let aValue, bValue;
          
          if (sortConfig.key === 'encarregado') {
            aValue = a.encarregado?.nome || '';
            bValue = b.encarregado?.nome || '';
          } else {
            aValue = a[sortConfig.key] === null ? '' : a[sortConfig.key];
            bValue = b[sortConfig.key] === null ? '' : b[sortConfig.key];
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
          }

          if (aValue.toString().toLowerCase() < bValue.toString().toLowerCase()) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValue.toString().toLowerCase() > bValue.toString().toLowerCase()) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        });
    }

    return sortableItems;
  }, [worksites, statusFilter, searchTerm, sortConfig]);

  const getStatusBadgeVariant = (status) => {
    if (!status) return 'secondary';
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'em execução') return 'success';
    if (lowerStatus === 'inativa') return 'secondary';
    if (lowerStatus === 'encerrada') return 'destructive';
    return 'secondary';
  };

  const getStatusIcon = (status) => {
    if (!status) return null;
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === 'em execução') return <PlayCircle className="mr-1 h-3 w-3" />;
    if (lowerStatus === 'inativa') return <PauseCircle className="mr-1 h-3 w-3" />;
    if (lowerStatus === 'encerrada') return <XCircle className="mr-1 h-3 w-3" />;
    return null;
  };

  const handleSuccess = () => {
    fetchWorksites();
    setEditingWorksite(null);
    setDeletingWorksite(null);
  };
  
  const openEditDialog = (worksite) => setEditingWorksite(worksite);
  const openDeleteDialog = (worksite) => setDeletingWorksite(worksite);
  
  const handleDeleteConfirm = async () => {
    if (!deletingWorksite) return;
    const { error } = await supabase.from('obras').delete().eq('id', deletingWorksite.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir obra', description: error.message });
    } else {
      toast({ title: 'Sucesso', description: 'Obra excluída com sucesso.'});
      handleSuccess();
    }
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return sortConfig.direction === 'ascending' ?
      <ArrowUpDown className="ml-2 h-4 w-4" /> :
      <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por ID, nome, morada..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button onClick={() => setEditingWorksite({})} className="w-full sm:w-auto" disabled={isReadOnlyAdmin}>
              <HardHat className="mr-2 h-4 w-4" /> Adicionar Obra
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="em execução">Em Execução</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
                <SelectItem value="encerrada">Encerrada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden hidden md:block">
          <Table>
            <TableHeader><TableRow>
                <TableHead onClick={() => requestSort('id')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">ID {renderSortArrow('id')}</div></TableHead>
                <TableHead onClick={() => requestSort('nome')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Nome {renderSortArrow('nome')}</div></TableHead>
                <TableHead onClick={() => requestSort('address')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Address {renderSortArrow('address')}</div></TableHead>
                <TableHead onClick={() => requestSort('encarregado')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Encarregado {renderSortArrow('encarregado')}</div></TableHead>
                <TableHead onClick={() => requestSort('status')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Status {renderSortArrow('status')}</div></TableHead>
                <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
              ) : sortedAndFilteredWorksites.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma obra encontrada.</TableCell></TableRow>
              ) : (
                sortedAndFilteredWorksites.map((worksite) => (
                  <TableRow key={worksite.id}>
                    <TableCell>{worksite.id}</TableCell>
                    <TableCell className="font-medium">{worksite.nome}</TableCell>
                    <TableCell>{worksite.address || '-'}</TableCell>
                    <TableCell>{worksite.encarregado?.nome || 'Nenhum'}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(worksite.status)} className="capitalize">{getStatusIcon(worksite.status)}{worksite.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" disabled={isReadOnlyAdmin}><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => openEditDialog(worksite)} disabled={isReadOnlyAdmin}>Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(worksite.id, worksite.status?.toLowerCase())} disabled={loadingWorksiteId === worksite.id || isReadOnlyAdmin}>
                            {loadingWorksiteId === worksite.id ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : worksite.status?.toLowerCase() === 'em execução' ? 'Mudar para Inativa' : 'Mudar para Em Execução'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => openDeleteDialog(worksite)} className="text-red-500 focus:text-red-500 focus:bg-red-500/10" disabled={isReadOnlyAdmin}>Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {isLoading ? (<div className="text-center py-8"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>)
            : sortedAndFilteredWorksites.length === 0 ? (<div className="text-center py-8 text-muted-foreground">Nenhuma obra encontrada.</div>)
            : (
                sortedAndFilteredWorksites.map((worksite) => (
                    <Card key={worksite.id} className="w-full">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span className="text-base font-bold flex items-center"><Hash className="h-4 w-4 mr-2" />{worksite.id} - {worksite.nome}</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" disabled={isReadOnlyAdmin}><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                      <DropdownMenuItem onSelect={() => openEditDialog(worksite)} disabled={isReadOnlyAdmin}>Editar</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(worksite.id, worksite.status?.toLowerCase())} disabled={loadingWorksiteId === worksite.id || isReadOnlyAdmin}>{loadingWorksiteId === worksite.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : worksite.status?.toLowerCase() === 'em execução' ? 'Mudar para Inativa' : 'Mudar para Em Execução'}</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onSelect={() => openDeleteDialog(worksite)} className="text-red-500 hover:!text-red-500" disabled={isReadOnlyAdmin}>Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardTitle>
                             <Badge variant={getStatusBadgeVariant(worksite.status)} className="capitalize w-fit">{getStatusIcon(worksite.status)}{worksite.status}</Badge>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                            <div className="flex items-center"><User className="h-4 w-4 mr-2 text-primary" /> Encarregado: {worksite.encarregado?.nome || 'Nenhum'}</div>
                            <div className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-primary" /> Endereço: {worksite.address || '-'}</div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
      </motion.div>
      {editingWorksite && (
        <EditWorksiteDialog
          open={!!editingWorksite}
          onOpenChange={(isOpen) => !isOpen && setEditingWorksite(null)}
          worksite={editingWorksite}
          users={users}
          onSuccess={handleSuccess}
        />
      )}
      {deletingWorksite && (
        <DeleteWorksiteDialog
          open={!!deletingWorksite}
          onOpenChange={(isOpen) => !isOpen && setDeletingWorksite(null)}
          worksite={deletingWorksite}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
};

export default WorksiteDataTable;