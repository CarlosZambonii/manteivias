import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isValid, eachDayOfInterval, isBefore, isEqual, startOfDay, parseISO } from "date-fns";
import { pt } from 'date-fns/locale';
import { Upload, Save, Loader2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

const EditJustificationModal = ({ isOpen, onOpenChange, justification, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [dates, setDates] = useState([]);
  const [justificationTypes, setJustificationTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [comment, setComment] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [rangeStart, setRangeStart] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTypes, setIsFetchingTypes] = useState(false);
  const [isFetchingHolidays, setIsFetchingHolidays] = useState(true);

  useEffect(() => {
    if (justification && isOpen) {
      setSelectedType(justification.tipo_justificação_id?.toString() || '');
      setComment(justification.comentario || '');
      setAttachment(null);
      if (justification.dias && justification.dias.length > 0) {
          const parsedDates = justification.dias.map(d => parseISO(d));
          setDates(parsedDates);
          setIsMultiSelect(parsedDates.length > 1);
      } else {
          setDates([]);
          setIsMultiSelect(false);
      }
      setRangeStart(null);
    }
  }, [justification, isOpen]);

  useEffect(() => {
    const fetchTypes = async () => {
      setIsFetchingTypes(true);
      const { data, error } = await supabase.from('tipos_justificação').select('id, nome');
      if (!error && data) setJustificationTypes(data);
      setIsFetchingTypes(false);
    };
    
    const fetchHolidays = async () => {
      setIsFetchingHolidays(true);
      const { data, error } = await supabase.from('feriados').select('*');
      if (!error && data) setHolidays(data);
      setIsFetchingHolidays(false);
    };

    if (isOpen) {
      fetchTypes();
      fetchHolidays();
    }
  }, [isOpen]);

  const handleAttachmentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dates.length === 0 || !selectedType) {
      toast({ variant: "destructive", title: "Campos Obrigatórios", description: "Por favor, preencha as datas e o tipo de justificação." });
      return;
    }
    
    setIsLoading(true);

    try {
        let anexoUrl = justification.anexo_url; // Keep old attachment by default
        
        // Upload new attachment if provided
        if (attachment) {
            const fileExt = attachment.name.split('.').pop();
            const fileName = `${user.id}-justificacao-edit-${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('anexos')
                .upload(fileName, attachment, { upsert: true });

            if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);
            
            const { data: urlData } = supabase.storage.from('anexos').getPublicUrl(uploadData.path);
            anexoUrl = urlData.publicUrl;
        }

        // 1. Mark old justification as 'Cancelado'
        const { error: cancelError } = await supabase
            .from('justificação')
            .update({ status_validacao: 'Cancelado' })
            .eq('id', justification.id);

        if (cancelError) throw new Error(`Erro ao cancelar antiga: ${cancelError.message}`);

        // 2. Insert new corrected justification (single record with array of dates)
        const newJustification = {
            usuario_id: justification.usuario_id || user.id,
            tipo_justificação_id: selectedType,
            comentario: comment,
            data_envio: new Date().toISOString(),
            anexo_url: anexoUrl,
            dias: dates.map(date => format(date, 'yyyy-MM-dd')),
            status_validacao: 'Pendente',
        };

        const { error: insertError } = await supabase
            .from('justificação')
            .insert([newJustification]);

        if (insertError) throw new Error(`Erro ao criar nova: ${insertError.message}`);

        toast({ title: "Sucesso", description: "Justificação atualizada com sucesso!" });
        if (onSuccess) onSuccess();
        onOpenChange(false);
        
    } catch (error) {
        toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleSingleDateSelect = (day) => {
      setDates(day ? [day] : []);
  };
  
  const handleDayClick = (day) => {
      if (!isMultiSelect) return;
      const sDay = startOfDay(day);
      const isSelected = dates.some(d => isEqual(startOfDay(d), sDay));

      if (isSelected) {
          setDates(dates.filter(d => !isEqual(startOfDay(d), sDay)));
          setRangeStart(null);
      } else {
          if (!rangeStart) {
              setRangeStart(sDay);
              setDates(prev => [...prev, sDay]);
          } else {
              const start = isBefore(rangeStart, sDay) ? rangeStart : sDay;
              const end = isBefore(rangeStart, sDay) ? sDay : rangeStart;
              const newDates = eachDayOfInterval({ start, end });
              setDates(prev => {
                  const dateSet = new Set(prev.map(d => d.getTime()));
                  newDates.forEach(d => dateSet.add(d.getTime()));
                  return Array.from(dateSet).map(time => new Date(time));
              });
              setRangeStart(null);
          }
      }
  };

  const displayDate = () => {
    if (!dates || dates.length === 0) return 'Nenhuma data selecionada';
    if (dates.length === 1 && isValid(dates[0])) return format(dates[0], "PPP", { locale: pt });
    return `${dates.length} dias selecionados`;
  };

  let footer = <p className="p-2 text-muted-foreground text-sm text-center">Selecione o(s) dia(s).</p>;
  if (isMultiSelect) {
      footer = rangeStart 
        ? <p className="p-2 text-primary text-sm text-center">Selecione o dia final do intervalo.</p>
        : <p className="p-2 text-primary text-sm text-center">Selecione um dia para iniciar um intervalo.</p>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle>Editar Justificação</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="flex flex-col w-full md:border-r md:pr-6 border-border/50">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold text-foreground">Calendário</h3>
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="edit-multi-select" 
                            checked={isMultiSelect} 
                            onCheckedChange={(c) => { setIsMultiSelect(c); setDates([]); setRangeStart(null); }} 
                        />
                        <label htmlFor="edit-multi-select" className="text-sm cursor-pointer">
                            Vários Dias
                        </label>
                    </div>
                </div>

                {isFetchingHolidays ? (
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                ) : (
                    <div className="flex justify-center bg-card border rounded-xl p-2 shadow-sm overflow-hidden">
                        <div className="max-w-full overflow-x-auto custom-scrollbar">
                            {isMultiSelect ? (
                                <Calendar mode="multiple" min={0} selected={dates} onDayClick={handleDayClick} locale={pt} footer={footer} holidays={holidays} />
                            ) : (
                                <Calendar mode="single" selected={dates[0]} onSelect={handleSingleDateSelect} locale={pt} holidays={holidays} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                <div>
                    <label className="text-sm font-semibold mb-1.5 block">Datas Selecionadas</label>
                    <Input readOnly value={displayDate()} className="bg-muted/50" />
                </div>

                <div>
                    <label className="text-sm font-semibold mb-1.5 block">Tipo de Justificação</label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {justificationTypes.map(type => (
                                <SelectItem key={type.id} value={type.id.toString()}>{type.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="text-sm font-semibold mb-1.5 block">Anexo</label>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-4 pb-4">
                            <Upload className="w-5 h-5 mb-1 text-muted-foreground" />
                            <span className="text-xs text-center px-2 font-medium">
                                {attachment ? attachment.name : (justification?.anexo_url ? 'Substituir anexo existente' : 'Clique para enviar anexo')}
                            </span>
                        </div>
                        <Input type="file" className="hidden" onChange={handleAttachmentChange} accept="application/pdf,image/*"/>
                    </label>
                </div>

                <div>
                    <label className="text-sm font-semibold mb-1.5 block">Comentário</label>
                    <Textarea 
                        value={comment} 
                        onChange={e => setComment(e.target.value)} 
                        placeholder="Motivo da ausência..." 
                        className="min-h-[100px] resize-y"
                    />
                </div>

                <Button type="submit" className="w-full mt-auto" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Alterações
                </Button>
            </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditJustificationModal;