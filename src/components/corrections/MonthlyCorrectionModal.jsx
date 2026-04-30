import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { sendSubmissionNotification } from '@/services/NotificationService';
import { pt } from 'date-fns/locale';
import { Combobox } from '@/components/ui/combobox';
import { motion } from 'framer-motion';
import { formatObraOption } from '@/utils/formatObraDisplay';

const MonthlyCorrectionModal = ({ isOpen, onOpenChange, record, onCorrectionSubmitted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [worksites, setWorksites] = useState([]);
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
        .order('id', { ascending: true }); // Standardized sorting
      if (error) throw error;
      setWorksites(data || []);
    } catch (error) {
      console.error('Error fetching worksites:', error);
      toast({ variant: 'destructive', title: 'Erro ao carregar obras.', description: error.message });
    } finally {
      setIsFetchingWorksites(false);
    }
  }, [toast]);

  const resetState = useCallback(() => {
    setWorksiteAllocations([{ worksiteId: '', percentage: '' }]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchWorksites();
      resetState();
    }
  }, [isOpen, fetchWorksites, resetState]);

  const handleAllocationChange = (index, field, value) => {
    const newAllocations = [...worksiteAllocations];
    newAllocations[index][field] = value;
    setWorksiteAllocations(newAllocations);
  };

  const handleAddWorksite = () => {
    if (worksiteAllocations.length < worksites.length) {
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

    // 1. Validate Input
    const filledAllocations = worksiteAllocations.filter(alloc => alloc.worksiteId && alloc.percentage);

    if (filledAllocations.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhuma obra selecionada', description: 'Adicione pelo menos uma obra e a sua percentagem.' });
      setIsLoading(false);
      return;
    }

    const totalPercentage = filledAllocations.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
    if (totalPercentage !== 100) {
      toast({ variant: 'destructive', title: 'Percentagem inválida', description: 'A soma das percentagens deve ser exatamente 100%.' });
      setIsLoading(false);
      return;
    }

    try {
      // 2. Prepare Payload
      const correctionPayload = {
        usuario_id: user.id,
        mes: record.mes,
        data_solicitacao: new Date().toISOString(),
        status: 'Pendente',
      };

      // 3. Insert Correction Header
      const { data: correctionData, error: correctionError } = await supabase
        .from('correcoes_mensais')
        .insert(correctionPayload)
        .select()
        .single();

      if (correctionError) throw correctionError;

      // 4. Insert Allocations
      const allocationRecords = filledAllocations.map(alloc => ({
        correcao_mensal_id: correctionData.id,
        obra_id: Number(alloc.worksiteId),
        percentagem: Number(alloc.percentage),
      }));

      const { error: allocationError } = await supabase
        .from('correcoes_mensais_alocacoes')
        .insert(allocationRecords);

      if (allocationError) {
        console.error('❌ [MonthlyCorrection] Allocation Insert Error:', allocationError);
        // Cleanup header if allocations fail
        await supabase.from('correcoes_mensais').delete().eq('id', correctionData.id);
        throw allocationError;
      }
      
      // 5. Success Feedback
      sendSubmissionNotification(user.id, 'correcao_mensal');
      toast({
        variant: 'success',
        title: 'Pedido enviado',
        description: 'A sua correção mensal foi submetida e aguarda aprovação do encarregado.'
      });

      if (onCorrectionSubmitted) {
        onCorrectionSubmitted({ ...correctionData, allocations: allocationRecords });
      }
      onOpenChange(false);

    } catch (error) {
      console.error('❌ [MonthlyCorrection] Submission Process Failed:', error);
      let errorMessage = error.message || 'Ocorreu um erro ao processar o pedido.';
      
      if (error.code === '23505') {
        errorMessage = 'Já existe uma correção registada para este mês.';
      }
      
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao enviar correção', 
        description: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const monthFormatted = record?.mes ? format(parseISO(record.mes), 'MMMM yyyy', { locale: pt }) : '';
  const totalPercentage = worksiteAllocations.reduce((sum, alloc) => sum + (Number(alloc.percentage) || 0), 0);
  const worksiteOptions = worksites.map(formatObraOption); // Standardized display

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Corrigir Registo Mensal</DialogTitle>
          <DialogDescription>
            Solicitar correção para o mês de <span className="font-semibold capitalize">{monthFormatted}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
            <Label>Nova Distribuição por Obra</Label>
            <div className="space-y-4">
              {worksiteAllocations.map((alloc, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row items-start sm:items-end gap-2 sm:gap-4 p-4 border rounded-lg bg-background/50"
                >
                  <div className="flex-1 w-full space-y-2">
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
                  <div className="w-full sm:w-28 space-y-2">
                    <Label htmlFor={`percentage-${index}`} className="text-xs">Percentagem (%)</Label>
                    <Input id={`percentage-${index}`} type="number" placeholder="%" value={alloc.percentage} onChange={e => handleAllocationChange(index, 'percentage', e.target.value)} />
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveWorksite(index)} disabled={worksiteAllocations.length === 1} className="w-full mt-2 sm:w-10 sm:mt-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
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
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={isLoading || isFetchingWorksites}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submeter Correção
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyCorrectionModal;