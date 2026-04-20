import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Wrench, AlertTriangle, Ban, TrendingUp, Download, Bell, ArrowUpDown, ArrowUp, ArrowDown, Plus, Pencil, Trash2, CheckCircle, XCircle, Search, Filter, X, Check, ChevronsUpDown, CalendarPlus as CalendarIcon, ThumbsUp, ThumbsDown, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { format, subDays, startOfMonth } from 'date-fns';
import EquipmentModal from '@/components/fleet/EquipmentModal';
import IncidentEditModal from '@/components/fleet/IncidentEditModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { formatObraDisplay } from '@/utils/formatObraDisplay';

const StatCard = ({ title, value, subtitle, icon: Icon, className, iconClassName }) => (
  <Card className={`${className} text-white border-none shadow-lg`}>
    <CardContent className="p-6 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
        </div>
        <div className={`p-2 rounded-full bg-white/20 ${iconClassName}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-xs mt-4 opacity-80">{subtitle}</p>
    </CardContent>
  </Card>
);

const SortableHeader = ({ label, sortKey, currentSort, onSort, className }) => {
  const isSorted = currentSort.key === sortKey;
  return (
    <TableHead 
      className={`cursor-pointer hover:bg-muted/50 transition-colors select-none whitespace-nowrap ${className}`} 
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        {isSorted ? (
          currentSort.direction === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );
};

const WorksiteCombobox = ({ worksites, value, onChange }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value && value !== 'all'
            ? worksites.find((w) => w.id.toString() === value)?.nome
              ? formatObraDisplay(value, worksites.find((w) => w.id.toString() === value).nome) // Standardized display
              : "Obra Desconhecida"
            : "Todas as Obras"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Procurar obra (ID ou Nome)..." />
          <CommandList>
            <CommandEmpty>Nenhuma obra encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all - Todas as Obras"
                onSelect={() => {
                  onChange('all')
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === 'all' ? "opacity-100" : "opacity-0"
                  )}
                />
                Todas as Obras
              </CommandItem>
              {worksites.map((worksite) => (
                <CommandItem
                  key={worksite.id}
                  value={`${worksite.id} - ${worksite.nome}`.replace(/"/g, "")}
                  onSelect={() => {
                    onChange(worksite.id.toString())
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === worksite.id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {formatObraDisplay(worksite.id, worksite.nome)} {/* Standardized display */}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const EquipmentCombobox = ({ equipmentList, value, onChange }) => {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between truncate"
        >
          {value && value !== 'all'
            ? equipmentList.find((e) => e.id.toString() === value)?.nome
            : "Todos os Equipamentos"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Procurar equipamento..." />
          <CommandList>
            <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all - Todos os Equipamentos"
                onSelect={() => {
                  onChange('all')
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === 'all' ? "opacity-100" : "opacity-0"
                  )}
                />
                Todos os Equipamentos
              </CommandItem>
              {equipmentList.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.id} - ${item.nome} ${item.codigo || ''}`.replace(/"/g, "")}
                  onSelect={() => {
                    onChange(item.id.toString())
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.nome} {item.codigo && <span className="text-muted-foreground ml-1">({item.codigo})</span>}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const FleetAdminDashboardPage = ({ isTab = false }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [worksites, setWorksites] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Modal & CRUD states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);
  const [viewImage, setViewImage] = useState(null); // State for image viewer

  // Incident Edit Modal State
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [currentIncident, setCurrentIncident] = useState(null);

  // Filters for Recent Records Tab
  const [selectedWorksite, setSelectedWorksite] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('to_validate');
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

  // Filters for Equipment Tab
  const [equipmentFilters, setEquipmentFilters] = useState({
    name: '',
    worksite: 'all',
    foreman: 'all',
    status: 'all'
  });

  // Filters for Incidents Tab
  const [incidentFilters, setIncidentFilters] = useState({
    equipmentId: 'all',
    dateStart: '',
    dateEnd: '',
    priority: 'all',
    status: 'all'
  });

  // Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'data', direction: 'desc' });
  const [equipmentSortConfig, setEquipmentSortConfig] = useState({ key: 'nome', direction: 'asc' });
  const [incidentSortConfig, setIncidentSortConfig] = useState({ key: 'data', direction: 'desc' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: worksitesData } = await supabase.from('obras')
        .select('id, nome')
        .order('id', { ascending: true }); // Standardized sorting
      setWorksites(worksitesData || []);

      const { data: usersData } = await supabase.from('usuarios').select('id, nome').eq('status', 'Ativo').order('nome');
      setUsers(usersData || []);

      const { data: usageData, error: usageError } = await supabase
        .from('utilizacao_frota')
        .select(`
          *,
          obras (id, nome),
          usuarios (id, nome),
          equipamentos (id, nome, codigo)
        `)
        .order('data', { ascending: false });

      if (usageError) throw usageError;
      setRecords(usageData || []);

      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          obras (id, nome),
          usuarios (id, nome)
        `)
        .order('nome');

      if (equipmentError) {
        console.warn('Could not fetch equipment table', equipmentError);
      } else {
        setEquipmentList(equipmentData || []);
      }

    } catch (error) {
      console.error('Error fetching fleet data:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os dados da frota.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic for Records
  const filteredRecords = useMemo(() => {
    let filtered = [...records];
    const now = new Date();
    let startDate;

    if (selectedPeriod === '30days') {
      startDate = subDays(now, 30);
    } else if (selectedPeriod === 'thisMonth') {
      startDate = startOfMonth(now);
    } else if (selectedPeriod === 'lastMonth') {
      startDate = startOfMonth(subDays(startOfMonth(now), 1));
    }

    if (startDate) {
      filtered = filtered.filter(r => new Date(r.data) >= startDate);
    }

    if (selectedWorksite !== 'all') {
      filtered = filtered.filter(r => r.obra_id?.toString() === selectedWorksite);
    }

    // Status Filter - UPDATED LOGIC
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'to_validate') {
        // EXCLUSION LOGIC: Show everything EXCEPT finalized statuses.
        // This ensures 'Funcional', 'Pendente', 'Avariado (Operacional)', and generic 'Avariado' (if operational) are shown.
        const excludedStatuses = ['Aprovado', 'Rejeitado', 'Manutenção', 'Inativo'];
        filtered = filtered.filter(r => !excludedStatuses.includes(r.estado));
      } else if (selectedStatus === 'functional') {
        filtered = filtered.filter(r => r.estado === 'Funcional');
      } else if (selectedStatus === 'maintenance') {
        filtered = filtered.filter(r => r.estado === 'Manutenção' || r.estado === 'Avariado');
      } else if (selectedStatus === 'validated') {
        filtered = filtered.filter(r => r.estado === 'Aprovado' || r.estado === 'Rejeitado');
      }
    }

    return filtered;
  }, [records, selectedPeriod, selectedWorksite, selectedStatus]);

  const sortedRecords = useMemo(() => {
    let sortableItems = [...filteredRecords];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        switch (sortConfig.key) {
          case 'usuario':
            aValue = a.usuarios?.nome || '';
            bValue = b.usuarios?.nome || '';
            break;
          case 'obra':
            aValue = a.obras?.nome || '';
            bValue = b.obras?.nome || '';
            break;
          case 'equipamento':
            aValue = a.equipamentos?.nome || '';
            bValue = b.equipamentos?.nome || '';
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredRecords, sortConfig]);

  // Equipment Filtering Logic
  const filteredEquipmentList = useMemo(() => {
    return equipmentList.filter(item => {
      const searchTerm = equipmentFilters.name.toLowerCase();
      const matchesName = item.nome.toLowerCase().includes(searchTerm) || 
                          (item.codigo && item.codigo.toLowerCase().includes(searchTerm));
      
      const matchesWorksite = equipmentFilters.worksite === 'all' || 
                              item.obra_id?.toString() === equipmentFilters.worksite;
      
      const matchesForeman = equipmentFilters.foreman === 'all' || 
                             item.encarregado?.toString() === equipmentFilters.foreman;
      
      const currentStatus = item.status_manutencao || item.status || 'N/A';
      const matchesStatus = equipmentFilters.status === 'all' || 
                            currentStatus === equipmentFilters.status;

      return matchesName && matchesWorksite && matchesForeman && matchesStatus;
    });
  }, [equipmentList, equipmentFilters]);

  const sortedEquipment = useMemo(() => {
    let sortableItems = [...filteredEquipmentList];
    if (equipmentSortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        switch (equipmentSortConfig.key) {
          case 'localizacao':
            aValue = a.obras?.nome || '';
            bValue = b.obras?.nome || '';
            break;
          case 'encarregado':
            aValue = a.usuarios?.nome || '';
            bValue = b.usuarios?.nome || '';
            break;
          default:
            aValue = a[equipmentSortConfig.key];
            if (equipmentSortConfig.key === 'horas_km_atual' && !aValue) aValue = a.horas_atuais;
            if (equipmentSortConfig.key === 'prox_revisao_oleo_h_km' && !aValue) aValue = a.proxima_revisao_oleo;
            if (equipmentSortConfig.key === 'status_manutencao' && !aValue) aValue = a.status;
        }
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';
        const numericFields = ['horas_km_atual', 'prox_revisao_oleo_h_km'];
        if (numericFields.includes(equipmentSortConfig.key)) {
           aValue = Number(aValue) || 0;
           bValue = Number(bValue) || 0;
        }
        if (aValue < bValue) return equipmentSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return equipmentSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredEquipmentList, equipmentSortConfig]);

  // Incident Filtering Logic
  const filteredIncidents = useMemo(() => {
    // MODIFIED: Specific filter for Maintenance and Damaged items as requested
    let data = records.filter(r => 
        r.estado === 'Manutenção' || 
        r.estado === 'Avariado' || 
        r.estado === 'Avariado (Operacional)'
    );

    if (incidentFilters.equipmentId !== 'all') {
      data = data.filter(r => r.equipamento_id?.toString() === incidentFilters.equipmentId);
    }
    if (incidentFilters.dateStart) {
      data = data.filter(r => new Date(r.data) >= new Date(incidentFilters.dateStart));
    }
    if (incidentFilters.dateEnd) {
      data = data.filter(r => new Date(r.data) <= new Date(incidentFilters.dateEnd));
    }
    if (incidentFilters.priority !== 'all') {
      data = data.filter(r => {
        const priority = r.prioridade || 'Média';
        return priority === incidentFilters.priority;
      });
    }
    if (incidentFilters.status !== 'all') {
      data = data.filter(r => r.estado === incidentFilters.status);
    }
    return data;
  }, [records, incidentFilters]);

  const sortedIncidents = useMemo(() => {
    let sortableItems = [...filteredIncidents];
    if (incidentSortConfig.key) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        switch (incidentSortConfig.key) {
          case 'funcionario':
            aValue = a.usuarios?.nome || '';
            bValue = b.usuarios?.nome || '';
            break;
          case 'incidente':
            aValue = a.observacoes || '';
            bValue = b.observacoes || '';
            break;
          case 'prioridade':
             aValue = a.prioridade || 'Média';
             bValue = b.prioridade || 'Média';
             // Custom priority sort order
             const priorityOrder = { 'Baixa': 1, 'Média': 2, 'Alta': 3, 'Crítica': 4 };
             aValue = priorityOrder[aValue] || 2;
             bValue = priorityOrder[bValue] || 2;
             break;
          case 'estado':
             aValue = a.estado || '';
             bValue = b.estado || '';
             break;
          case 'equipamento':
            aValue = a.equipamentos?.nome || '';
            bValue = b.equipamentos?.nome || '';
            break;
          default:
            aValue = a[incidentSortConfig.key];
            bValue = b[incidentSortConfig.key];
        }
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';
        if (aValue < bValue) return incidentSortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return incidentSortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredIncidents, incidentSortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEquipmentSort = (key) => {
    let direction = 'asc';
    if (equipmentSortConfig.key === key && equipmentSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setEquipmentSortConfig({ key, direction });
  };

  const handleIncidentSort = (key) => {
    let direction = 'asc';
    if (incidentSortConfig.key === key && incidentSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setIncidentSortConfig({ key, direction });
  };

  const clearEquipmentFilters = () => {
    setEquipmentFilters({
      name: '',
      worksite: 'all',
      foreman: 'all',
      status: 'all'
    });
  };

  const clearRecentRecordsFilters = () => {
    setSelectedWorksite('all');
    setSelectedStatus('to_validate');
    setSelectedPeriod('30days');
  };

  const clearIncidentFilters = () => {
    setIncidentFilters({
      equipmentId: 'all',
      dateStart: '',
      dateEnd: '',
      priority: 'all',
      status: 'all'
    });
  };

  const stats = useMemo(() => {
    const uniqueEquipment = new Set(filteredRecords.map(r => r.equipamento_id)).size;
    const maintenanceCount = filteredRecords.filter(r => r.estado !== 'Funcional' && r.estado !== 'Aprovado' && r.estado !== 'Pendente').length;
    const totalRecords = filteredRecords.length;
    const inactiveCount = 0; 

    return {
      active: uniqueEquipment,
      maintenance: maintenanceCount,
      inactive: inactiveCount,
      total: totalRecords
    };
  }, [filteredRecords]);

  const handleExport = () => {
    toast({
      title: "Exportar Dados",
      description: "O download do relatório será iniciado em breve.",
    });
  };

  const handleExportIncidents = () => {
    toast({
      title: "Exportar Relatório de Incidentes",
      description: "O download do relatório de incidentes será iniciado em breve.",
    });
  };

  const handleAlert = () => {
    toast({
      title: "Gerar Alerta",
      description: "Sistema de alertas em desenvolvimento.",
    });
  };

  const handleApproveRecord = async (recordId) => {
    try {
      const { error } = await supabase
        .from('utilizacao_frota')
        .update({ estado: 'Aprovado' })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registo aprovado com sucesso.",
        variant: "default"
      });
      
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, estado: 'Aprovado' } : r));
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar registo.",
        variant: "destructive"
      });
    }
  };

  const handleRejectRecord = async (recordId) => {
    try {
      const { error } = await supabase
        .from('utilizacao_frota')
        .update({ estado: 'Rejeitado' })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registo rejeitado com sucesso.",
        variant: "default"
      });
      
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, estado: 'Rejeitado' } : r));
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar registo.",
        variant: "destructive"
      });
    }
  };

  const handleAddEquipment = () => {
    setCurrentEquipment(null);
    setIsModalOpen(true);
  };

  const handleEditEquipment = (equipment) => {
    setCurrentEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (equipment) => {
    setEquipmentToDelete(equipment);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!equipmentToDelete) return;

    try {
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', equipmentToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Equipamento removido com sucesso.",
        variant: "default"
      });
      fetchData();
    } catch (error) {
      console.error("Erro ao apagar:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover equipamento.",
        variant: "destructive"
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setEquipmentToDelete(null);
    }
  };

  const handleSaveEquipment = async (formData) => {
    try {
      const payload = {
        nome: formData.nome,
        codigo: formData.codigo,
        grupo_ativos: formData.grupo_ativos,
        obra_id: formData.obra_id && formData.obra_id !== 'none' ? parseInt(formData.obra_id) : null,
        encarregado: formData.encarregado && formData.encarregado !== 'none' ? parseInt(formData.encarregado) : null,
        horas_km_atual: parseFloat(formData.horas_km_atual) || 0,
        prox_revisao_oleo_h_km: parseFloat(formData.prox_revisao_oleo_h_km) || 0,
        status_manutencao: formData.status_manutencao,
        horas_atuais: parseFloat(formData.horas_km_atual) || 0,
        proxima_revisao_oleo: parseFloat(formData.prox_revisao_oleo_h_km) || 0,
        status: formData.status_manutencao,
        grupo: formData.grupo_ativos,
        updated_at: new Date()
      };

      let error;
      if (currentEquipment) {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update(payload)
          .eq('id', currentEquipment.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('equipamentos')
          .insert([{ ...payload, created_at: new Date() }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Equipamento ${currentEquipment ? 'atualizado' : 'criado'} com sucesso.`,
        variant: "default"
      });
      
      setIsModalOpen(false);
      fetchData();

    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o equipamento.",
        variant: "destructive"
      });
    }
  };

  const handleResolveIncident = (id) => {
    toast({
      title: "Resolver Incidente",
      description: `Marcar incidente ${id} como resolvido em desenvolvimento.`,
    });
  };

  const handleDismissIncident = (id) => {
    toast({
      title: "Ignorar Incidente",
      description: `Ignorar incidente ${id} em desenvolvimento.`,
    });
  };

  const handleEditIncident = (incident) => {
    setCurrentIncident(incident);
    setIsIncidentModalOpen(true);
  };

  const handleSaveIncident = async (data) => {
    if (!currentIncident) return;

    try {
      const { error } = await supabase
        .from('utilizacao_frota')
        .update({
          prioridade: data.prioridade,
          observacoes: data.observacoes,
          foto_url: data.foto_url
        })
        .eq('id', currentIncident.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Incidente atualizado com sucesso.",
        variant: "default"
      });

      // Update local state
      setRecords(prev => prev.map(r => 
        r.id === currentIncident.id 
          ? { ...r, prioridade: data.prioridade, observacoes: data.observacoes, foto_url: data.foto_url } 
          : r
      ));

      setIsIncidentModalOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar incidente:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o incidente.",
        variant: "destructive"
      });
    }
  };

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    records.forEach(r => {
      if (r.estado !== 'Funcional' && r.estado) {
        statuses.add(r.estado);
      }
    });
    return Array.from(statuses);
  }, [records]);

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Baixa': return "border-blue-500 text-blue-600 bg-blue-50";
      case 'Alta': return "border-orange-500 text-orange-600 bg-orange-50";
      case 'Crítica': return "border-red-600 text-red-700 bg-red-50";
      default: return "border-amber-500 text-amber-600 bg-amber-50"; // Média
    }
  };

  return (
    <>
      <Helmet>
        <title>Painel Administrativo de Frotas | Manteivias</title>
      </Helmet>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn("space-y-6", !isTab && "container mx-auto p-4 md:p-6")}
      >
        {!isTab && (
            <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold">Painel Administrativo de Frotas</h1>
                <p className="text-muted-foreground">Gestão e monitorização de equipamentos e veículos</p>
            </div>
            </div>
        )}
        
        {isTab && (
            <div>
                 <h2 className="text-2xl font-bold tracking-tight">Painel Administrativo</h2>
                 <p className="text-muted-foreground">Visão geral da frota e gestão de equipamentos.</p>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Equipamentos em Utilização" 
            value={stats.active} 
            subtitle="ativos no período selecionado"
            icon={Wrench}
            className="bg-emerald-500"
            iconClassName="text-emerald-500"
          />
          <StatCard 
            title="Em Manutenção" 
            value={stats.maintenance} 
            subtitle="equipamentos com incidentes"
            icon={AlertTriangle}
            className="bg-amber-500"
            iconClassName="text-amber-500"
          />
          <StatCard 
            title="Inativos" 
            value={stats.inactive} 
            subtitle="fora de serviço"
            icon={Ban}
            className="bg-rose-500"
            iconClassName="text-rose-500"
          />
          <StatCard 
            title="Total de Registos" 
            value={stats.total} 
            subtitle="neste período"
            icon={TrendingUp}
            className="bg-violet-500"
            iconClassName="text-violet-500"
          />
        </div>

        <Tabs defaultValue="recent" className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="recent">Registos Recentes</TabsTrigger>
              <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
              <TabsTrigger value="incidents">Incidentes/Manutenções</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recent" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-sm border-muted">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto items-end">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Obra / Localização</label>
                      <WorksiteCombobox worksites={worksites} value={selectedWorksite} onChange={setSelectedWorksite} />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Estado</label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Estados</SelectItem>
                          <SelectItem value="to_validate">Por Validar (Operacional/Avariado)</SelectItem>
                          <SelectItem value="validated">Validados (Aprovados/Rejeitados)</SelectItem>
                          <SelectItem value="functional">Apenas Funcional</SelectItem>
                          <SelectItem value="maintenance">Apenas Manutenção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Período</label>
                      <div className="flex items-center gap-2">
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30days">Últimos 30 dias</SelectItem>
                            <SelectItem value="thisMonth">Este Mês</SelectItem>
                            <SelectItem value="lastMonth">Mês Passado</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-muted-foreground hover:text-foreground gap-2"
                          onClick={clearRecentRecordsFilters}
                        >
                          <X className="h-4 w-4" />
                          Limpar
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full lg:w-auto justify-end mt-4 lg:mt-0">
                    <Button variant="outline" size="sm" onClick={handleAlert}>
                      <Bell className="w-4 h-4 mr-2" />
                      Gerar Alerta
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Dados
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-6 py-4 border-b">
                <CardTitle className="text-lg font-medium">Registos Recentes</CardTitle>
                <p className="text-sm text-muted-foreground">Registo de todas as utilizações dos equipamentos/veículos</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-md border-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <SortableHeader label="Data" sortKey="data" currentSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Equipamento" sortKey="equipamento" currentSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Funcionário" sortKey="usuario" currentSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Localização" sortKey="obra" currentSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Horas/KM" sortKey="horas_km_registadas" currentSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Estado" sortKey="estado" currentSort={sortConfig} onSort={handleSort} />
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">A carregar...</TableCell>
                        </TableRow>
                      ) : sortedRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                            Nenhum registo encontrado para os filtros selecionados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedRecords.map((record) => (
                          <TableRow key={record.id} className="hover:bg-muted/5">
                            <TableCell className="font-medium">
                              {format(new Date(record.data), 'yyyy-MM-dd')}
                            </TableCell>
                            <TableCell className="font-semibold text-primary">
                              {record.equipamentos?.nome || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {record.usuarios?.nome || 'N/A'} 
                            </TableCell>
                            <TableCell>
                              {record.obras?.nome || 'Obra Desconhecida'}
                            </TableCell>
                            <TableCell>
                              {record.horas_km_registadas} 
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  record.estado === 'Funcional' || record.estado === 'Aprovado' ? "default" : 
                                  record.estado === 'Rejeitado' ? "destructive" : 
                                  "secondary"
                                }
                                className={
                                  record.estado === 'Funcional' ? "bg-blue-500 hover:bg-blue-600" : 
                                  record.estado === 'Aprovado' ? "bg-green-500 hover:bg-green-600" :
                                  record.estado === 'Rejeitado' ? "bg-red-500 hover:bg-red-600" :
                                  "bg-amber-500 hover:bg-amber-600"
                                }
                              >
                                {record.estado || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               { !['Aprovado', 'Rejeitado', 'Manutenção', 'Inativo'].includes(record.estado) && (
                                 <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleApproveRecord(record.id)}
                                      title="Aprovar"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleRejectRecord(record.id)}
                                      title="Rejeitar"
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                 </div>
                               )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="equipment" className="space-y-4">
            {/* Equipment Filters */}
            <Card className="bg-card/50 backdrop-blur-sm border-muted">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Nome ou Código</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Pesquisar..." 
                        value={equipmentFilters.name}
                        onChange={(e) => setEquipmentFilters(prev => ({ ...prev, name: e.target.value }))}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Obra / Localização</label>
                    <WorksiteCombobox 
                      worksites={worksites} 
                      value={equipmentFilters.worksite} 
                      onChange={(val) => setEquipmentFilters(prev => ({ ...prev, worksite: val }))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Encarregado</label>
                    <Select 
                      value={equipmentFilters.foreman} 
                      onValueChange={(val) => setEquipmentFilters(prev => ({ ...prev, foreman: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os Encarregados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Encarregados</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={equipmentFilters.status} 
                        onValueChange={(val) => setEquipmentFilters(prev => ({ ...prev, status: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Status</SelectItem>
                          <SelectItem value="Funcional">Funcional</SelectItem>
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                          <SelectItem value="Inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-foreground gap-2"
                        onClick={clearEquipmentFilters}
                      >
                        <X className="h-4 w-4" />
                        Limpar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle>Gestão de Equipamentos</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Exibindo {sortedEquipment.length} equipamentos
                    {equipmentList.length !== sortedEquipment.length && ` (filtrado de ${equipmentList.length})`}
                  </p>
                </div>
                <Button onClick={handleAddEquipment} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Equipamento
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <SortableHeader label="Nome" sortKey="nome" currentSort={equipmentSortConfig} onSort={handleEquipmentSort} />
                        <SortableHeader label="Código" sortKey="codigo" currentSort={equipmentSortConfig} onSort={handleEquipmentSort} />
                        <SortableHeader label="Grupo" sortKey="grupo_ativos" currentSort={equipmentSortConfig} onSort={handleEquipmentSort} />
                        <SortableHeader label="Localização" sortKey="localizacao" currentSort={equipmentSortConfig} onSort={handleEquipmentSort} />
                        <SortableHeader label="Encarregado" sortKey="encarregado" currentSort={equipmentSortConfig} onSort={handleEquipmentSort} />
                        <SortableHeader label="Horas/KM Atual" sortKey="horas_km_atual" currentSort={equipmentSortConfig} onSort={handleEquipmentSort} />
                        <SortableHeader label="Próx. Óleo" sortKey="prox_revisao_oleo_h_km" currentSort={equipmentSortConfig} onSort={handleEquipmentSort} />
                        <SortableHeader label="Status" sortKey="status_manutencao" currentSort={equipmentSortConfig} onSort={handleEquipmentSort} />
                        <TableHead className="text-right sticky right-0 bg-background z-10 border-l">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center">A carregar...</TableCell>
                        </TableRow>
                      ) : sortedEquipment.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                            Nenhum equipamento encontrado com os filtros atuais.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedEquipment.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/5">
                            <TableCell className="font-semibold whitespace-nowrap">{item.nome}</TableCell>
                            <TableCell>{item.codigo || '-'}</TableCell>
                            <TableCell>{item.grupo_ativos || '-'}</TableCell>
                            <TableCell className="whitespace-nowrap">{formatObraDisplay(item.obras?.id, item.obras?.nome) || 'N/A'}</TableCell>
                            <TableCell className="whitespace-nowrap">{item.usuarios?.nome || 'N/A'}</TableCell>
                            <TableCell>{item.horas_km_atual || item.horas_atuais || 0}h</TableCell>
                            <TableCell className={(item.horas_km_atual || item.horas_atuais || 0) >= (item.prox_revisao_oleo_h_km || item.proxima_revisao_oleo || 0) ? "text-red-500 font-bold" : ""}>
                              {item.prox_revisao_oleo_h_km || item.proxima_revisao_oleo || '-'}h
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.status_manutencao === 'Funcional' || item.status === 'Funcional' ? "default" : "destructive"}
                                className={item.status_manutencao === 'Funcional' || item.status === 'Funcional' ? "bg-blue-500 hover:bg-blue-600 whitespace-nowrap" : "bg-amber-500 hover:bg-amber-600 whitespace-nowrap"}
                              >
                                {item.status_manutencao || item.status || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right sticky right-0 bg-background border-l z-10">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditEquipment(item)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(item)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-4">
             <Card className="bg-card/50 backdrop-blur-sm border-muted">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                  
                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Equipamento</label>
                    <EquipmentCombobox 
                      equipmentList={equipmentList} 
                      value={incidentFilters.equipmentId} 
                      onChange={(val) => setIncidentFilters(prev => ({ ...prev, equipmentId: val }))} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Data Início</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date"
                        className="pl-8"
                        value={incidentFilters.dateStart}
                        onChange={(e) => setIncidentFilters(prev => ({ ...prev, dateStart: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Data Fim</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date"
                        className="pl-8"
                        value={incidentFilters.dateEnd}
                        onChange={(e) => setIncidentFilters(prev => ({ ...prev, dateEnd: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Prioridade</label>
                    <Select 
                      value={incidentFilters.priority} 
                      onValueChange={(val) => setIncidentFilters(prev => ({ ...prev, priority: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Crítica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Estado</label>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={incidentFilters.status} 
                        onValueChange={(val) => setIncidentFilters(prev => ({ ...prev, status: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          {uniqueStatuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-foreground gap-2"
                        onClick={clearIncidentFilters}
                      >
                        <X className="h-4 w-4" />
                        Limpar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <CardTitle>Incidentes e Manutenções</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Exibindo {sortedIncidents.length} incidentes
                    {filteredRecords.filter(r => r.estado !== 'Funcional').length !== sortedIncidents.length && 
                      ` (filtrado de ${filteredRecords.filter(r => r.estado !== 'Funcional').length})`
                    }
                  </p>
                </div>
                <Button variant="outline" onClick={handleExportIncidents}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Relatório
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <SortableHeader label="Data" sortKey="data" currentSort={incidentSortConfig} onSort={handleIncidentSort} />
                      <SortableHeader label="Equipamento" sortKey="equipamento" currentSort={incidentSortConfig} onSort={handleIncidentSort} />
                      <SortableHeader label="Funcionário" sortKey="funcionario" currentSort={incidentSortConfig} onSort={handleIncidentSort} />
                      <SortableHeader label="Observação" sortKey="incidente" currentSort={incidentSortConfig} onSort={handleIncidentSort} />
                      <TableHead>Anexo</TableHead>
                      <SortableHeader label="Prioridade" sortKey="prioridade" currentSort={incidentSortConfig} onSort={handleIncidentSort} />
                      <SortableHeader label="Estado" sortKey="estado" currentSort={incidentSortConfig} onSort={handleIncidentSort} />
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedIncidents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          Nenhum incidente encontrado com os filtros atuais.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedIncidents.map((record) => (
                        <TableRow key={record.id} className="hover:bg-muted/5">
                          <TableCell>{format(new Date(record.data), 'yyyy-MM-dd')}</TableCell>
                          <TableCell className="font-medium">{record.equipamentos?.nome || 'N/A'}</TableCell>
                          <TableCell>{record.usuarios?.nome || 'N/A'}</TableCell>
                          <TableCell>
                             <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={record.observacoes}>
                               {record.observacoes || '-'}
                             </span>
                          </TableCell>
                          <TableCell>
                            {record.foto_url ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-2"
                                    onClick={() => setViewImage(record.foto_url)}
                                >
                                    <Paperclip className="w-4 h-4" />
                                    Ver Anexo
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-2 text-muted-foreground opacity-50 cursor-not-allowed"
                                    disabled
                                >
                                    <Paperclip className="w-4 h-4" />
                                    Sem Anexo
                                </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getPriorityColor(record.prioridade || 'Média')}>
                              {record.prioridade || 'Média'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-red-500 text-red-500 bg-red-50">
                              {record.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" 
                                onClick={() => handleEditIncident(record)}
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" 
                                onClick={() => handleResolveIncident(record.id)}
                                title="Resolver"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-gray-600" 
                                onClick={() => handleDismissIncident(record.id)}
                                title="Ignorar"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Equipment Modal */}
        <EquipmentModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEquipment}
          equipment={currentEquipment}
          worksites={worksites}
          users={users}
        />

        {/* Incident Edit Modal */}
        <IncidentEditModal 
          isOpen={isIncidentModalOpen}
          onClose={() => setIsIncidentModalOpen(false)}
          onSave={handleSaveIncident}
          incident={currentIncident}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isto irá apagar permanentemente o equipamento 
                <span className="font-semibold text-foreground"> {equipmentToDelete?.nome} </span>
                e remover os seus dados dos nossos servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Image View Modal */}
        <Dialog open={!!viewImage} onOpenChange={(open) => !open && setViewImage(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden bg-black/90 border-none flex items-center justify-center">
             {viewImage && (
                 <img
                    src={viewImage}
                    alt="Evidência do incidente"
                    className="max-w-full max-h-full object-contain"
                 />
             )}
          </DialogContent>
        </Dialog>

      </motion.div>
    </>
  );
};

export default FleetAdminDashboardPage;