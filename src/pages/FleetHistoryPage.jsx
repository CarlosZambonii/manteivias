import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, AlertCircle, Calendar, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  subtext,
  loading
}) => <Card className={`text-white p-5 rounded-xl flex flex-col justify-between h-36 shadow-lg ${color}`}>
    <div className="flex justify-between items-start">
      <h3 className="font-semibold text-sm opacity-90">{title}</h3>
      <div className="p-2 bg-white/20 rounded-full">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="text-left mt-2">
      {loading ? <Loader2 className="w-8 h-8 animate-spin opacity-80" /> : <p className="text-4xl font-bold tracking-tight">{value}</p>}
      <p className="text-xs font-medium opacity-80 mt-1">
        {subtext}
      </p>
    </div>
  </Card>;

const UsageListItem = ({
  item
}) => {
  // Safely access joined data
  const equipmentName = item.equipamentos?.nome || 'Equipamento Desconhecido';
  const worksiteName = item.obras?.nome || 'Obra Desconhecida';
  const itemDate = format(new Date(item.data), 'yyyy-MM-dd');

  // Determine status visual based on 'estado'
  const isOperational = item.estado === 'Operacional' || item.estado === 'Aprovado';
  const isPending = item.estado === 'Pendente';
  return <div className="bg-card border border-border p-4 rounded-lg flex justify-between items-center transition-all hover:shadow-md mb-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
           <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">{itemDate}</span>
           <span className="font-bold text-foreground">{equipmentName}</span>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>{worksiteName}</span>
          <span>•</span>
          <span>{item.horas_km_registadas} horas/km</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
         <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${isOperational ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : isPending ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {isOperational ? <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Aprovado</span>
                </> : isPending ? <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pendente</span>
                </> : <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{item.estado || 'Avariado'}</span>
                </>}
         </div>
      </div>
    </div>;
};

const FleetHistoryPage = ({ isTab = false }) => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Separate state for global stats vs monthly stats
  const [globalStats, setGlobalStats] = useState({
    incidents: 0,
    maintenance: 0,
    pendingValidations: 0
  });
  const [monthlyStats, setMonthlyStats] = useState({
    approved: 0
  });
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch global stats (Equipment status, pending queues) - independent of selected month
  const fetchGlobalStats = useCallback(async () => {
    try {
      // 1. Incidentes Pendentes (Equipamentos Avariados)
      const {
        count: incidentsCount
      } = await supabase.from('equipamentos').select('*', {
        count: 'exact',
        head: true
      }).eq('status', 'Avariado');

      // 2. Manutenções Agendadas
      const {
        count: maintenanceCount
      } = await supabase.from('equipamentos').select('*', {
        count: 'exact',
        head: true
      }).eq('status_manutencao', 'Agendada');

      // 3. Validações Pendentes (Registos Pendentes)
      const {
        count: pendingCount
      } = await supabase.from('utilizacao_frota').select('*', {
        count: 'exact',
        head: true
      }).eq('estado', 'Pendente');
      setGlobalStats({
        incidents: incidentsCount || 0,
        maintenance: maintenanceCount || 0,
        pendingValidations: pendingCount || 0
      });
    } catch (error) {
      console.error("Error fetching global stats:", error);
    }
  }, []);
  const fetchHistoryData = useCallback(async () => {
    setLoading(true);
    const startDate = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

    // Fetch usage data for the list
    const {
      data,
      error
    } = await supabase.from('utilizacao_frota').select(`
        *,
        equipamentos ( nome ),
        obras ( nome )
      `).gte('data', startDate).lte('data', endDate).order('data', {
      ascending: false
    });
    if (!error && data) {
      setUsages(data);

      // Calculate monthly approved count from the fetched data
      const approvedCount = data.filter(item => item.estado === 'Operacional' || item.estado === 'Aprovado').length;
      setMonthlyStats({
        approved: approvedCount
      });
    } else {
      console.error("Error fetching history:", error);
    }
    setLoading(false);
  }, [selectedMonth]);
  useEffect(() => {
    fetchGlobalStats();
    fetchHistoryData();
  }, [fetchGlobalStats, fetchHistoryData]);
  
  const handleMonthChange = value => {
    const [year, month] = value.split('-').map(Number);
    setSelectedMonth(new Date(year, month - 1, 15));
  };
  
  const monthOptions = useMemo(() => Array.from({
    length: 12
  }, (_, i) => subMonths(new Date(), i)), []);
  
  return <>
      {!isTab && (
        <Helmet>
            <title>Histórico de Frotas</title>
            <meta name="description" content="Histórico de utilização de frotas e equipamentos." />
        </Helmet>
      )}
      
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
             {!isTab && (
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
             )}
             <div>
                 <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Histórico</h1>
                 <p className="text-muted-foreground text-sm">Visão geral da frota e validações</p>
             </div>
          </div>

          <Select value={format(selectedMonth, 'yyyy-MM')} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecionar mês..." />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(m => <SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                    {format(m, 'MMMM yyyy', {
                locale: pt
              })}
                  </SelectItem>)}
              </SelectContent>
            </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard title="Incidentes Pendentes" value={globalStats.incidents} icon={AlertCircle} color="bg-red-500" subtext="pendentes" loading={loading} />
          <StatCard title="Manutenções Agendadas" value={globalStats.maintenance} icon={Calendar} color="bg-amber-500" subtext="agendadas" loading={loading} />
          <StatCard title="Validações Pendentes" value={globalStats.pendingValidations} icon={Clock} color="bg-purple-500" subtext="pendentes" loading={loading} />
          <StatCard title="Validações Aprovadas" value={monthlyStats.approved} icon={CheckCircle} color="bg-green-500" subtext="aprovadas este mês" loading={loading} />
        </div>

        <div className="space-y-5">
            <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
                <h2 className="text-lg font-semibold">O Meu Histórico de Utilizações</h2>
            </div>
            
            {loading ? <div className="flex flex-col items-center justify-center h-64 bg-muted/10 rounded-xl border border-dashed">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">A carregar histórico...</p>
                </div> : usages.length > 0 ? <div className="space-y-2">
                    {usages.map(item => <UsageListItem key={item.id} item={item} />)}
                </div> : <div className="flex flex-col items-center justify-center h-64 bg-muted/10 rounded-xl border border-dashed">
                    <Clock className="w-12 h-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground font-medium">Sem registos neste mês</p>
                    <p className="text-sm text-muted-foreground/80">Selecione outro mês ou aguarde novas validações.</p>
                </div>}
        </div>
      </div>
    </>;
};

export default FleetHistoryPage;