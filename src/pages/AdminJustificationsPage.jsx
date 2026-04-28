import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { logAcao } from '@/lib/logService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Search, Filter } from 'lucide-react';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';
import JustificationsByUserList from '@/components/justifications/JustificationsByUserList';

const AdminJustificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [justifications, setJustifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'Todos',
    month: new Date(),
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJustifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const fromDate = startOfMonth(filters.month);
      const toDate = endOfMonth(filters.month);
      const userType = user?.tipo_usuario?.toLowerCase();
      const isAdmin = userType === 'admin' || userType === 'admin_star';

      let query = supabase
        .from('justificação')
        .select(`
          *,
          usuarios:usuario_id(id, nome, avatar_url, funcao), 
          tipos_justificação(nome)
        `)
        .gte('data_envio', fromDate.toISOString())
        .lte('data_envio', toDate.toISOString())
        .order('data_envio', { ascending: false });

      if (!isAdmin) {
        // Fetch managed worksites
        const { data: managedUsersData, error: managedUsersError } = await supabase
          .from('obras')
          .select('id')
          .eq('encarregado_id', user.id);
        
        if (managedUsersError) throw managedUsersError;
        
        const managedWorksiteIds = managedUsersData.map(w => w.id);

        if (managedWorksiteIds.length === 0) {
          setJustifications([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch users in those worksites
        const { data: usersInManagedWorksites, error: usersError } = await supabase
          .from('registros_ponto')
          .select('usuario_id')
          .in('obra_id', managedWorksiteIds);
          
        if (usersError) throw usersError;

        const managedUserIds = [...new Set(usersInManagedWorksites.map(u => u.usuario_id))];

        if(managedUserIds.length === 0){
          setJustifications([]);
          setIsLoading(false);
          return;
        }
        query = query.in('usuario_id', managedUserIds);
      }

      if (filters.status !== 'Todos') {
        query = query.eq('status_validacao', filters.status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setJustifications(data || []);

    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as justificações.' });
      setJustifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast, user.id, user.tipo_usuario]);

  useEffect(() => {
    fetchJustifications();
  }, [fetchJustifications]);

  const handleFilterChange = (key, value) => {
    if (key === 'month') {
      const [year, month] = value.split('-').map(Number);
      value = new Date(year, month - 1, 15);
    }
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleUpdateStatus = async (justification, status, comment = null) => {
    try {
      const updateData = { 
        status_validacao: status, 
        validado_por: user.id, 
        data_validacao: new Date().toISOString() 
      };

      if (status === 'Rejeitado' && comment) {
          updateData.rejeicao_comentario = comment;
      }

      const { error } = await supabase
          .from('justificação')
          .update(updateData)
          .eq('id', justification.id);

      if (error) throw error;

      logAcao(user, {
          acao: 'Edição',
          entidade: 'Justificação',
          modulo: 'Justificações',
          descricao: `Justificação ${status === 'Aprovado' ? 'aprovada' : 'rejeitada'}`,
      });

      // Optimistic update
      setJustifications(prev => prev.map(j =>
          j.id === justification.id ? { ...j, ...updateData } : j
      ));

      toast({
          variant: 'success',
          title: status === 'Aprovado' ? 'Justificação Aprovada' : 'Justificação Rejeitada',
          description: status === 'Rejeitado' ? 'O colaborador será notificado.' : null
      });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o estado.' });
      throw error; // Re-throw to handle loading state in child
    }
  };

  const monthOptions = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));

  return (
    <>
      <Helmet>
        <title>Gestão de Justificações</title>
        <meta name="description" content="Validar e gerir justificações de ausência." />
      </Helmet>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full space-y-6 container mx-auto p-4 md:p-6 max-w-7xl"
      >
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-muted/50">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Gestão de Justificações</h1>
                    <p className="text-muted-foreground text-sm mt-1">Valide e organize as justificações da equipa.</p>
                </div>
             </div>
        </div>

        {/* Filters Card */}
        <div className="bg-card border p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Filter className="h-4 w-4" /> Filtros
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Pesquisar por colaborador..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background/50"
                />
            </div>
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Estados</SelectItem>
                <SelectItem value="Pendente">Pendentes</SelectItem>
                <SelectItem value="Aprovado">Aprovados</SelectItem>
                <SelectItem value="Rejeitado">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={format(filters.month, 'yyyy-MM')} onValueChange={(v) => handleFilterChange('month', v)}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                {monthOptions.map(m => (
                  <SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                    {format(m, 'MMMM yyyy', { locale: pt })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 min-h-[400px]">
             <JustificationsByUserList 
                justifications={justifications} 
                searchQuery={searchQuery}
                onUpdateStatus={handleUpdateStatus} 
                isLoading={isLoading}
            />
        </div>
      </motion.div>
    </>
  );
};

export default AdminJustificationsPage;