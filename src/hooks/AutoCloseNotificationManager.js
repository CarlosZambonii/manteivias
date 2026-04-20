import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { sendNotification } from '@/services/NotificationService.js';

export const useAutoCloseNotificationManager = (userId) => {
  const lastClosedRecordRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('public:registros_ponto_autoclose')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'registros_ponto',
          filter: `usuario_id=eq.${userId}`
        },
        (payload) => {
          const oldRecord = payload.old;
          const newRecord = payload.new;
          
          if (
            newRecord.status_validacao === 'Cancelado' || 
            (newRecord.hora_fim_real && !oldRecord.hora_fim_real && newRecord.hora_fim_escolhido)
          ) {
            // Simple heuristic to avoid spamming if multiple records close at once
            if (newRecord.id !== lastClosedRecordRef.current) {
               lastClosedRecordRef.current = newRecord.id;
               sendNotification('Registo Fechado Automaticamente', {
                 body: 'Um dos seus registos pendentes foi fechado automaticamente pelo sistema.',
                 tag: 'auto-close'
               });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};