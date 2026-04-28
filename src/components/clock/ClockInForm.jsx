import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Loader2, ArrowRight } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Combobox } from '@/components/ui/combobox';
import { useTime } from '@/contexts/TimeContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { calculateDistance } from '@/utils/calculateDistance';
import { useLocationPermission } from '@/hooks/useLocationPermission';
import LocationPermissionDialog from '@/components/clock/LocationPermissionDialog';
import { useLanguage } from '@/hooks/useLanguage';
import { formatObraOption } from '@/utils/formatObraDisplay';
import { logAcao } from '@/lib/logService';
import TimeComparisonCard from './TimeComparisonCard';
import { isValidTimeSlot, getShiftZone } from '@/utils/shiftTimeZoneLogic';

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

const ClockInForm = () => {
  const { toast } = useToast();
  const { clockIn, setSessionActive } = useTime();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const { 
    location, 
    requestLocationPermission, 
    checkLocationPermission,
    isLocationEnabled 
  } = useLocationPermission();

  const [step, setStep] = useState(1);
  const [capturedActualTime, setCapturedActualTime] = useState(null);

  const [selectedWorksite, setSelectedWorksite] = useState('');
  const [selectedTime, setSelectedTime] = useState('08:00'); 
  const [worksites, setWorksites] = useState([]);
  const [worksiteData, setWorksiteData] = useState({}); 
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingWorksites, setIsFetchingWorksites] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);

  useEffect(() => {
    setSessionActive(true);
    return () => setSessionActive(false);
  }, [setSessionActive]);

  const fetchWorksites = useCallback(async () => {
    setIsFetchingWorksites(true);
    const { data, error } = await supabase
      .from('obras')
      .select('id, nome, latitude, longitude')
      .eq('status', 'em execução')
      .order('id', { ascending: true }); 
      
    if (error) {
      toast({ variant: "destructive", title: t('common.error'), description: error.message });
    } else {
      setWorksites(data.map(formatObraOption)); 
      const lookup = {};
      data.forEach(w => {
        lookup[w.id.toString()] = w;
      });
      setWorksiteData(lookup);
    }
    setIsFetchingWorksites(false);
  }, [toast, t]);

  useEffect(() => {
    fetchWorksites();
  }, [fetchWorksites]);

  const timeOptions = useMemo(() => {
    return generateTimeOptions(0, 23, 30);
  }, []);

  const currentShiftZone = useMemo(() => {
    if (!selectedTime) return null;
    const [h, m] = selectedTime.split(':').map(Number);
    return getShiftZone(h, m);
  }, [selectedTime]);

  const handleReviewClick = async () => {
    if (!selectedWorksite || !selectedTime) {
      toast({ variant: "destructive", title: t('common.error'), description: t('clock.subtitle') });
      return;
    }
    
    const [h, m] = selectedTime.split(':').map(Number);
    if (!isValidTimeSlot(h, m)) {
      toast({ variant: "destructive", title: "Horário Inválido", description: "O horário selecionado está numa zona não permitida ou não é múltiplo de 30 minutos." });
      return;
    }

    const hasPermission = await checkLocationPermission();
    if (!hasPermission && !isLocationEnabled) {
      setShowLocationDialog(true);
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
  };

  const proceedToReview = () => {
    setCapturedActualTime(new Date());
    setStep(2);
  };

  const handleSubmission = async () => {
    setIsLoading(true);

    try {
      const registroStartTime = capturedActualTime || new Date();
      const turno = currentShiftZone || 'Extra';

      const { data: checkData, error: checkError } = await supabase.functions.invoke('check-existing-record', {
        body: { usuario_id: user.id, obra_id: selectedWorksite, turno: turno }
      });
      
      if (checkError) throw checkError;
      if (checkData?.exists) { 
        toast({ variant: 'destructive', title: t('clock.duplicateTitle'), description: t('clock.duplicateDesc') });
        setIsLoading(false);
        setStep(1);
        return;
      }
      
      let distanceMeters = null;
      let withinRadius = false;
      const selectedWorksiteData = worksiteData[selectedWorksite];
      
      if (location && selectedWorksiteData && selectedWorksiteData.latitude && selectedWorksiteData.longitude) {
        distanceMeters = calculateDistance(
            location.latitude, 
            location.longitude, 
            selectedWorksiteData.latitude, 
            selectedWorksiteData.longitude
        );
        if (distanceMeters !== null) {
            withinRadius = distanceMeters <= 500;
        }
      }

      const initialRecord = {
          usuario_id: user.id,
          obra_id: selectedWorksite,
          turno: turno,
          hora_inicio_escolhido: selectedTime,
          hora_fim_escolhido: null,
          hora_inicio_real: getLocalISOString(registroStartTime),
          hora_fim_real: null,
          lat_inicio: location?.latitude,
          lon_inicio: location?.longitude,
          distancia_metros: distanceMeters,
          dentro_raio_500m: withinRadius,
          status_validacao: 'Pendente'
      };

      console.log("[ClockIn] Creating initial record:", initialRecord);

      const { data: insertedRecords, error: insertError } = await supabase
        .from('registros_ponto')
        .insert([initialRecord])
        .select();

      if (insertError) throw insertError;

      if (!insertedRecords || insertedRecords.length === 0) {
        throw new Error(t('common.error'));
      }

      const mainRecord = insertedRecords[0];
      const worksiteName = worksites.find(w => w.value === selectedWorksite)?.label;

      clockIn(mainRecord.turno, worksiteName, selectedTime, mainRecord.id);
      logAcao(user, {
        acao: 'Criação',
        entidade: 'Registo de Ponto',
        modulo: 'Ponto',
        descricao: `Entrada às ${selectedTime}${worksiteName ? ` — ${worksiteName}` : ''}`,
        obraId: selectedWorksite ? Number(selectedWorksite) : null,
      });
      setSessionActive(false); 
      
      // Removed success toast and SW success message as per request
    } catch (error) {
       console.error("Clock In Error:", error);
       toast({ variant: "destructive", title: t('common.error'), description: error.message });
       setStep(1);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-secondary p-4 sm:p-8 rounded-lg shadow-lg relative overflow-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('clock.title')}</h1>
      <p className="text-muted-foreground mb-6">{t('clock.subtitle')}</p>
      
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="relative">
              <label htmlFor="time" className="text-lg font-semibold text-primary mb-2 block">{t('clock.entryTime')}</label>
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

            {!currentShiftZone && selectedTime && (
                <div className="p-3 bg-red-50 text-red-600 rounded-md border border-red-200 text-sm">
                    Aviso: O horário selecionado encontra-se numa pausa obrigatória ou zona não permitida.
                </div>
            )}
            
            <div className="relative">
              <label htmlFor="obra" className="text-lg font-semibold text-primary mb-2 block">{t('clock.worksite')}</label>
              <div className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
                 <Combobox
                  options={worksites}
                  value={selectedWorksite}
                  onChange={setSelectedWorksite}
                  placeholder={t('clock.selectWorksite')}
                  searchPlaceholder={t('clock.searchWorksite')}
                  emptyPlaceholder={isFetchingWorksites ? t('clock.loadingWorksites') : t('clock.noWorksitesFound')}
                  triggerClassName="h-12 text-base w-full"
                  disabled={isFetchingWorksites}
                />
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700 mt-6" 
              onClick={handleReviewClick} 
              disabled={!selectedWorksite || !selectedTime || !currentShiftZone}
            >
              Revisar Horários <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )}

        {step === 2 && capturedActualTime && (
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
              title="Revisão de Entrada" 
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
                className="w-2/3 h-14 text-lg bg-green-600 hover:bg-green-700" 
                onClick={handleSubmission} 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Clock className="mr-2 h-6 w-6" />}
                Confirmar Horários
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

export default ClockInForm;