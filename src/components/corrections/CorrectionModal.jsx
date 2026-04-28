import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logAcao } from '@/lib/logService';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Briefcase, Clock, FileText, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import TimePicker from '@/components/TimePicker';
import { formatObraDisplay } from '@/utils/formatObraDisplay';

const CorrectionModal = ({ isOpen, onOpenChange, item, onCorrectionSubmitted }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    data_correcao: '',
    hora_inicio_sugerida: '',
    hora_fim_sugerida: '',
    obra_id: '',
    turno: '',
    justificacao: ''
  });
  const [worksites, setWorksites] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchWorksites() {
      const { data, error } = await supabase.from('obras')
        .select('id, nome')
        .order('id', { ascending: true });
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
      const date = item.date instanceof Date ? item.date : item.date ? parseISO(item.date) : new Date();
      setFormData({
        data_correcao: format(date, 'yyyy-MM-dd'),
        hora_inicio_sugerida: item.hora_inicio_escolhido ? item.hora_inicio_escolhido.substring(0, 5) : '',
        hora_fim_sugerida: item.hora_fim_escolhido ? item.hora_fim_escolhido.substring(0, 5) : '',
        obra_id: item.obra_id || item.obra?.id || '',
        turno: item.turno || '',
        justificacao: ''
      });
    }
  }, [item, isOpen]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    let newFormData = { ...formData, [id]: value };

    if (id === 'turno') {
      switch (value) {
        case 'Dia Inteiro':
          newFormData.hora_inicio_sugerida = '08:00';
          newFormData.hora_fim_sugerida = '17:00';
          break;
        case 'Manhã':
          newFormData.hora_inicio_sugerida = '08:00';
          newFormData.hora_fim_sugerida = '12:00';
          break;
        case 'Tarde':
          newFormData.hora_inicio_sugerida = '13:00';
          newFormData.hora_fim_sugerida = '17:00';
          break;
        default:
          break;
      }
    }
    setFormData(newFormData);
  };
  
  const handleTimeChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.data_correcao) {
      toast({ variant: 'destructive', title: 'Data Inválida', description: 'Por favor, selecione uma data.' });
      return;
    }

    if (formData.hora_fim_sugerida && formData.hora_inicio_sugerida > formData.hora_fim_sugerida) {
      toast({ variant: 'destructive', title: 'Horário Inválido', description: 'A hora de saída não pode ser anterior à hora de entrada.' });
      return;
    }
    
    if (!formData.obra_id || !formData.turno || !formData.hora_inicio_sugerida) {
       toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Por favor, preencha a obra, o turno e a hora de entrada.' });
      return;
    }

    setIsSaving(true);
    
    try {
      const { data: existingCorrection, error: checkError } = await supabase
        .from('correcoes_ponto')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('data_correcao', formData.data_correcao)
        .eq('status', 'Pendente')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingCorrection) {
        toast({ variant: 'destructive', title: 'Pedido já existe', description: 'Já existe um pedido de correção pendente para este dia.' });
        setIsSaving(false);
        return;
      }

      const correctionData = {
        usuario_id: user.id,
        registro_ponto_id: item?.type === 'Correção' ? item.id : null,
        data_correcao: formData.data_correcao,
        hora_inicio_sugerida: formData.hora_inicio_sugerida || null,
        hora_fim_sugerida: formData.hora_fim_sugerida || null,
        obra_id: formData.obra_id || null,
        turno: formData.turno || null,
        tipo: item?.type === 'Falta' || item?.isNew ? 'FALTA' : 'CORRECAO',
        status: 'Pendente',
        data_solicitacao: new Date().toISOString(),
        justificacao: formData.justificacao,
      };

      const { error } = await supabase.from('correcoes_ponto').insert(correctionData);
      if (error) throw error;
      logAcao(user, {
        acao: 'Correção',
        entidade: 'Registo de Ponto',
        modulo: 'Correções',
        descricao: 'Pedido de correção submetido',
        obraId: correctionData.obra_id ? Number(correctionData.obra_id) : null,
      });
      toast({ variant: 'success', title: 'Sucesso', description: 'O seu pedido de correção foi enviado para validação.' });
      onCorrectionSubmitted();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível enviar o pedido de correção. ${error.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  if (!item) return null;
  
  const date = formData.data_correcao ? parseISO(formData.data_correcao) : null;
  const dialogTitle = item?.isNew ? 'Novo Registo Manual' : (date ? `Corrigir Registo - ${format(date, 'dd/MM/yyyy')}` : 'Corrigir Registo');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg rounded-xl max-h-[90vh] flex flex-col p-0 gap-0 bg-background overflow-hidden">
        
        {/* Header */}
        <DialogHeader className="px-4 py-4 md:px-6 md:py-5 border-b shrink-0 bg-muted/10">
          <DialogTitle className="text-lg md:text-xl text-primary">{dialogTitle}</DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 p-4 md:p-6 space-y-6 md:space-y-8">
          
          {/* Group 1: Work Details */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary pb-1 border-b">
              <Briefcase className="w-4 h-4" />
              <h4 className="text-sm font-semibold tracking-wide uppercase">Detalhes do Trabalho</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="data_correcao" className="text-xs md:text-sm font-medium">Data</Label>
                <div className="relative">
                  <Input 
                    id="data_correcao"
                    type="date"
                    value={formData.data_correcao}
                    onChange={handleInputChange}
                    className="w-full h-10 md:h-11 block pl-10"
                    disabled={!item?.isNew} 
                  />
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="obra_id" className="text-xs md:text-sm font-medium">Obra</Label>
                <Select onValueChange={(value) => handleSelectChange('obra_id', value)} value={String(formData.obra_id) || ''}>
                  <SelectTrigger className="w-full h-10 md:h-11">
                    <SelectValue placeholder="Selecione a obra" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {worksites.map(w => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {formatObraDisplay(w.id, w.nome)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="turno" className="text-xs md:text-sm font-medium">Turno</Label>
                <Select onValueChange={(value) => handleSelectChange('turno', value)} value={formData.turno || ''}>
                  <SelectTrigger className="w-full h-10 md:h-11">
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhã">Manhã (08:00 - 12:00)</SelectItem>
                    <SelectItem value="Tarde">Tarde (13:00 - 17:00)</SelectItem>
                    <SelectItem value="Dia Inteiro">Dia Inteiro (08:00 - 17:00)</SelectItem>
                    <SelectItem value="Extra">Extra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Group 2: Time Details */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary pb-1 border-b">
              <Clock className="w-4 h-4" />
              <h4 className="text-sm font-semibold tracking-wide uppercase">Horário Sugerido</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="hora_inicio_sugerida" className="text-xs md:text-sm font-medium">Hora Início</Label>
                <TimePicker
                    value={formData.hora_inicio_sugerida}
                    onChange={(value) => handleTimeChange('hora_inicio_sugerida', value)}
                    className="w-full h-10 md:h-11"
                />
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="hora_fim_sugerida" className="text-xs md:text-sm font-medium">Hora Fim</Label>
                 <TimePicker
                    value={formData.hora_fim_sugerida}
                    onChange={(value) => handleTimeChange('hora_fim_sugerida', value)}
                    className="w-full h-10 md:h-11"
                />
              </div>
            </div>
          </section>

          {/* Group 3: Additional Info */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary pb-1 border-b">
              <FileText className="w-4 h-4" />
              <h4 className="text-sm font-semibold tracking-wide uppercase">Informação Adicional</h4>
            </div>
            
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="justificacao" className="text-xs md:text-sm font-medium">Justificação (Opcional)</Label>
              <Textarea 
                id="justificacao" 
                value={formData.justificacao} 
                onChange={handleInputChange} 
                className="min-h-[80px] w-full resize-none text-sm md:text-base" 
                placeholder="Indique o motivo da correção, se necessário."
              />
            </div>
          </section>

        </div>

        {/* Footer */}
        <DialogFooter className="px-4 py-4 md:px-6 md:py-4 border-t bg-muted/20 shrink-0 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-10 md:h-11">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="w-full sm:w-auto h-10 md:h-11">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Pedido
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default CorrectionModal;