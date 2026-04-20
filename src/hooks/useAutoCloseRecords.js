import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { applyAutoCloseRules } from '@/utils/recordCascadeLogic';
import { convertToRecordFormat } from '@/utils/recordTimeAssignment';

export const useAutoCloseRecords = () => {
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const checkAndAutoClose = useCallback(async (userId, isSessionActive = false) => {
    if (!userId) return { closedCount: 0 };

    setIsClosing(true);
    setError(null);
    let closedCount = 0;
    const skippedRecords = [];

    try {
      const { data: openRecords, error: fetchError } = await supabase
        .from('registros_ponto')
        .select('*')
        .eq('usuario_id', userId)
        .is('hora_fim_real', null);

      if (fetchError) throw fetchError;

      if (!openRecords || openRecords.length === 0) {
        setIsClosing(false);
        return { closedCount: 0 };
      }

      const now = new Date();
      const THRESHOLD_MINUTES = 5;

      const deletions = [];
      const insertions = [];

      for (const record of openRecords) {
        if (isSessionActive) {
            skippedRecords.push(record.id);
            continue;
        }

        const lastActivity = record.updated_at ? new Date(record.updated_at) : new Date(record.hora_inicio_real);
        const diffMinutes = (now - lastActivity) / 1000 / 60;
        
        if (diffMinutes < THRESHOLD_MINUTES) {
            skippedRecords.push(record.id);
            continue;
        }

        // Generate cascaded records based on auto-close rules (no manual close time)
        const cascadeRecords = applyAutoCloseRules(record.hora_inicio_escolhido);
        
        if (cascadeRecords.length > 0) {
            closedCount++;
            
            // Check if the calculated close time is actually in the past
            // If the close time hasn't happened yet, we shouldn't close it!
            const lastRecord = cascadeRecords[cascadeRecords.length - 1];
            const [cH, cM] = lastRecord.horaFimEscolhido.split(':').map(Number);
            const closeTargetTime = new Date(record.hora_inicio_real);
            closeTargetTime.setHours(cH, cM, 0, 0);
            
            if (now < closeTargetTime) {
                // Not time to auto-close yet
                skippedRecords.push(record.id);
                closedCount--;
                continue;
            }

            deletions.push(record.id);

            const finalRecords = convertToRecordFormat(
                cascadeRecords, 
                record, 
                new Date(record.hora_inicio_real),
                record.hora_inicio_real,
                null, // No real close time since it's automatic
                true  // isAutomatic flag
            );
            
            insertions.push(...finalRecords);
            
            console.log(`[AutoClose] Processing record ${record.id}. Generated cascades:`, cascadeRecords);
        }
      }
      
      if (deletions.length > 0) {
          const { error: delError } = await supabase
              .from('registros_ponto')
              .delete()
              .in('id', deletions);
          if (delError) throw delError;
      }

      if (insertions.length > 0) {
          const { error: insError } = await supabase
              .from('registros_ponto')
              .insert(insertions);
          if (insError) throw insError;
      }

    } catch (err) {
      console.error("Auto-close error:", err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Erro no fecho automático",
        description: "Não foi possível processar registos pendentes."
      });
    } finally {
      setIsClosing(false);
    }

    return { isClosing, error, closedCount };
  }, [toast]);

  return {
    checkAndAutoClose,
    isClosing,
    error
  };
};