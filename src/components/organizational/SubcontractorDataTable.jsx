import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Loader2, MoreHorizontal, Search, FilterX, Plus, UserCog, Power } from 'lucide-react';
import DeleteUserDialog from '@/components/organizational/DeleteUserDialog';
import AddSubcontractorDialog from '@/components/organizational/AddSubcontractorDialog';
import SubcontractorWorksAssignmentDialog from '@/components/organizational/SubcontractorWorksAssignmentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const SubcontractorDataTable = () => {
  const { toast } = useToast();
  const { isReadOnlyAdmin } = useAuth();
  const [subcontractors, setSubcontractors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allCompanies, setAllCompanies] = useState([]);
  
  const [filters, setFilters] = useState({
    company: 'all',
    searchTerm: '',
  });

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: 'add', // 'add' or 'edit'
    subcontractor: null,
  });

  const [deletingSubcontractor, setDeletingSubcontractor] = useState(null);
  const [assigningWorks, setAssigningWorks] = useState(null);

  const fetchSubcontractors = useCallback(async () => {
    console.log('[SubcontractorDataTable] Refreshing subcontractor list...');
    setIsLoading(true);
    try {
      // 1. Fetch subcontractors
      const { data: subsData, error: subsError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('tipo_usuario', 'subempreiteiro')
        .order('nome', { ascending: true });

      if (subsError) throw subsError;

      // 2. Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('subcontractor_obra_assignments')
        .select('subcontractor_id, obra_id');

      if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError);
      }

      // 3. Fetch all obras to map names
      const { data: obrasData, error: obrasError } = await supabase
        .from('obras')
        .select('id, nome');
        
      if (obrasError) {
          console.error("Error fetching obras:", obrasError);
      }

      // Build lookups for efficient matching
      const obrasMap = {};
      if (obrasData) {
          obrasData.forEach(obra => obrasMap[obra.id] = obra);
      }

      const assignmentsMap = {};
      if (assignmentsData) {
          assignmentsData.forEach(assignment => {
              if (!assignmentsMap[assignment.subcontractor_id]) {
                  assignmentsMap[assignment.subcontractor_id] = [];
              }
              if (obrasMap[assignment.obra_id]) {
                  assignmentsMap[assignment.subcontractor_id].push(obrasMap[assignment.obra_id]);
              }
          });
      }

      // Enrich subcontractors with their allocated works
      const enrichedSubs = (subsData || []).map(sub => ({
          ...sub,
          assignedWorks: assignmentsMap[sub.id] || []
      }));

      console.log(`[SubcontractorDataTable] Fetched ${enrichedSubs?.length || 0} subcontractors.`);
      setSubcontractors(enrichedSubs);
      
      const companies = [...new Set(enrichedSubs.map(u => u.empresa).filter(Boolean))];
      setAllCompanies(companies);
      
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar subempreiteiros',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubcontractors();
  }, [fetchSubcontractors]);

  // Wrapper for successful operations to ensure logs/debugging
  const handleOperationSuccess = async () => {
    console.log('[SubcontractorDataTable] Operation completed successfully. Triggering refresh.');
    await fetchSubcontractors();
  };

  const toggleSubcontractorStatus = async (sub) => {
    const newStatus = sub.status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
        const { error } = await supabase
            .from('usuarios')
            .update({ status: newStatus })
            .eq('id', sub.id);

        if (error) throw error;

        toast({
            title: `Status atualizado`,
            description: `Subempreiteiro ${sub.nome} está agora ${newStatus}.`,
        });
        
        // Optimistic update
        setSubcontractors(subcontractors.map(s => s.id === sub.id ? { ...s, status: newStatus } : s));
    } catch (error) {
        console.error('Error toggling status:', error);
        toast({
            variant: "destructive",
            title: "Erro ao atualizar status",
            description: error.message
        });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ company: 'all', searchTerm: '' });
  };

  const filteredSubcontractors = useMemo(() => {
    return subcontractors.filter(sub => {
      // Company Filter
      if (filters.company !== 'all' && sub.empresa !== filters.company) return false;

      // Search Term
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesName = sub.nome?.toLowerCase().includes(term);
        const matchesNif = sub.nif?.toLowerCase().includes(term);
        const matchesCompany = sub.empresa?.toLowerCase().includes(term);
        const matchesSpec = sub.funcao?.toLowerCase().includes(term);
        const matchesWorks = sub.assignedWorks?.some(work => 
          work.nome?.toLowerCase().includes(term) || work.id?.toString().includes(term)
        );
        
        if (!matchesName && !matchesNif && !matchesCompany && !matchesSpec && !matchesWorks) return false;
      }

      return true;
    });
  }, [subcontractors, filters]);

  const getInitials = (name) => {
    if (!name) return 'S';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const openAddDialog = () => {
    setDialogState({
      isOpen: true,
      mode: 'add',
      subcontractor: null
    });
  };

  const openEditDialog = (sub) => {
    setDialogState({
      isOpen: true,
      mode: 'edit',
      subcontractor: sub
    });
  };

  const isFilterActive = filters.company !== 'all' || filters.searchTerm !== '';

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Procurar subempreiteiro, obra..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button onClick={openAddDialog} className="w-full sm:w-auto" disabled={isReadOnlyAdmin}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Subempreiteiro
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
             <Select value={filters.company} onValueChange={(v) => handleFilterChange('company', v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {allCompanies.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isFilterActive && (
              <Button onClick={clearFilters} variant="ghost" className="text-destructive hover:text-destructive">
                <FilterX className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome / Responsável</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Especialização</TableHead>
                <TableHead>Obras Atribuídas (IDs)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredSubcontractors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum subempreiteiro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubcontractors.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={sub.avatar_url} />
                          <AvatarFallback>{getInitials(sub.nome)}</AvatarFallback>
                        </Avatar>
                        {sub.nome}
                      </div>
                    </TableCell>
                    <TableCell>{sub.empresa}</TableCell>
                    <TableCell>
                      {sub.nif}
                    </TableCell>
                    <TableCell>{sub.funcao || '-'}</TableCell>
                    <TableCell>
                        {sub.assignedWorks && sub.assignedWorks.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                                {sub.assignedWorks.slice(0, 4).map((obra, idx) => (
                                    <Badge key={`${obra.id}-${idx}`} variant="outline" className="font-normal" title={obra.nome}>
                                        {obra.id}
                                    </Badge>
                                ))}
                                {sub.assignedWorks.length > 4 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge variant="secondary" className="cursor-help font-normal">
                                                    +{sub.assignedWorks.length - 4} mais
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-[300px] flex flex-col gap-1 p-3">
                                                <p className="font-semibold mb-1 text-xs text-muted-foreground">Todas as Obras:</p>
                                                <div className="max-h-[200px] overflow-y-auto pr-2 space-y-1">
                                                    {sub.assignedWorks.map(obra => (
                                                        <div key={`tooltip-${obra.id}`} className="text-sm border-b border-border/50 pb-1 last:border-0">
                                                            <span className="font-medium text-muted-foreground mr-1">{obra.id} -</span>
                                                            {obra.nome}
                                                        </div>
                                                    ))}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                        )}
                    </TableCell>
                    <TableCell>
                        <Badge variant={sub.status === 'Ativo' ? 'success' : 'secondary'} className={cn(
                            sub.status === 'Ativo' ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                         )}>
                            {sub.status || 'Ativo'}
                         </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isReadOnlyAdmin}>
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => openEditDialog(sub)}>
                            Editar
                          </DropdownMenuItem>
                          
                          {sub.status === 'Inativo' ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="w-full">
                                            <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                                                <UserCog className="mr-2 h-4 w-4" /> Atribuir Obras
                                            </DropdownMenuItem>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Ative o subempreiteiro para atribuir obras</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <DropdownMenuItem onSelect={() => setAssigningWorks(sub)}>
                                <UserCog className="mr-2 h-4 w-4" /> Atribuir Obras
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onSelect={() => toggleSubcontractorStatus(sub)} disabled={isReadOnlyAdmin}>
                              <Power className="mr-2 h-4 w-4" /> 
                              {sub.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onSelect={() => setDeletingSubcontractor(sub)} 
                            className="text-red-600 focus:text-red-600"
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {isLoading ? (
                <div className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredSubcontractors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    Nenhum subempreiteiro encontrado.
                </div>
            ) : (
                filteredSubcontractors.map((sub) => (
                    <Card key={sub.id} className="w-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={sub.avatar_url} />
                                    <AvatarFallback>{getInitials(sub.nome)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-base font-bold">{sub.nome}</span>
                                    <span className="text-sm font-normal text-muted-foreground">{sub.empresa}</span>
                                  </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isReadOnlyAdmin}>
                                            <span className="sr-only">Menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onSelect={() => openEditDialog(sub)}>Editar</DropdownMenuItem>
                                      
                                      <DropdownMenuItem 
                                        onSelect={() => setAssigningWorks(sub)}
                                        disabled={sub.status === 'Inativo'}
                                      >
                                        Atribuir Obras
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuItem onSelect={() => toggleSubcontractorStatus(sub)} disabled={isReadOnlyAdmin}>
                                          <Power className="mr-2 h-4 w-4" /> 
                                          {sub.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onSelect={() => setDeletingSubcontractor(sub)} className="text-destructive">Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-3">
                             <div className="flex justify-between border-b pb-1">
                              <span className="text-muted-foreground">Status</span>
                              <Badge variant={sub.status === 'Ativo' ? 'success' : 'secondary'} className={cn(
                                    sub.status === 'Ativo' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                 )}>
                                    {sub.status || 'Ativo'}
                                 </Badge>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span className="text-muted-foreground">NIF</span>
                              <span>{sub.nif}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1">
                              <span className="text-muted-foreground">Especialização</span>
                              <span>{sub.funcao || '-'}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b pb-1">
                              <span className="text-muted-foreground">Obras Atribuídas (IDs)</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {sub.assignedWorks && sub.assignedWorks.length > 0 ? (
                                    <>
                                        {sub.assignedWorks.slice(0, 5).map((obra, idx) => (
                                            <Badge key={`mob-${obra.id}-${idx}`} variant="outline" className="font-normal text-xs" title={obra.nome}>
                                                {obra.id}
                                            </Badge>
                                        ))}
                                        {sub.assignedWorks.length > 5 && (
                                            <Badge variant="secondary" className="font-normal text-xs">
                                                +{sub.assignedWorks.length - 5}
                                            </Badge>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
      </div>

      <AddSubcontractorDialog 
        open={dialogState.isOpen}
        onOpenChange={(isOpen) => setDialogState(prev => ({ ...prev, isOpen }))}
        onSuccess={handleOperationSuccess}
        subcontractorToEdit={dialogState.subcontractor}
        defaultCompany={filters.company !== 'all' ? filters.company : ''}
        companies={allCompanies}
      />

      <DeleteUserDialog
        open={!!deletingSubcontractor}
        onOpenChange={(isOpen) => !isOpen && setDeletingSubcontractor(null)}
        user={deletingSubcontractor}
        onSuccess={handleOperationSuccess}
      />

      <SubcontractorWorksAssignmentDialog
        isOpen={!!assigningWorks}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                setAssigningWorks(null);
                fetchSubcontractors(); // Refresh to show newly assigned works
            }
        }}
        subcontractor={assigningWorks}
      />
    </>
  );
};

export default SubcontractorDataTable;