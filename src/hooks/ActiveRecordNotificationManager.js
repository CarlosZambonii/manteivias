import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { sendNotification } from '@/services/NotificationService.js';

export const useActiveRecordNotificationManager = (userId) => {
  const lastNotifiedRecordRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('public:registros_ponto')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'registros_ponto',
          filter: `usuario_id=eq.${userId}`
        },
        (payload) => {
          const record = payload.new;
          if (record.hora_inicio_real && !record.hora_fim_real && record.id !== lastNotifiedRecordRef.current) {
            lastNotifiedRecordRef.current = record.id;
            sendNotification('Registro Ativo', {
              body: 'O seu turno foi iniciado e está a ser contabilizado.',
              tag: 'active-record'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'registros_ponto',
          filter: `usuario_id=eq.${userId}`
        },
        (payload) => {
          const record = payload.new;
          if (record.hora_inicio_real && !record.hora_fim_real && record.id !== lastNotifiedRecordRef.current) {
            lastNotifiedRecordRef.current = record.id;
            sendNotification('Registro Ativo', {
              body: 'O seu turno foi iniciado e está a ser contabilizado.',
              tag: 'active-record'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};