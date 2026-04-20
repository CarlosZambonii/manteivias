import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, Check, ChevronsUpDown, Car, Wrench } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';
import { formatObraOption } from '@/utils/formatObraDisplay';

const RegisterFleetUsagePage = ({ isTab = false }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState(new Date());
  
  const [resourceType, setResourceType] = useState('equipment'); // 'equipment' or 'vehicle'

  const [equipment, setEquipment] = useState('');
  const [vehicle, setVehicle] = useState('');
  
  const [worksite, setWorksite] = useState('');
  const [worksites, setWorksites] = useState([]);
  
  const [equipmentList, setEquipmentList] = useState([]);
  const [vehicleList, setVehicleList] = useState([]);
  
  const [openEquipment, setOpenEquipment] = useState(false);
  const [openVehicle, setOpenVehicle] = useState(false);
  const [openWorksite, setOpenWorksite] = useState(false);
  
  const [loadingWorksites, setLoadingWorksites] = useState(true);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Carregar Obras no início
  useEffect(() => {
    const fetchWorksites = async () => {
      setLoadingWorksites(true);
      const { data, error } = await supabase
        .from('obras')
        .select('id, nome')
        .order('id', { ascending: true }); // Standardized sorting

      if (error) {
        console.error('Error fetching worksites:', error);
        toast({
          title: "Erro ao carregar obras",
          description: "Não foi possível carregar a lista de obras. Tente novamente.",
          variant: "destructive",
        });
      } else {
        setWorksites(data.map(formatObraOption)); // Standardized display
      }
      setLoadingWorksites(false);
    };

    fetchWorksites();
  }, [toast]);

  // Carregar Equipamentos quando a Obra muda
  useEffect(() => {
    const fetchEquipmentByWorksite = async () => {
      // Resetar equipamento selecionado quando a obra muda
      setEquipment('');
      
      if (!worksite) {
        setEquipmentList([]);
        return;
      }

      setLoadingEquipment(true);
      // Converter ID para inteiro para garantir comparação correta no banco
      const worksiteId = parseInt(worksite, 10);

      const { data, error } = await supabase
        .from('equipamentos')
        .select('id, nome, codigo')
        .eq('obra_id', worksiteId) // Filtra pela obra selecionada
        .order('nome', { ascending: true });

      if (error) {
        console.error('Error fetching equipment:', error);
        toast({
          title: "Erro ao carregar equipamentos",
          description: "Não foi possível carregar a lista de equipamentos desta obra.",
          variant: "destructive",
        });
        setEquipmentList([]);
      } else {
        setEquipmentList(data.map(eq => ({ 
          id: eq.id.toString(), 
          nome: eq.nome,
          codigo: eq.codigo
        })));
      }
      setLoadingEquipment(false);
    };

    fetchEquipmentByWorksite();
  }, [worksite, toast]);

  // Carregar Veículos quando a Obra muda
  useEffect(() => {
    const fetchVehiclesByWorksite = async () => {
      setVehicle('');
      
      if (!worksite) {
        setVehicleList([]);
        return;
      }

      setLoadingVehicles(true);
      
      const { data, error } = await supabase
        .from('veiculos')
        .select('id, matricula, modelo, obra_id') 
        .order('matricula', { ascending: true });

      if (error) {
          console.error('Supabase Error:', error);
          toast({
              title: "Erro ao carregar veículos",
              description: `Erro: ${error.message}`,
              variant: "destructive",
          });
          setVehicleList([]);
      } else {
          const filteredData = data ? data.filter(v => v.obra_id == worksite) : [];
          setVehicleList(filteredData.map(v => ({ 
              id: v.id.toString(), 
              matricula: v.matricula,
              modelo: v.modelo
          })));
      }
      setLoadingVehicles(false);
    };

    fetchVehiclesByWorksite();
  }, [worksite, toast]);

  const handleContinue = () => {
    if (!worksite || !date) {
        toast({
            title: "Campos em falta",
            description: "Por favor, preencha todos os campos obrigatórios.",
            variant: "warning",
        });
        return;
    }

    if (resourceType === 'equipment' && !equipment) {
        toast({
            title: "Selecione o equipamento",
            description: "É necessário selecionar um equipamento para continuar.",
            variant: "warning",
        });
        return;
    }

    if (resourceType === 'vehicle' && !vehicle) {
        toast({
            title: "Selecione o veículo",
            description: "É necessário selecionar um veículo para continuar.",
            variant: "warning",
        });
        return;
    }

    const payload = {
        worksite,
        date: date.toISOString(),
        type: resourceType,
        equipment: resourceType === 'equipment' ? equipment : null,
        vehicle: resourceType === 'vehicle' ? vehicle : null,
        resourceId: resourceType === 'equipment' ? equipment : vehicle
    };

    navigate('/admin/frotas/guia', { state: payload });
  };

  const getEquipmentDisplayName = (item) => {
    if (!item) return '';
    return item.codigo ? `[${item.codigo}] ${item.nome}` : item.nome;
  };

  const getVehicleDisplayName = (item) => {
    if (!item) return '';
    return `[${item.matricula}] ${item.modelo}`;
  };

  return (
    <>
      {!isTab && (
        <Helmet>
            <title>Registar Utilização de Frotas</title>
            <meta name="description" content="Registe a utilização de um equipamento ou veículo da frota." />
        </Helmet>
      )}
      
      <div className="container mx-auto px-4 md:px-6">
        {!isTab && (
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
        )}
        
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl shadow-lg border-muted/60">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Registar Utilização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* 1. Campo Obra */}
              <div className="space-y-2">
                <Label htmlFor="worksite">Obra</Label>
                <Popover open={openWorksite} onOpenChange={setOpenWorksite}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openWorksite}
                      className="w-full justify-between h-11"
                      id="worksite"
                      disabled={loadingWorksites}
                    >
                      {loadingWorksites 
                        ? 'A carregar obras...' 
                        : worksite
                          ? worksites.find((item) => item.value === worksite)?.label
                          : 'Selecione a obra...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Procurar obra..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma obra encontrada.</CommandEmpty>
                        <CommandGroup>
                          {worksites.map((item) => (
                            <CommandItem
                              key={item.value}
                              value={`${(item.label || '').replace(/"/g, '')} ${item.value}`} 
                              onSelect={() => {
                                setWorksite(item.value === worksite ? '' : item.value);
                                setOpenWorksite(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  worksite === item.value ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {item.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* 2. Campo Data */}
              <div className="space-y-2">
                <Label htmlFor="date">Data de Utilização</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal h-11',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP', { locale: pt }) : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      locale={pt}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 3. Selector de Tipo de Recurso e Combobox correspondente */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Label className="text-sm font-medium">
                        {resourceType === 'equipment' ? 'Selecione o Equipamento' : 'Selecione o Veículo'}
                    </Label>
                    <div className="flex bg-muted p-1 rounded-lg">
                        <Button 
                            type="button"
                            variant={resourceType === 'equipment' ? 'secondary' : 'ghost'} 
                            size="sm"
                            onClick={() => setResourceType('equipment')}
                            className={cn("flex-1 sm:flex-none gap-2 text-xs", resourceType === 'equipment' && "bg-background shadow-sm")}
                        >
                            <Wrench className="w-3 h-3" />
                            Equipamentos
                        </Button>
                        <Button 
                            type="button"
                            variant={resourceType === 'vehicle' ? 'secondary' : 'ghost'} 
                            size="sm"
                            onClick={() => setResourceType('vehicle')}
                            className={cn("flex-1 sm:flex-none gap-2 text-xs", resourceType === 'vehicle' && "bg-background shadow-sm")}
                        >
                            <Car className="w-3 h-3" />
                            Veículos
                        </Button>
                    </div>
                </div>

                {resourceType === 'equipment' ? (
                    <div className="space-y-1">
                         <Popover open={openEquipment} onOpenChange={setOpenEquipment}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openEquipment}
                                className="w-full justify-between h-11"
                                id="equipment"
                                disabled={!worksite || loadingEquipment}
                                >
                                {!worksite 
                                    ? 'Selecione a obra primeiro'
                                    : loadingEquipment 
                                    ? 'A carregar equipamentos...'
                                    : equipment
                                        ? getEquipmentDisplayName(equipmentList.find((item) => item.id === equipment))
                                        : equipmentList.length === 0 
                                        ? 'Sem equipamentos nesta obra' 
                                        : 'Selecione o equipamento...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                <CommandInput placeholder="Procurar equipamento..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
                                    <CommandGroup>
                                    {equipmentList.map((item) => (
                                        <CommandItem
                                        key={item.id}
                                        value={item.nome ? item.nome.replace(/"/g, '') : ''}
                                        onSelect={() => {
                                            setEquipment(item.id === equipment ? '' : item.id);
                                            setOpenEquipment(false);
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            'mr-2 h-4 w-4',
                                            equipment === item.id ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        {getEquipmentDisplayName(item)}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {worksite && equipmentList.length === 0 && !loadingEquipment && (
                            <p className="text-xs text-muted-foreground text-red-500 px-1">
                                Não há equipamentos registados para esta obra.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1">
                         <Popover open={openVehicle} onOpenChange={setOpenVehicle}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openVehicle}
                                className="w-full justify-between h-11"
                                id="vehicle"
                                disabled={!worksite || loadingVehicles}
                                >
                                {!worksite 
                                    ? 'Selecione a obra primeiro'
                                    : loadingVehicles 
                                    ? 'A carregar veículos...'
                                    : vehicle
                                        ? getVehicleDisplayName(vehicleList.find((item) => item.id === vehicle))
                                        : vehicleList.length === 0 
                                        ? 'Sem veículos nesta obra' 
                                        : 'Selecione o veículo...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                <CommandInput placeholder="Procurar veículo (matrícula ou modelo)..." />
                                <CommandList>
                                    <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                                    <CommandGroup>
                                    {vehicleList.map((item) => (
                                        <CommandItem
                                        key={item.id}
                                        value={`${item.matricula} ${item.modelo}`.replace(/"/g, '')}
                                        onSelect={() => {
                                            setVehicle(item.id === vehicle ? '' : item.id);
                                            setOpenVehicle(false);
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            'mr-2 h-4 w-4',
                                            vehicle === item.id ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                        {getVehicleDisplayName(item)}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {worksite && vehicleList.length === 0 && !loadingVehicles && (
                            <p className="text-xs text-muted-foreground text-red-500 px-1">
                                Não há veículos registados para esta obra.
                            </p>
                        )}
                    </div>
                )}
              </div>

            </CardContent>
            <CardFooter>
              <Button className="w-full h-11 text-base" onClick={handleContinue}>
                Continuar
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RegisterFleetUsagePage;