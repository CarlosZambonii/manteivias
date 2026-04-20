import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Send, Loader2 } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, isValid, eachDayOfInterval, isBefore, isEqual, startOfDay, parseISO } from "date-fns";
import { pt } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from '@/hooks/useLanguage';

const JustificationForm = ({ isModal = false, initialData = null, onSuccess = null }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

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
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (initialData) {
        setIsEdit(true);
        setSelectedType(initialData.tipo_justificação_id?.toString() || '');
        setComment(initialData.comentario || '');
        if (initialData.dias && initialData.dias.length > 0) {
            setDates(initialData.dias.map(d => parseISO(d)));
            if (initialData.dias.length > 1) {
                setIsMultiSelect(true);
            }
        }
    } else if (location.state?.preselectDate) {
      const preselectedDate = parseISO(location.state.preselectDate);
      if (isValid(preselectedDate)) {
        setDates([preselectedDate]);
      }
    }
  }, [location.state, initialData]);

  // Fetch Justification Types
  useEffect(() => {
    const fetchTypes = async () => {
      if (!user) return;
      setIsFetchingTypes(true);
      const { data, error } = await supabase.from('tipos_justificação').select('id, nome');
      if (error) {
        toast({ variant: 'destructive', title: t('common.error'), description: error.message });
      } else {
        setJustificationTypes(data);
      }
      setIsFetchingTypes(false);
    };
    
    if (!authLoading && user) {
      fetchTypes();
    }
  }, [toast, user, authLoading, t]);

  // Fetch Holidays
  useEffect(() => {
    const fetchHolidays = async () => {
        setIsFetchingHolidays(true);
        try {
            const { data, error } = await supabase.from('feriados').select('*');
            if (error) throw error;
            setHolidays(data || []);
        } catch (error) {
            console.error('Error fetching holidays:', error);
            toast({ 
                variant: 'destructive', 
                title: t('common.error'), 
                description: 'Erro ao carregar feriados' 
            });
        } finally {
            setIsFetchingHolidays(false);
        }
    };

    fetchHolidays();
  }, [toast, t]);
  
  const handleAttachmentChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dates.length === 0 || !selectedType) {
      toast({
        variant: "destructive",
        title: t('justification.mandatoryFields'),
        description: t('justification.mandatoryDesc')
      });
      return;
    }
    
    setIsLoading(true);

    let anexoUrl = null;
    if (attachment) {
      const fileExt = attachment.name.split('.').pop();
      const fileName = `${user.id}-justificacao-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('anexos')
        .upload(filePath, attachment, {
          upsert: true,
        });

      if (uploadError) {
        toast({ variant: 'destructive', title: t('justification.errorUpload'), description: uploadError.message });
        setIsLoading(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from('anexos').getPublicUrl(uploadData.path);
      anexoUrl = urlData.publicUrl;
    }

    if (isEdit) {
        const payload = {
            tipo_justificação_id: selectedType,
            comentario: comment,
            dias: dates.map(d => format(d, 'yyyy-MM-dd')),
            status_validacao: 'Pendente' // Reset status on edit
        };
        if (anexoUrl) payload.anexo_url = anexoUrl;

        const { error: updateError } = await supabase.from('justificação').update(payload).eq('id', initialData.id);
        
        setIsLoading(false);
        if (updateError) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar', description: updateError.message });
            return;
        }

        toast({ variant: 'success', title: 'Sucesso', description: 'Justificação atualizada com sucesso.' });

    } else {
        const justificationsToInsert = dates.map(date => ({
            usuario_id: user.id,
            tipo_justificação_id: selectedType,
            comentario: comment,
            data_envio: new Date().toISOString(),
            anexo_url: anexoUrl,
            dias: [format(date, 'yyyy-MM-dd')],
            status_validacao: 'Pendente',
        }));

        const { error: justifError } = await supabase.from('justificação').insert(justificationsToInsert);
        
        setIsLoading(false);
        if (justifError) {
            toast({ variant: 'destructive', title: t('justification.errorCreate'), description: justifError.message });
            return;
        }

        toast({ variant: 'success', title: t('justification.successTitle'), description: t('justification.successDesc') });
    }

    if (onSuccess) {
        onSuccess();
    } else {
        navigate('/historico');
    }
  };

  const handleSingleDateSelect = (day) => {
      setDates(day ? [day] : []);
  }
  
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
              setDates(prevDates => [...prevDates, sDay]);
          } else {
              const start = isBefore(rangeStart, sDay) ? rangeStart : sDay;
              const end = isBefore(rangeStart, sDay) ? sDay : rangeStart;
              const newDates = eachDayOfInterval({ start, end });
              
              setDates(prevDates => {
                  const dateSet = new Set(prevDates.map(d => d.getTime()));
                  newDates.forEach(d => dateSet.add(d.getTime()));
                  return Array.from(dateSet).map(time => new Date(time));
              });
              setRangeStart(null);
          }
      }
  };

  const displayDate = () => {
    if (!dates || dates.length === 0) return t('justification.chooseDate');
    
    const sortedDates = [...dates].sort((a,b) => a - b);

    if (sortedDates.length === 1) {
      if(isValid(sortedDates[0])) {
          return format(sortedDates[0], "PPP", { locale: pt });
      }
    }
    return `${sortedDates.length} ${t('justification.daysSelected')}`;
  };

  const handleMultiSelectChange = (checked) => {
    setIsMultiSelect(checked);
    setDates([]);
    setRangeStart(null);
  }

  let footer = <p className="p-2 text-muted-foreground text-sm text-center">Por favor, selecione o(s) dia(s).</p>;
  if (isMultiSelect) {
      if (rangeStart) {
          footer = <p className="p-2 text-primary text-sm text-center">Selecione o dia final para criar um intervalo.</p>;
      } else {
          footer = <p className="p-2 text-primary text-sm text-center">Selecione um dia para iniciar ou clique para (des)selecionar.</p>
      }
  }

  // Unified responsive styling variables
  const containerClass = "grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full";
  const labelClass = "text-sm font-semibold text-primary mb-2 block";
  const inputClass = "w-full h-11 bg-background text-sm";
  const textareaClass = "w-full min-h-[120px] text-sm resize-y p-3 bg-background";
  const buttonClass = "w-full h-11 text-sm font-medium";
  const formSpacing = "flex flex-col space-y-5";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center w-full md:border-r md:pr-6 lg:pr-8 border-border/50 pb-6 md:pb-0">
        <div className="flex justify-between w-full items-center mb-4 px-1">
          {!isModal && <h2 className="text-lg font-semibold text-primary">{t('justification.formTitle')}</h2>}
          <div className={`flex items-center space-x-2 ${isModal ? 'ml-auto' : ''}`}>
            <Checkbox id="multi-select" checked={isMultiSelect} onCheckedChange={handleMultiSelectChange} />
            <label htmlFor="multi-select" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
              {t('justification.multiDay')}
            </label>
          </div>
        </div>
        
        {isFetchingHolidays ? (
            <div className="w-full border rounded-xl p-4 min-h-[350px] bg-card/50">
                <div className="flex flex-col space-y-4">
                    <Skeleton className="h-[25px] w-full rounded-md" />
                    <div className="space-y-2">
                        <Skeleton className="h-[250px] w-full rounded-md" />
                    </div>
                    <div className="flex justify-center text-muted-foreground text-sm pt-2">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('justification.loadingCalendar')}
                    </div>
                </div>
            </div>
        ) : (
            <div className="w-full flex justify-center bg-card border rounded-xl p-2 sm:p-4 shadow-sm overflow-hidden">
                <div className="max-w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
                    {isMultiSelect ? (
                    <Calendar
                        mode="multiple"
                        min={0}
                        selected={dates}
                        onDayClick={handleDayClick}
                        className="bg-transparent"
                        locale={pt}
                        footer={footer}
                        holidays={holidays}
                    />
                    ) : (
                    <Calendar
                        mode="single"
                        selected={dates[0]}
                        onSelect={handleSingleDateSelect}
                        className="bg-transparent"
                        locale={pt}
                        holidays={holidays}
                    />
                    )}
                </div>
            </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className={formSpacing}>
        <div>
          <label className={labelClass}>{t('justification.datesLabel')}</label>
          <Input readOnly value={displayDate()} className={`justify-start text-left font-normal cursor-default ${inputClass}`} />
        </div>

        <div>
          <label className={labelClass}>{t('justification.typeLabel')}</label>
          <Select onValueChange={setSelectedType} value={selectedType}>
            <SelectTrigger className={inputClass}>
              <SelectValue placeholder={t('justification.selectType')} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {isFetchingTypes ? (
                <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('justification.loadingTypes')}
                </div>
              ) : justificationTypes.length > 0 ? (
                justificationTypes.map(type => <SelectItem key={type.id} value={type.id.toString()}>
                    {type.nome}
                  </SelectItem>)
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t('justification.noTypes')}
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="file-upload" className={labelClass}>{t('justification.attachmentLabel')}</label>
          <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer bg-card hover:bg-muted/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-6 h-6 mb-2 text-muted-foreground/70" />
              <p className="mb-1 text-sm text-muted-foreground text-center px-4 line-clamp-1">
                  <span className="font-semibold text-foreground/80">{attachment ? attachment.name : (initialData?.anexo_url ? 'Anexo existente (clique para alterar)' : t('justification.clickToUpload'))}</span>
              </p>
              <p className="text-xs text-muted-foreground/60">{t('justification.formats')}</p>
            </div>
            <Input id="file-upload" type="file" className="hidden" onChange={handleAttachmentChange} accept="application/pdf,image/png,image/jpeg"/>
          </label>
        </div>

        <div>
          <label htmlFor="explanation" className={labelClass}>{t('justification.commentLabel')}</label>
          <Textarea id="explanation" placeholder={t('justification.commentPlaceholder')} value={comment} onChange={e => setComment(e.target.value)} className={textareaClass} />
        </div>
        
        <div className="pt-2 mt-auto">
            <Button type="submit" size="lg" className={buttonClass} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
            {isLoading ? (isEdit ? 'A Atualizar...' : t('justification.submitting')) : (isEdit ? 'Atualizar Justificação' : t('justification.submitButton'))}
            </Button>
        </div>
      </form>
    </div>
  );
};

export default JustificationForm;