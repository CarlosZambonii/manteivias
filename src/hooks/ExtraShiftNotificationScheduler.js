import { useEffect, useRef } from 'react';
import { sendNotification } from '@/services/NotificationService.js';

export const useExtraShiftNotificationScheduler = (isClockedIn, activeRecord) => {
  const hasNotifiedTodayRef = useRef(false);

  useEffect(() => {
    const checkTime = () => {
      if (!isClockedIn || !activeRecord) return;

      const now = new Date();
      const hours = now.getHours();
      const todayStr = now.toDateString();

      // Reset for the next day
      if (hasNotifiedTodayRef.current && hasNotifiedTodayRef.current !== todayStr) {
        hasNotifiedTodayRef.current = false;
      }

      // If current time >= 17h, fire notification immediately (if not already fired today)
      // If current time < 17h, this will do nothing until the interval hits 17:00
      if (hours >= 17) {
        if (hasNotifiedTodayRef.current !== todayStr) {
           hasNotifiedTodayRef.current = todayStr;
           sendNotification('Turno extra iniciado', {
             body: 'Rodando até 23:30 e será fechado automaticamente.',
             tag: 'extra-shift'
           });
        }
      }
    };

    // Initial check when the record is created or component mounts
    checkTime();

    // Align to the start of each clock minute so the 17:00 check never misses
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    let intervalId;
    const timeoutId = setTimeout(() => {
      checkTime();
      intervalId = setInterval(checkTime, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isClockedIn, activeRecord]);
};