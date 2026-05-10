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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreHorizontal, Loader2, UserPlus, Hash, Briefcase, KeyRound, Search, Building, FilterX, ArrowUpDown, UserCheck, Check, Calendar, Lock, Eye, EyeOff, UserCog, Power, ShieldCheck, Edit } from 'lucide-react';
import DeleteUserDialog from '@/components/organizational/DeleteUserDialog';
import EditUserDialog from '@/components/organizational/EditUserDialog';
import SubcontractorWorksAssignmentDialog from '@/components/organizational/SubcontractorWorksAssignmentDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import AdminPermissionsPanel from '@/components/admin/AdminPermissionsPanel';

const userTypes = [
  { value: 'usuario', label: 'Utilizador' },
  { value: 'admin', label: 'Admin' },
  { value: 'admin_star', label: 'Admin Star' },
  { value: 'admin_c', label: 'Admin C' },
];

const UserDataTable = ({ filterCompany, filterMode = 'include', excludeRole }) => {
  const { toast } = useToast();
  const { user: currentUser, isReadOnlyAdmin, isAdminStar, isEncarregado, isAdmin, isAdminC } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'ascending' });
  const [hasManagedWorks, setHasManagedWorks] = useState(false);
  
  const initialFilters = {
    tipoRegisto: 'all',
    tiposUsuario: [],
    searchTerm: '',
    categoria: 'all',
  };
  const [filters, setFilters] = useState(initialFilters);

  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [assigningSubcontractor, setAssigningSubcontractor] = useState(null);
  const [managingPermissionsFor, setManagingPermissionsFor] = useState(null);

  const [passwordDialogState, setPasswordDialogState] = useState({ open: false, user: null });
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    console.log('[UserDataTable] Fetching users from Supabase...');
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('[UserDataTable] Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar utilizadores',
        description: error.message,
      });
      setUsers([]);
    } else {
      console.log(`[UserDataTable] Successfully fetched ${data?.length || 0} users.`, data);
      setUsers(data);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    const checkManagedWorks = async () => {
      if (!currentUser) return;
      if (isAdmin || isAdminStar || isAdminC) { setHasManagedWorks(true); return; }
      if (isEncarregado) {
        const { count, error } = await supabase.from('obras').select('id', { count: 'exact', head: true }).eq('encarregado_id', currentUser.id).eq('status', 'em execution');
        if (!error && count > 0) setHasManagedWorks(true); else setHasManagedWorks(false);
      }
    };
    checkManagedWorks();
  }, [currentUser, isEncarregado, isAdmin, isAdminStar, isAdminC]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('pt-PT') : '-';

  const toggleUserStatus = async (user) => {
    const newStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
        const { error } = await supabase.from('usuarios').update({ status: newStatus }).eq('id', user.id);
        if (error) throw error;
        toast({ title: `Status atualizado`, description: `Utilizador ${user.nome} está agora ${newStatus}.` });
        setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar status", description: error.message });
    }
  };
  
  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const handleUserTypeSelect = (userType) => setFilters(prev => ({ ...prev, tiposUsuario: prev.tiposUsuario.includes(userType) ? prev.tiposUsuario.filter(t => t !== userType) : [...prev.tiposUsuario, userType] }));

  const isFilterActive = useMemo(() => JSON.stringify(filters) !== JSON.stringify(initialFilters), [filters, initialFilters]);
  const clearFilters = () => setFilters(initialFilters);
  
  const requestSort = (key) => {
    let direction = sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    setSortConfig({ key, direction });
  };

  const availableCategories = useMemo(() => {
    if (!users) return [];
    const categories = new Set(
      users
        .map(u => u.categoria)
        .filter(c => c && c.toLowerCase() !== 'subempreiteiro')
    );
    return Array.from(categories).sort();
  }, [users]);

  const sortedAndFilteredUsers = useMemo(() => {
    let sortableItems = [...users];
    
    // Exclude specific roles if requested (e.g., excludeRole="subempreiteiro")
    if (excludeRole) {
      sortableItems = sortableItems.filter(user => user.tipo_usuario?.toLowerCase() !== excludeRole.toLowerCase());
    }
    
    // Apply company filter with safeguards for null/empty values
    if (filterCompany) {
      sortableItems = sortableItems.filter(user => {
        const uEmpresa = (user.empresa || '').trim().toLowerCase();
        const tEmpresa = filterCompany.toLowerCase();
        
        if (filterMode === 'exclude') {
          return uEmpresa !== tEmpresa;
        } else {
          // If looking for "Manteivias", we also include users with no company assigned (assumed internal default)
          return uEmpresa === tEmpresa || (tEmpresa === 'manteivias' && uEmpresa === '');
        }
      });
    }

    sortableItems = sortableItems
      .filter(user => filters.tipoRegisto === 'all' || user.tipo_registo?.toLowerCase() === filters.tipoRegisto?.toLowerCase())
      .filter(user => filters.tiposUsuario.length === 0 || filters.tiposUsuario.includes(user.tipo_usuario?.toLowerCase()))
      .filter(user => {
        if (!filters.searchTerm) return true;
        const term = filters.searchTerm.toLowerCase();
        const searchFields = [user.nome, user.nif, user.empresa, user.funcao, user.tipo_usuario];
        return searchFields.some(field => String(field || '').toLowerCase().includes(term));
      })
      .filter(user => filters.categoria === 'all' || user.categoria === filters.categoria);

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '', bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    
    console.log(`[UserDataTable] Filtered users down to ${sortableItems.length} items from ${users.length} total.`);
    return sortableItems;
  }, [users, filters, sortConfig, filterCompany, filterMode, excludeRole]);

  const handleSuccess = () => { fetchUsers(); setEditingUser(null); setDeletingUser(null); };
  
  const openEditDialog = (user) => {
    setEditingUser(user);
  };

  const handleCreateNewUser = () => openEditDialog({ empresa: filterCompany || 'Manteivias' });
  const openDeleteDialog = (user) => setDeletingUser(user);
  const openPasswordDialog = (user) => { setPasswordDialogState({ open: true, user }); setNewPassword(user.senha || ''); setShowPassword(false); };
  const closePasswordDialog = () => { setPasswordDialogState({ open: false, user: null }); setNewPassword(''); setShowPassword(false); };

  const handlePasswordUpdate = async () => {
    if (!newPassword.trim()) { toast({ variant: 'destructive', title: 'Erro de validação', description: 'A senha não pode estar vazia.' }); return; }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.from('usuarios').update({ senha: newPassword }).eq('id', passwordDialogState.user.id);
      if (error) throw error;
      toast({ title: 'Senha atualizada!', description: 'A senha do utilizador foi alterada com sucesso.' });
      setUsers(prev => prev.map(u => u.id === passwordDialogState.user.id ? { ...u, senha: newPassword } : u));
      closePasswordDialog();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar senha', description: error.message });
    } finally { setIsUpdatingPassword(false); }
  };
  
  const canAssignWorks = (targetUser) => targetUser.tipo_usuario === 'subempreiteiro' && hasManagedWorks;
  const renderSortArrow = (key) => (sortConfig.key !== key) ? <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" /> : <ArrowUpDown className="ml-2 h-4 w-4" />;
  
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Filtrar por nome, nif, etc..." value={filters.searchTerm} onChange={(e) => handleFilterChange('searchTerm', e.target.value)} className="pl-10 w-full"/></div>
            <Button onClick={handleCreateNewUser} className="w-full sm:w-auto" disabled={isReadOnlyAdmin}><UserPlus className="mr-2 h-4 w-4" /> Adicionar Utilizador</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={filters.tipoRegisto} onValueChange={(v) => handleFilterChange('tipoRegisto', v)}>
              <SelectTrigger><SelectValue placeholder="Filtrar por tipo de registo..." /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos os Tipos de Registo</SelectItem><SelectItem value="Mensal">Mensal</SelectItem><SelectItem value="Diario">Diário</SelectItem></SelectContent>
            </Select>
            <Select value={filters.categoria} onValueChange={(v) => handleFilterChange('categoria', v)}>
              <SelectTrigger><SelectValue placeholder="Filtrar por categoria..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start border-dashed"><UserCheck className="mr-2 h-4 w-4" />Tipo de Utilizador{filters.tiposUsuario.length > 0 && <Badge variant="secondary" className="ml-auto rounded-sm px-1 font-normal">{filters.tiposUsuario.length}</Badge>}</Button></PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" side="bottom" align="start"><Command><CommandInput placeholder="Procurar tipo..." /><CommandList className="max-h-[200px] overflow-y-auto"><CommandEmpty>Nenhum tipo encontrado.</CommandEmpty><CommandGroup>{userTypes.map((type) => (<CommandItem key={type.value} onSelect={() => handleUserTypeSelect(type.value)}><div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", filters.tiposUsuario.includes(type.value) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}><Check className="h-4 w-4" /></div><span>{type.label}</span></CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent>
            </Popover>
            {isFilterActive && <Button onClick={clearFilters} variant="ghost" className="text-destructive hover:text-destructive"><FilterX className="mr-2 h-4 w-4" />Limpar Filtros</Button>}
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden hidden md:block">
          <Table>
            <TableHeader><TableRow><TableHead onClick={() => requestSort('nome')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Nome {renderSortArrow('nome')}</div></TableHead><TableHead onClick={() => requestSort('nif')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">NIF {renderSortArrow('nif')}</div></TableHead><TableHead onClick={() => requestSort('empresa')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Empresa {renderSortArrow('empresa')}</div></TableHead><TableHead onClick={() => requestSort('funcao')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Função {renderSortArrow('funcao')}</div></TableHead><TableHead onClick={() => requestSort('inicio_vinculo')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Início de Vínculo {renderSortArrow('inicio_vinculo')}</div></TableHead><TableHead onClick={() => requestSort('tipo_usuario')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Tipo de Utilizador {renderSortArrow('tipo_usuario')}</div></TableHead><TableHead onClick={() => requestSort('tipo_registo')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Tipo de Registo {renderSortArrow('tipo_registo')}</div></TableHead><TableHead onClick={() => requestSort('status')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Status {renderSortArrow('status')}</div></TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
                : sortedAndFilteredUsers.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum utilizador encontrado.</TableCell></TableRow>
                : sortedAndFilteredUsers.map((user) => (<TableRow key={user.id}>
                    <TableCell className="font-medium"><div className="flex items-center gap-3"><Avatar><AvatarImage src={user.avatar_url} alt={user.nome} /><AvatarFallback>{getInitials(user.nome)}</AvatarFallback></Avatar>{user.nome}</div></TableCell>
                    <TableCell>{user.nif}</TableCell><TableCell>{user.empresa || '-'}</TableCell><TableCell>{user.funcao}</TableCell>
                    <TableCell><TooltipProvider><Tooltip><TooltipTrigger className="cursor-help">{formatDate(user.inicio_vinculo)}</TooltipTrigger><TooltipContent><p>Data completa: {user.inicio_vinculo || 'Não definida'}</p></TooltipContent></Tooltip></TooltipProvider></TableCell>
                    <TableCell className="capitalize">{user.tipo_usuario === 'usuario' ? 'Utilizador' : user.tipo_usuario?.replace(/_/g, ' ')}</TableCell><TableCell className="capitalize">{user.tipo_registo}</TableCell>
                    <TableCell><Badge variant={user.status === 'Ativo' ? 'success' : 'secondary'} className={cn(user.status === 'Ativo' ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100")}>{user.status || 'Ativo'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" disabled={isReadOnlyAdmin}><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          
                          <DropdownMenuItem onSelect={() => openEditDialog(user)} disabled={isReadOnlyAdmin}>
                            <Edit className="mr-2 h-4 w-4" />Editar
                          </DropdownMenuItem>

                          {isAdminStar && ['admin', 'admin_sub', 'admin_c'].includes(user.tipo_usuario) && (
                            <DropdownMenuItem onSelect={() => setManagingPermissionsFor(user)}>
                              <ShieldCheck className="mr-2 h-4 w-4" />Gerir Permissões
                            </DropdownMenuItem>
                          )}

                          {canAssignWorks(user) && <DropdownMenuItem onSelect={() => setAssigningSubcontractor(user)}><UserCog className="mr-2 h-4 w-4" />Atribuir Obras</DropdownMenuItem>}
                          {isAdminStar && <DropdownMenuItem onSelect={() => openPasswordDialog(user)}><Lock className="mr-2 h-4 w-4" />Ver/Alterar Senha</DropdownMenuItem>}
                          <DropdownMenuItem onSelect={() => toggleUserStatus(user)} disabled={isReadOnlyAdmin}><Power className="mr-2 h-4 w-4" />{user.status === 'Ativo' ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => openDeleteDialog(user)} className="text-red-500 hover:!text-red-500" disabled={isReadOnlyAdmin}>Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {isLoading ? <div className="text-center py-8"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>
            : sortedAndFilteredUsers.length === 0 ? <div className="text-center py-8 text-muted-foreground">Nenhum utilizador encontrado.</div>
            : sortedAndFilteredUsers.map((user) => (<Card key={user.id} className="w-full">
                <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                        <div className="flex items-center gap-3"><Avatar><AvatarImage src={user.avatar_url} alt={user.nome} /><AvatarFallback>{getInitials(user.nome)}</AvatarFallback></Avatar><span className="text-base font-bold">{user.nome}</span></div>
                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" disabled={isReadOnlyAdmin}><span className="sr-only">Abrir menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                
                                <DropdownMenuItem onSelect={() => openEditDialog(user)} disabled={isReadOnlyAdmin}>
                                  <Edit className="mr-2 h-4 w-4" />Editar
                                </DropdownMenuItem>

                                {isAdminStar && ['admin', 'admin_sub', 'admin_c'].includes(user.tipo_usuario) && (
                                    <DropdownMenuItem onSelect={() => setManagingPermissionsFor(user)}>
                                      <ShieldCheck className="mr-2 h-4 w-4" />Gerir Permissões
                                    </DropdownMenuItem>
                                )}

                                {canAssignWorks(user) && <DropdownMenuItem onSelect={() => setAssigningSubcontractor(user)}><UserCog className="mr-2 h-4 w-4" />Atribuir Obras</DropdownMenuItem>}
                                {isAdminStar && <DropdownMenuItem onSelect={() => openPasswordDialog(user)}><Lock className="mr-2 h-4 w-4" />Ver/Alterar Senha</DropdownMenuItem>}
                                <DropdownMenuItem onSelect={() => toggleUserStatus(user)} disabled={isReadOnlyAdmin}><Power className="mr-2 h-4 w-4" />{user.status === 'Ativo' ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => openDeleteDialog(user)} className="text-red-500 hover:!text-red-500" disabled={isReadOnlyAdmin}>Excluir</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <div className="flex items-center justify-between"><div className="flex items-center"><Hash className="h-4 w-4 mr-2 text-primary" />NIF: {user.nif}</div><Badge variant={user.status === 'Ativo' ? 'success' : 'secondary'} className={cn(user.status === 'Ativo' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>{user.status || 'Ativo'}</Badge></div>
                    <div className="flex items-center"><Building className="h-4 w-4 mr-2 text-primary" />Empresa: {user.empresa || '-'}</div>
                    <div className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-primary" />Função: {user.funcao}</div>
                    <div className="flex items-center"><Calendar className="h-4 w-4 mr-2 text-primary" />Início: {formatDate(user.inicio_vinculo)}</div>
                    <div className="flex items-center"><KeyRound className="h-4 w-4 mr-2 text-primary" />Tipo: <span className="capitalize ml-1">{user.tipo_usuario === 'usuario' ? 'Utilizador' : user.tipo_usuario?.replace(/_/g, ' ')}</span></div>
                    <div className="flex items-center"><KeyRound className="h-4 w-4 mr-2 text-primary" />Registo: <span className="capitalize ml-1">{user.tipo_registo}</span></div>
                </CardContent>
            </Card>))}
        </div>
      </motion.div>

      {editingUser && <EditUserDialog open={!!editingUser} onOpenChange={(isOpen) => !isOpen && setEditingUser(null)} user={editingUser} onSuccess={handleSuccess}/>}
      {deletingUser && <DeleteUserDialog open={!!deletingUser} onOpenChange={(isOpen) => !isOpen && setDeletingUser(null)} user={deletingUser} onSuccess={handleSuccess}/>}
      {assigningSubcontractor && <SubcontractorWorksAssignmentDialog isOpen={!!assigningSubcontractor} onOpenChange={(isOpen) => !isOpen && setAssigningSubcontractor(null)} subcontractor={assigningSubcontractor}/>}
      {managingPermissionsFor && <AdminPermissionsPanel admin={managingPermissionsFor} isOpen={!!managingPermissionsFor} onOpenChange={(isOpen) => !isOpen && setManagingPermissionsFor(null)}/>}

      <Dialog open={passwordDialogState.open} onOpenChange={closePasswordDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gerir Senha de {passwordDialogState.user?.nome}</DialogTitle><DialogDescription>Visualize ou altere a senha deste utilizador. Esta ação é exclusiva de administradores.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="password">Senha</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha..." className="pr-10" /><Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}<span className="sr-only">{showPassword ? "Ocultar senha" : "Mostrar senha"}</span></Button></div></div></div>
          <DialogFooter><Button variant="outline" onClick={closePasswordDialog} disabled={isUpdatingPassword}>Cancelar</Button><Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>{isUpdatingPassword ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar Alterações'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default UserDataTable;