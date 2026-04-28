import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Clock, Loader2, LogOut, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Combobox } from '@/components/ui/combobox';
import { useTime } from '@/contexts/TimeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateDistance } from '@/utils/calculateDistance';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import LocationPermissionDialog from '@/components/clock/LocationPermissionDialog';
import { useLanguage } from '@/hooks/useLanguage';
import { logAcao } from '@/lib/logService';
import TimeComparisonCard from './TimeComparisonCard';
import { isValidTimeSlot, validateManualClose } from '@/utils/shiftTimeZoneLogic';
import { generateCascadingRecords } from '@/utils/recordCascadeLogic';
import { convertToRecordFormat } from '@/utils/recordTimeAssignment';

const getLocalISOString = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const generateTimeOptions = (start, end, step = 30) => {
  const options = [];
  for (let i = start; i <= end; i++) {
    for (let j = 0; j < 60; j += step) {
      if (i === end && j > 0) continue;
      const hour = i.toString().padStart(2, '0');
      const minute = j.toString().padStart(2, '0');
      const time = `${hour}:${minute}`;
      
      const disabled = !isValidTimeSlot(i, j);
      options.push({ value: time, label: time, disabled });
    }
  }
  return options;
};

const ClockOutForm = () => {
  const { toast } = useToast();
  const { clockOut, setSessionActive } = useTime();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const { 
    location, 
    requestLocationPermission, 
    checkLocationPermission,
    isLocationEnabled 
  } = useLocationPermission();
  
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = minutes < 15 ? '00' : minutes < 45 ? '30' : '00';
  let displayHour = minutes >= 45 ? (now.getHours() + 1) : now.getHours();
  if (displayHour === 24) displayHour = 0;
  
  const defaultTime = `${displayHour.toString().padStart(2, '0')}:${roundedMinutes}`;

  const [selectedTime, setSelectedTime] = useState(defaultTime);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  const [step, setStep] = useState(1);
  const [capturedActualTime, setCapturedActualTime] = useState(null);
  const [activeRecord, setActiveRecord] = useState(null);
  const [cascadingPreview, setCascadingPreview] = useState([]);

  useEffect(() => {
    setSessionActive(true);
    return () => setSessionActive(false);
  }, [setSessionActive]);

  const timeOptions = useMemo(() => generateTimeOptions(0, 23, 30), []);

  const handleReviewClick = async () => {
    if (!selectedTime) {
      toast({ variant: "destructive", title: t('common.error'), description: t('clock.exitTime') });
      return;
    }

    setIsLoading(true);
    try {
      let { data: record, error: fetchError } = await supabase
        .from('registros_ponto')
        .select('*')
        .eq('usuario_id', user.id)
        .is('hora_fim_real', null)
        .order('hora_inicio_real', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw new Error("Erro ao buscar registo ativo: " + fetchError.message);
      
      if (!record) {
         toast({ variant: "destructive", title: t('common.error'), description: t('clock.activeRecordError') });
         clockOut(); 
         setIsLoading(false);
         return;
      }
      
      setActiveRecord(record);

      const validation = validateManualClose(record.hora_inicio_escolhido, selectedTime);
      if (!validation.valid) {
          toast({ variant: "destructive", title: "Horário Inválido", description: validation.error });
          setIsLoading(false);
          return;
      }

      const generated = generateCascadingRecords(record.hora_inicio_escolhido, selectedTime);
      if (generated.length === 0) {
          toast({ variant: "destructive", title: "Erro na Separação", description: "Não foi possível gerar intervalos válidos." });
          setIsLoading(false);
          return;
      }
      
      setCascadingPreview(generated);

      const hasPermission = await checkLocationPermission();
      if (!hasPermission && !isLocationEnabled) {
        setShowLocationDialog(true);
        setIsLoading(false);
        return;
      }
      
      if (!location) {
         try {
           await requestLocationPermission();
           proceedToReview();
         } catch (e) {
           setShowLocationDialog(true);
         }
      } else {
         proceedToReview();
      }
    } catch (err) {
      toast({ variant: "destructive", title: t('common.error'), description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToReview = async () => {
    setCapturedActualTime(new Date());
    setStep(2);
  };

  const handleSubmission = async () => {
    if (!activeRecord || !capturedActualTime || cascadingPreview.length === 0) return;
    setIsLoading(true);

    try {
      let distanceMeters = null;
      let withinRadius = false;

      if (location && activeRecord.obra_id) {
          const { data: obraData } = await supabase
              .from('obras')
              .select('latitude, longitude')
              .eq('id', activeRecord.obra_id)
              .maybeSingle();
              
          if (obraData && obraData.latitude && obraData.longitude) {
               distanceMeters = calculateDistance(
                   location.latitude,
                   location.longitude,
                   obraData.latitude,
                   obraData.longitude
               );
               if (distanceMeters !== null) {
                   withinRadius = distanceMeters <= 500;
               }
          }
      }

      const completeBaseRecord = {
          ...activeRecord,
          lat_fim: location?.latitude,
          lon_fim: location?.longitude,
          distancia_metros: distanceMeters,
          dentro_raio_500m: withinRadius
      };

      const recordsToInsert = convertToRecordFormat(
          cascadingPreview,
          completeBaseRecord,
          new Date(activeRecord.hora_inicio_real),
          activeRecord.hora_inicio_real,
          getLocalISOString(capturedActualTime),
          false 
      );

      const { error: deleteError } = await supabase
        .from('registros_ponto')
        .delete()
        .eq('id', activeRecord.id);
        
      if (deleteError) throw new Error("Error deleting active record: " + deleteError.message);

      const { error: insertError } = await supabase
        .from('registros_ponto')
        .insert(recordsToInsert);

      if (insertError) throw new Error("Error inserting cascade records: " + insertError.message);

      clockOut();
      logAcao(user, {
        acao: 'Edição',
        entidade: 'Registo de Ponto',
        modulo: 'Ponto',
        descricao: 'Saída registada',
        obraId: activeRecord?.obra_id ? Number(activeRecord.obra_id) : null,
      });
      setSessionActive(false);
      
      // Removed success toast and SW success message as per request
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-secondary p-4 sm:p-8 rounded-lg shadow-lg relative overflow-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('clock.stop')}</h1>
      <p className="text-muted-foreground mb-6">{t('clock.subtitle')}</p>
      
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="relative">
              <label htmlFor="time" className="text-lg font-semibold text-primary mb-2 block">{t('clock.exitTime')}</label>
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                <Combobox
                  options={timeOptions}
                  value={selectedTime}
                  onChange={setSelectedTime}
                  placeholder={t('clock.selectTime')}
                  searchPlaceholder={t('clock.searchTime')}
                  emptyPlaceholder={t('clock.noTimeFound')}
                  triggerClassName="h-12 text-base w-full"
                />
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 mt-6" 
              onClick={handleReviewClick} 
              disabled={isLoading || !selectedTime}
            >
              {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <>Revisar Saída <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>
          </motion.div>
        )}

        {step === 2 && capturedActualTime && cascadingPreview.length > 0 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <TimeComparisonCard 
              actualDate={capturedActualTime} 
              selectedTimeStr={selectedTime} 
              title="Revisão de Saída" 
            />

            <div className="flex gap-4 mt-6">
              <Button 
                variant="outline"
                size="lg" 
                className="w-1/3 h-14 text-lg" 
                onClick={() => setStep(1)}
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button 
                size="lg" 
                className="w-2/3 h-14 text-lg bg-red-600 hover:bg-red-700" 
                onClick={handleSubmission} 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <LogOut className="mr-2 h-6 w-6" />}
                Confirmar Saída
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LocationPermissionDialog 
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onRequestPermission={requestLocationPermission}
      />
    </div>
  );
};

export default ClockOutForm;