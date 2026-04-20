import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TimePicker from '@/components/TimePicker';
import { Combobox } from '@/components/ui/combobox';
import { formatObraOption } from '@/utils/formatObraDisplay';

const AdjustmentModal = ({ isOpen, setIsOpen, item, onSave }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    data_correcao: format(new Date(), 'yyyy-MM-dd'),
    hora_inicio_sugerida: '',
    hora_fim_sugerida: '',
    obra_id: '',
    turno: '',
  });
  const [worksites, setWorksites] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchWorksites() {
      const { data, error } = await supabase.from('obras')
        .select('id, nome')
        .order('id', { ascending: true }); // Standardized sorting
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as obras.' });
      } else {
        setWorksites(data);
      }
    }
    fetchWorksites();
  }, [toast]);

  useEffect(() => {
    if (item && isOpen) {
        const defaultData = {
            data_correcao: item.date || format(new Date(), 'yyyy-MM-dd'),
            hora_inicio_sugerida: item.start_time ? item.start_time.substring(0, 5) : '',
            hora_fim_sugerida: item.end_time ? item.end_time.substring(0, 5) : '',
            obra_id: item.worksite_id || '',
            turno: item.shift || '',
        };
        setFormData(defaultData);
    }
  }, [item, isOpen]);

  const handleTimeChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (formData.hora_fim_sugerida && formData.hora_inicio_sugerida > formData.hora_fim_sugerida) {
      toast({
        variant: 'destructive',
        title: 'Erro de Validação',
        description: 'A hora de saída não pode ser anterior à hora de entrada.',
      });
      return;
    }
    
    if (!formData.obra_id || !formData.turno || !formData.hora_inicio_sugerida) {
       toast({
        variant: 'destructive',
        title: 'Campos Obrigatórios',
        description: 'Por favor, preencha a hora de entrada, obra e turno.',
      });
      return;
    }

    setIsSaving(true);

    try {
        if (item?.type === 'record' && item.id) {
            const { data: existingCorrection, error: checkError } = await supabase
                .from('correcoes_ponto')
                .select('id')
                .eq('registro_ponto_id', item.id)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existingCorrection) {
                toast({
                    variant: 'destructive',
                    title: 'Correção Duplicada',
                    description: 'Este registo já foi corrigido uma vez. Não é possível submeter uma nova correção.',
                });
                setIsSaving(false);
                return;
            }
        }

        const correctionData = {
            usuario_id: user.id,
            registro_ponto_id: item?.type === 'record' ? item.id : null,
            data_correcao: formData.data_correcao,
            hora_inicio_sugerida: formData.hora_inicio_sugerida || null,
            hora_fim_sugerida: formData.hora_fim_sugerida || null,
            obra_id: formData.obra_id || null,
            turno: formData.turno || null,
            tipo: item?.type === 'absence' ? 'NOVO' : 'EDICAO',
            status: 'Pendente',
            data_solicitacao: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from('correcoes_ponto').insert(correctionData);
        if (insertError) throw insertError;

        if (item?.type === 'record' && item.id) {
            const { error: updateError } = await supabase
              .from('registros_ponto')
              .update({ status_validacao: 'Anulado por Correção' })
              .eq('id', item.id);
            if (updateError) {
              console.error('Failed to update original record status:', updateError);
            }
        }

        toast({ 
            variant: 'success', 
            title: 'Sucesso!', 
            description: 'O seu pedido de correção foi enviado para validação.' 
        });
        onSave();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível enviar o pedido de correção. ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };
  
    const worksiteOptions = useMemo(() =>
        worksites.map(formatObraOption), [worksites]); // Standardized display

  if (!item) return null;
  
  const getDialogTitle = () => {
    if (item.type === 'absence') return `Corrigir Falta`;
    return 'Editar Registo de Ponto';
  }
  
  const getDialogDescription = () => {
    if (item.type === 'new') return 'Preencha os dados para um novo registo de ponto.';
    return `Registo para o dia ${format(parseISO(item.date), 'dd/MM/yyyy')}.`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[95vw] max-w-[425px] p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{getDialogTitle()}</DialogTitle>
          <DialogDescription className="text-sm">{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="hora_inicio_sugerida" className="text-left sm:text-right">Entrada</Label>
            <div className="col-span-1 sm:col-span-3">
              <TimePicker
                value={formData.hora_inicio_sugerida}
                onChange={(value) => handleTimeChange('hora_inicio_sugerida', value)}
                interval={15}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="hora_fim_sugerida" className="text-left sm:text-right">Saída</Label>
            <div className="col-span-1 sm:col-span-3">
              <TimePicker
                value={formData.hora_fim_sugerida}
                onChange={(value) => handleTimeChange('hora_fim_sugerida', value)}
                interval={15}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="obra_id" className="text-left sm:text-right">Obra</Label>
            <div className="col-span-1 sm:col-span-3">
              <Combobox
                  options={worksiteOptions}
                  value={String(formData.obra_id) || ''}
                  onChange={(value) => handleSelectChange('obra_id', value)}
                  placeholder="Selecione a obra..."
                  searchPlaceholder="Pesquisar..."
                  emptyPlaceholder="Nenhuma obra."
                  triggerClassName="w-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-2 sm:gap-4">
            <Label htmlFor="turno" className="text-left sm:text-right">Turno</Label>
            <div className="col-span-1 sm:col-span-3">
                <Select onValueChange={(value) => handleSelectChange('turno', value)} value={formData.turno || ''}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o turno" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Manha">Manhã</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="FullTime">FullTime</SelectItem>
                    <SelectItem value="Extra">Extra</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleSubmit} disabled={isSaving} className="w-full sm:w-auto min-h-[44px]">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustmentModal;