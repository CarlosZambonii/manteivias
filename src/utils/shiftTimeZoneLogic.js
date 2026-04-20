import { parse, format, setHours, setMinutes, setSeconds } from 'date-fns';

/**
 * Validates if the time is within forbidden zones.
 * Forbidden: 12:00 to 12:59, and 23:30+
 */
export const isTimeInForbiddenZone = (hour, minute) => {
  const timeInMinutes = hour * 60 + minute;
  // 12:01 to 12:59 is forbidden (12:00 is allowed as end of Manhã, but typically not start. We block > 12:00 and < 13:00)
  if (timeInMinutes > 12 * 60 && timeInMinutes < 13 * 60) return true;
  // 23:30+ is forbidden
  if (timeInMinutes > 23 * 60 + 30) return true;
  return false;
};

/**
 * Returns the shift zone for a given hour and minute.
 * @returns {'Extra' | 'Manhã' | 'Tarde' | null}
 */
export const getShiftZone = (hour, minute = 0) => {
  const t = hour * 60 + minute;
  if (t < 8 * 60) return 'Extra';
  if (t >= 8 * 60 && t <= 12 * 60) return 'Manhã';
  if (t >= 13 * 60 && t <= 17 * 60) return 'Tarde';
  if (t >= 17 * 60 && t <= 23 * 60 + 30) return 'Extra';
  return null;
};

/**
 * Validates if a chosen time slot is valid (30-min increments and not forbidden).
 */
export const isValidTimeSlot = (hour, minute) => {
  if (minute % 30 !== 0) return false;
  if (isTimeInForbiddenZone(hour, minute)) return false;
  return true;
};

/**
 * Returns the default auto-close time (in HH:mm format) for a given shift zone.
 */
export const getAutoCloseTime = (shiftZone, openHour) => {
  if (shiftZone === 'Manhã') return '12:00';
  if (shiftZone === 'Tarde') return '17:00';
  if (shiftZone === 'Extra') {
    if (openHour < 8) return '08:00';
    return '23:30';
  }
  return null;
};

/**
 * Validates manual closing logic, preventing negative duration and zero duration.
 */
export const validateManualClose = (openTimeStr, closeTimeStr) => {
  if (!openTimeStr || !closeTimeStr) return { valid: false, error: 'Horários inválidos.' };
  
  const [oH, oM] = openTimeStr.split(':').map(Number);
  const [cH, cM] = closeTimeStr.split(':').map(Number);
  
  const openMin = oH * 60 + oM;
  let closeMin = cH * 60 + cM;
  
  if (closeMin <= openMin) {
     // Check if overnight (e.g. open 23:00, close 02:00) 
     // but our max is 23:30 anyway, so overnight within same record is generally rejected by shift boundaries.
     // For safety, we reject same or negative time on the same day.
     return { valid: false, error: 'A hora de saída deve ser posterior à hora de entrada.' };
  }
  
  if (!isValidTimeSlot(cH, cM)) {
      return { valid: false, error: 'A hora de saída não é válida (intervalos de 30m, fora das pausas).' };
  }
  
  return { valid: true, error: null };
};

export const formatTimeForComparison = (date, hour, minute) => {
  let d = new Date(date);
  d = setHours(d, hour);
  d = setMinutes(d, minute);
  d = setSeconds(d, 0);
  d.setMilliseconds(0);
  return d.getTime();
};