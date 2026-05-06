import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { sendNotification } from '@/services/NotificationService.js';

// Standard push times in local device time (HH:MM).
// Add or change entries here to adjust when alerts fire.
const SHIFT_ALERTS = [
  {
    hour: 8, minute: 0,
    tag: 'shift-alert-8am',
    getNotification: (records) => {
      if (records.length === 0)
        return { title: 'Turno da Manhã', body: 'Não registrou entrada no turno da manhã.' };
      return null;
    }
  },
  {
    hour: 12, minute: 0,
    tag: 'shift-alert-12pm',
    getNotification: (records) => {
      const openManha = records.find(r => (r.turno === 'Manhã' || r.turno === 'Manha') && !r.hora_fim_real);
      if (openManha)
        return { title: 'Turno da Manhã', body: 'Registre sua saída da manhã e entrada da tarde.' };
      return null;
    }
  },
  {
    hour: 13, minute: 0,
    tag: 'shift-alert-1pm',
    getNotification: (records) => {
      const closedManha = records.find(r => (r.turno === 'Manhã' || r.turno === 'Manha') && r.hora_fim_real);
      const hasTarde = records.find(r => r.turno === 'Tarde');
      if (closedManha && !hasTarde)
        return { title: 'Turno da Tarde', body: 'Não registrou entrada no turno da tarde.' };
      return null;
    }
  },
  {
    hour: 17, minute: 0,
    tag: 'shift-alert-5pm',
    getNotification: (records) => {
      const openTarde = records.find(r => r.turno === 'Tarde' && !r.hora_fim_real);
      if (openTarde)
        return { title: 'Turno da Tarde', body: 'Registre sua saída da tarde.' };
      return null;
    }
  },
  {
    hour: 17, minute: 0,
    tag: 'shift-alert-extra',
    getNotification: (records) => {
      const hasAnyOpen = records.find(r => !r.hora_fim_real);
      if (hasAnyOpen)
        return { title: 'Turno extra iniciado', body: 'Rodando até 23:30 e será fechado automaticamente.' };
      return null;
    }
  },
  {
    hour: 20, minute: 0,
    tag: 'shift-alert-8pm',
    getNotification: (records) => {
      const hasOpen = records.find(r => !r.hora_fim_real);
      if (hasOpen)
        return { title: 'Registos em Aberto', body: 'Você tem registros abertos que precisam ser fechados.' };
      return null;
    }
  }
];

export const useShiftAlertScheduler = (userId) => {
  // key: "tag-YYYY-MM-DD", value: true — prevents double-firing per alert per day
  const firedTodayRef = useRef({});

  useEffect(() => {
    if (!userId) return;

    const checkAlerts = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = now.toDateString();

      const matchingAlerts = SHIFT_ALERTS.filter(
        a => a.hour === currentHour && a.minute === currentMinute
      );
      if (matchingAlerts.length === 0) return;

      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const { data: records, error } = await supabase
        .from('registros_ponto')
        .select('id, turno, hora_inicio_real, hora_fim_real')
        .eq('usuario_id', userId)
        .gte('hora_inicio_real', startOfDay)
        .lt('hora_inicio_real', endOfDay)
        .neq('status_validacao', 'Cancelado');

      if (error) {
        console.error('[ShiftAlertScheduler] Failed to fetch records:', error);
        return;
      }

      for (const alert of matchingAlerts) {
        const fireKey = `${alert.tag}-${todayStr}`;
        if (firedTodayRef.current[fireKey]) continue;

        const notification = alert.getNotification(records || []);
        if (notification) {
          firedTodayRef.current[fireKey] = true;
          sendNotification(notification.title, { body: notification.body, tag: alert.tag });
        }
      }
    };

    // Check immediately on mount (handles app opening exactly at an alert minute)
    checkAlerts();

    // Align the interval to fire right at the start of each clock minute (:00 seconds).
    // This ensures the comparison hour===currentHour && minute===currentMinute
    // always happens at the precise moment the phone clock ticks to a new minute.
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    let intervalId;
    const timeoutId = setTimeout(() => {
      checkAlerts();
      intervalId = setInterval(checkAlerts, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [userId]);
};
