import React, { useState, useEffect, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const SubcontractorHistory = () => {
  const { toast } = useToast();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      const subcontractorCompanies = ['Inforgás', 'Joao Maia Unip LDA', 'Antonio e Osavaldo', 'Época Zelosa', 'Wiisecure'];
      
      const { data: users, error: usersError } = await supabase
        .from('usuarios')
        .select('id')
        .in('empresa', subcontractorCompanies);

      if (usersError) {
        toast({ variant: 'destructive', title: 'Erro ao buscar usuários.' });
        setIsLoading(false);
        return;
      }

      const userIds = users.map(u => u.id);

      if (userIds.length === 0) {
        setRecords([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('registros_ponto')
        .select(`
          id,
          hora_inicio_real,
          hora_fim_real,
          turno,
          status_validacao,
          usuarios ( id, nome, empresa ),
          obras ( id, nome )
        `)
        .in('usuario_id', userIds)
        .order('hora_inicio_real', { ascending: false });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar histórico',
          description: error.message,
        });
      } else {
        setRecords(data);
      }
      setIsLoading(false);
    };

    fetchHistory();
  }, [toast]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        record.usuarios?.nome?.toLowerCase().includes(term) ||
        record.usuarios?.empresa?.toLowerCase().includes(term) ||
        record.obras?.nome?.toLowerCase().includes(term) ||
        record.turno?.toLowerCase().includes(term)
      );
    });
  }, [records, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: pt });
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full sm:w-auto sm:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar por nome, obra, turno..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full sm:w-80"
        />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trabalhador</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Obra</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum registo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.usuarios?.nome || 'N/A'}</TableCell>
                  <TableCell>{record.usuarios?.empresa || 'N/A'}</TableCell>
                  <TableCell>{record.obras?.nome || 'N/A'}</TableCell>
                  <TableCell>{record.turno}</TableCell>
                  <TableCell>{formatDate(record.hora_inicio_real)}</TableCell>
                  <TableCell>{formatDate(record.hora_fim_real)}</TableCell>
                  <TableCell>{record.status_validacao}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SubcontractorHistory;