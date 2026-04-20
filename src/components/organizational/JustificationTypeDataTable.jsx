import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2, PlusCircle, Fingerprint, Search, ArrowUpDown } from 'lucide-react';
import EditJustificationTypeDialog from './EditJustificationTypeDialog';
import DeleteJustificationTypeDialog from './DeleteJustificationTypeDialog';
import { useAuth } from '@/contexts/AuthContext';

const JustificationTypeDataTable = () => {
  const [justificationTypes, setJustificationTypes] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'ascending' });
  const [editingType, setEditingType] = useState(null);
  const [deletingType, setDeletingType] = useState(null);
  const { toast } = useToast();
  const { isReadOnlyAdmin } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tipos_justificação').select('*');
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar dados', description: error.message });
    } else {
      setJustificationTypes(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSuccess = () => {
    fetchData();
    setEditingType(null);
    setDeletingType(null);
  };
  
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredTypes = useMemo(() => {
    let sortableItems = [...justificationTypes];
    
    if (filter) {
        const lowercasedFilter = filter.toLowerCase();
        sortableItems = sortableItems.filter(
          (type) =>
            type.nome?.toLowerCase().includes(lowercasedFilter) ||
            type.codigo?.toLowerCase().includes(lowercasedFilter)
        );
    }

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
  }, [justificationTypes, filter, sortConfig]);

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return sortConfig.direction === 'ascending' ?
      <ArrowUpDown className="ml-2 h-4 w-4" /> :
      <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
           <div className="relative w-full flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome ou código..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <Button onClick={() => setEditingType({})} className="w-full sm:w-auto" disabled={isReadOnlyAdmin}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tipo
          </Button>
        </div>
        
        <div className="rounded-lg border overflow-hidden hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => requestSort('nome')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Nome {renderSortArrow('nome')}</div></TableHead>
                <TableHead onClick={() => requestSort('codigo')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Código {renderSortArrow('codigo')}</div></TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                     <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : sortedAndFilteredTypes.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Nenhum tipo de justificação encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.nome}</TableCell>
                    <TableCell>{type.codigo || '-'}</TableCell>
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
                          <DropdownMenuItem onSelect={() => setEditingType(type)} disabled={isReadOnlyAdmin}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDeletingType(type)} className="text-red-500 focus:text-red-500 focus:bg-red-500/10" disabled={isReadOnlyAdmin}>
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

        <div className="grid grid-cols-1 gap-4 md:hidden">
             {loading ? (
                <div className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </div>
            ) : sortedAndFilteredTypes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    Nenhum tipo de justificação encontrado.
                </div>
            ) : (
                sortedAndFilteredTypes.map((type) => (
                    <Card key={type.id} className="w-full">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span className="text-base font-bold">{type.nome}</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isReadOnlyAdmin}>
                                            <span className="sr-only">Abrir menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onSelect={() => setEditingType(type)} disabled={isReadOnlyAdmin}>Editar</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => setDeletingType(type)} className="text-red-500 focus:text-red-500 focus:bg-red-500/10" disabled={isReadOnlyAdmin}>Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                             <div className="flex items-center"><Fingerprint className="h-4 w-4 mr-2 text-primary" /> Código: {type.codigo || '-'}</div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
      </motion.div>
      {editingType && (
        <EditJustificationTypeDialog
          justificationType={editingType}
          onOpenChange={(isOpen) => !isOpen && setEditingType(null)}
          onSuccess={handleSuccess}
        />
      )}
      {deletingType && (
        <DeleteJustificationTypeDialog
          justificationType={deletingType}
          onOpenChange={(isOpen) => !isOpen && setDeletingType(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
};

export default JustificationTypeDataTable;