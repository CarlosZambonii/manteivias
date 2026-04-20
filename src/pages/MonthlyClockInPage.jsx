import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ChevronLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Combobox } from '@/components/ui/combobox';
import { formatObraOption } from '@/utils/formatObraDisplay';

const MonthlyClockInPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [worksites, setWorksites] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'));
  const [worksiteAllocations, setWorksiteAllocations] = useState([{ worksiteId: '', percentage: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingWorksites, setIsFetchingWorksites] = useState(true);

  const fetchWorksites = useCallback(async () => {
    setIsFetchingWorksites(true);
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('id, nome')
        .in('status', ['em execução', 'inativa'])
        .order('id', { ascending: true });
      if (error) throw error;
      setWorksites(data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar obras.', description: error.message });
    } finally {
      setIsFetchingWorksites(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWorksites();
  }, [fetchWorksites]);

  const handleAllocationChange = (index, field, value) => {
    const newAllocations = [...worksiteAllocations];
    newAllocations[index][field] = value;
    setWorksiteAllocations(newAllocations);
  };
  
  const handleAddWorksite = () => {
    if(worksiteAllocations.length < worksites.length) {
      setWorksiteAllocations([...worksiteAllocations, { worksiteId: '', percentage: '' }]);
    }
  };
  
  const handleRemoveWorksite = (index) => {
    const newAllocations = worksiteAllocations.filter((_, i) => i !== index);
    setWorksiteAllocations(newAllocations);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const filledAllocations = worksiteAllocations.filter(
      alloc => alloc.worksiteId && alloc.percentage
    );

    if (filledAllocations.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhuma obra selecionada', description: 'Por favor, adicione pelo menos uma obra e a sua percentagem.' });
      setIsLoading(false);
      return;
    }

    const totalPercentage = filledAllocations.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
    if (totalPercentage !== 100) {
      toast({ variant: 'destructive', title: 'Percentagem inválida', description: 'A soma das percentagens das obras deve ser exatamente 100%.' });
      setIsLoading(false);
      return;
    }

    if (!selectedMonth) {
      toast({ variant: 'destructive', title: 'Mês em falta', description: 'Por favor, selecione o mês de referência.' });
      setIsLoading(false);
      return;
    }
    
    const monthDate = startOfMonth(new Date(`${selectedMonth}-15`));
    
    try {
        const { data: existingRecord, error: checkError } = await supabase
            .from('registros_mensais')
            .select('id')
            .eq('usuario_id', user.id)
            .eq('mes', monthDate.toISOString().slice(0, 10))
            .neq('status_validacao', 'Cancelado')
            .limit(1);

        if (checkError) throw checkError;

        if (existingRecord && existingRecord.length > 0) {
            toast({ variant: 'destructive', title: 'Registo Duplicado', description: 'Já existe um registo mensal ativo para este mês.' });
            setIsLoading(false);
            return;
        }

        const recordsToInsert = filledAllocations.map(alloc => ({
            usuario_id: user.id,
            mes: monthDate.toISOString(),
            obra_id: Number(alloc.worksiteId),
            percentagem: Number(alloc.percentage),
            status_validacao: 'Pendente', 
            data_submissao: new Date().toISOString(),
        }));

        const { error } = await supabase
            .from('registros_mensais')
            .insert(recordsToInsert);

        if (error) throw error;

        toast({ variant: 'success', title: 'Sucesso!', description: 'O seu registo mensal foi submetido e aguarda aprovação.' });
        navigate('/');
    } catch(error) {
        toast({ variant: 'destructive', title: 'Erro ao submeter registo', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const monthOptions = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
  const totalPercentage = worksiteAllocations.reduce((sum, alloc) => sum + (Number(alloc.percentage) || 0), 0);

  const worksiteOptions = worksites.map(formatObraOption);

  return (
    <>
      <Helmet>
        <title>Registo Mensal</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto p-4"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Registo de Ponto Mensal</CardTitle>
            <CardDescription>Distribua o seu tempo de trabalho mensal pelas obras. O registo ficará pendente até aprovação.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="month">Mês de Referência</Label>
                 <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(m => (
                      <SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                        {format(m, 'MMMM yyyy', { locale: pt })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Distribuição por Obra</Label>
                <div className="space-y-4 mt-2">
                  {worksiteAllocations.map((alloc, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-end gap-4 p-4 border rounded-lg bg-background/50"
                    >
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`worksite-${index}`} className="text-xs">Obra</Label>
                        <Combobox
                          options={worksiteOptions}
                          value={alloc.worksiteId}
                          onChange={val => handleAllocationChange(index, 'worksiteId', val)}
                          placeholder={isFetchingWorksites ? "A carregar..." : "Selecione a obra"}
                          searchPlaceholder="Pesquisar obra..."
                          emptyPlaceholder="Nenhuma obra encontrada."
                          triggerClassName="h-10"
                        />
                      </div>
                      <div className="w-28 space-y-2">
                        <Label htmlFor={`percentage-${index}`} className="text-xs">Percentagem (%)</Label>
                        <Input id={`percentage-${index}`} type="number" placeholder="%" value={alloc.percentage} onChange={e => handleAllocationChange(index, 'percentage', e.target.value)} />
                      </div>
                      <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveWorksite(index)} disabled={worksiteAllocations.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Button type="button" variant="outline" size="sm" onClick={handleAddWorksite} disabled={worksiteAllocations.length >= worksites.length}>
                    <Plus className="h-4 w-4 mr-2" /> Adicionar Obra
                  </Button>
                  <div className={`text-sm font-semibold ${totalPercentage !== 100 ? 'text-destructive' : 'text-green-500'}`}>
                    Total: {totalPercentage}%
                  </div>
                </div>
                 {worksites.length === 0 && !isFetchingWorksites && (
                  <div className="mt-4 flex items-center text-destructive text-sm p-3 rounded-md border border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Não existem obras ativas para selecionar.
                  </div>
                )}
              </div>

            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading || worksites.length === 0}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'A Submeter...' : 'Submeter Registo'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </>
  );
};

export default MonthlyClockInPage;