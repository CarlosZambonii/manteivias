import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Combobox } from '@/components/ui/combobox';
import { useAuth } from '@/contexts/AuthContext';

const SubcontractorHistoryDialog = ({ open, onOpenChange, worker }) => {
  const { toast } = useToast();
  const { user: currentUser, isEncarregado } = useAuth();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ date: '', obraId: '', turno: 'all' });
  const [worksites, setWorksites] = useState([]);

  useEffect(() => {
    if (!open || !worker || !currentUser) return;

    const fetchWorksites = async () => {
      let query = supabase.from('obras').select('id, nome');
      
      if (isEncarregado) {
        query = query.eq('encarregado_id', currentUser.id);
      }

      const { data, error } = await query;
      
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar obras.' });
      } else {
        setWorksites(data || []);
      }
    };

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        let obraIdsFilter = [];
        
        if (isEncarregado) {
          // Get only IDs for worksites this encarregado manages
          const { data: myObras, error: obrasError } = await supabase
            .from('obras')
            .select('id')
            .eq('encarregado_id', currentUser.id);
            
          if (obrasError) throw obrasError;
          obraIdsFilter = myObras.map(o => o.id);
          
          if (obraIdsFilter.length === 0) {
              setRecords([]);
              setIsLoading(false);
              return;
          }
        }

        let query = supabase
          .from('registros_ponto')
          .select('id, hora_inicio_real, turno, obras (id, nome)')
          .eq('usuario_id', worker.id)
          .order('hora_inicio_real', { ascending: false });

        if (isEncarregado) {
          query = query.in('obra_id', obraIdsFilter);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        } else {
          setRecords(data || []);
        }
      } catch (error) {
         toast({ variant: 'destructive', title: 'Erro ao carregar histórico', description: error.message });
         setRecords([]);
      } finally {
         setIsLoading(false);
      }
    };

    fetchWorksites();
    fetchHistory();
  }, [open, worker, toast, currentUser, isEncarregado]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const recordDate = record.hora_inicio_real ? format(new Date(record.hora_inicio_real), 'yyyy-MM-dd') : '';
      const dateMatch = !filters.date || recordDate === filters.date;
      const obraMatch = !filters.obraId || record.obras?.id.toString() === filters.obraId;
      const turnoMatch = filters.turno === 'all' || record.turno === filters.turno;
      return dateMatch && obraMatch && turnoMatch;
    });
  }, [records, filters]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "dd/MM/yyyy", { locale: pt });
  };

  if (!worker) return null;

  const worksiteOptions = [
    { value: '', label: 'Todas as Obras' },
    ...worksites.map(site => ({
      value: site.id.toString(),
      label: `${site.id} - ${site.nome}`,
    }))
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Histórico de Ponto: {worker.nome}</DialogTitle>
          <DialogDescription>Consulte e filtre os registos de ponto do trabalhador.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
          />
          <Combobox
            options={worksiteOptions}
            value={filters.obraId}
            onChange={(value) => handleFilterChange('obraId', value)}
            placeholder="Filtrar por obra"
            searchPlaceholder="Pesquisar obra..."
            emptyPlaceholder="Nenhuma obra encontrada."
          />
          <Select onValueChange={(value) => handleFilterChange('turno', value)} value={filters.turno}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Turnos</SelectItem>
              <SelectItem value="Manhã">Manhã</SelectItem>
              <SelectItem value="Tarde">Tarde</SelectItem>
              <SelectItem value="FullTime">FullTime</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border overflow-auto max-h-[50vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Obra</TableHead>
                <TableHead>Turno</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    Nenhum registo encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.hora_inicio_real)}</TableCell>
                    <TableCell>{record.obras?.nome || 'N/A'}</TableCell>
                    <TableCell>{record.turno}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubcontractorHistoryDialog;