import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAutoCloseRecords } from '@/hooks/useAutoCloseRecords';
import { useAuth } from '@/contexts/AuthContext';
import { useExtraShiftNotificationScheduler } from '@/hooks/ExtraShiftNotificationScheduler';

const TimeContext = createContext(null);

export const TimeProvider = ({ children }) => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeRecord, setActiveRecord] = useState(null);
  const [isLoadingTime, setIsLoadingTime] = useState(true); 
  const [isSessionActive, setSessionActive] = useState(false); 

  const { toast } = useToast();
  const { user } = useAuth();
  const { checkAndAutoClose } = useAutoCloseRecords();

  // Initialize Extra Shift Scheduler
  useExtraShiftNotificationScheduler(isClockedIn, activeRecord);

  const clockOut = useCallback(() => {
    localStorage.removeItem('manteivias_active_record');
    setActiveRecord(null);
    setIsClockedIn(false);
  }, []);

  const triggerGlobalAutoClose = useCallback(async () => {
    if (user?.id) {
        try {
            const { closedCount } = await checkAndAutoClose(user.id, isSessionActive);
            if (closedCount > 0) {
                 toast({
                    title: "Fecho Automático",
                    description: `${closedCount} registo(s) pendente(s) foram fechados automaticamente.`,
                    variant: "default"
                 });
                 clockOut(); 
            }
        } catch (error) {
            console.error("Global auto-close check failed:", error);
        }
    }
  }, [user, checkAndAutoClose, toast, clockOut, isSessionActive]);

  useEffect(() => {
    let mounted = true;

    const checkOpenRecord = async () => {
      try {
        const storedRecord = localStorage.getItem('manteivias_active_record');
        
        if (storedRecord) {
          const parsedRecord = JSON.parse(storedRecord);
          if (mounted) {
            setActiveRecord(parsedRecord);
            setIsClockedIn(true);
          }
          
          if (navigator.onLine && parsedRecord.recordId) {
              const { data: record, error } = await supabase
                .from('registros_ponto')
                .select('id, hora_inicio_real, hora_fim_real, turno')
                .eq('id', parsedRecord.recordId)
                .maybeSingle(); 

              if (error) {
                  console.error("Error verifying active record:", error);
              }

              if (!record || record.hora_fim_real) {
                if (mounted) clockOut();
                return;
              }
          }
        } else {
             if (navigator.onLine && user?.id) {
                 const { data: serverRecord } = await supabase
                    .from('registros_ponto')
                    .select('id, hora_inicio_real, turno, obra:obras(nome)')
                    .eq('usuario_id', user.id)
                    .is('hora_fim_real', null)
                    .order('hora_inicio_real', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                 
                 if (serverRecord && mounted) {
                     const recoveredRecord = {
                         shift: serverRecord.turno,
                         worksite: serverRecord.obra?.nome || 'Obra Desconhecida',
                         startTime: new Date(serverRecord.hora_inicio_real).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                         recordId: serverRecord.id
                     };
                     localStorage.setItem('manteivias_active_record', JSON.stringify(recoveredRecord));
                     setActiveRecord(recoveredRecord);
                     setIsClockedIn(true);
                 }
             }
        }
        
        if (mounted) triggerGlobalAutoClose();

      } catch (error) {
        console.error("Failed to process active record info", error);
      } finally {
        if (mounted) setIsLoadingTime(false);
      }
    };

    if (user) {
        checkOpenRecord();
    } else {
        setIsLoadingTime(false);
    }

    return () => {
        mounted = false;
    };
  }, [triggerGlobalAutoClose, user, clockOut]);

  const clockIn = (shift, worksite, startTime, recordId) => {
    const newRecord = { shift, worksite, startTime, recordId };
    localStorage.setItem('manteivias_active_record', JSON.stringify(newRecord));
    setActiveRecord(newRecord);
    setIsClockedIn(true);
  };

  const value = {
    isClockedIn,
    activeRecord,
    isLoadingTime,
    clockIn,
    clockOut,
    triggerGlobalAutoClose,
    isSessionActive,
    setSessionActive
  };

  return <TimeContext.Provider value={value}>{children}</TimeContext.Provider>;
};

export const useTime = () => {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
};