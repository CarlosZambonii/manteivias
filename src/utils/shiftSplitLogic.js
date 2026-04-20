import { 
  setHours, 
  setMinutes, 
  setSeconds, 
  isBefore, 
  isAfter, 
  format, 
  min,
  max,
  differenceInMinutes,
  parse,
  isValid,
  addDays
} from 'date-fns';

/**
 * SHIFT BOUNDARIES DEFINITION
 * 
 * Defines the strict time windows for each shift type.
 * Gaps (like 12:00-13:00) are intentionally excluded to enforce breaks.
 * 
 * IMPORTANT: These boundaries are compared against USER-SELECTED times (e.g. "07:00"), 
 * not server timestamps.
 */
const SHIFT_SEGMENTS = [
  { type: 'Extra', start: { h: 0, m: 0 }, end: { h: 8, m: 0 } },      // 00:00 - 08:00
  { type: 'Manha', start: { h: 8, m: 0 }, end: { h: 12, m: 0 } },     // 08:00 - 12:00
  // 12:00 - 13:00 is Skipped (Break)
  { type: 'Tarde', start: { h: 13, m: 0 }, end: { h: 17, m: 0 } },    // 13:00 - 17:00
  { type: 'Extra', start: { h: 17, m: 0 }, end: { h: 23, m: 30 } }    // 17:00 - 23:30
];

/**
 * Helper to create a Date object for a specific time on a specific base date.
 */
const getDateForTime = (baseDate, timeObj) => {
  let date = new Date(baseDate);
  date = setHours(date, timeObj.h);
  date = setMinutes(date, timeObj.m);
  date = setSeconds(date, 0);
  date.setMilliseconds(0);
  return date;
};

/**
 * Helper to parse a "HH:mm" string into a Date object on the base date.
 */
const parseTimeOnDate = (timeStr, baseDate) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  let date = new Date(baseDate);
  date = setHours(date, h);
  date = setMinutes(date, m);
  date = setSeconds(date, 0);
  date.setMilliseconds(0);
  return date;
};

/**
 * Determines the shift type for a specific single point in time.
 * Useful for initial Clock In when end time is null.
 * @param {Date} date 
 * @returns {string} Shift type ('Manha', 'Tarde', 'Extra')
 */
export const getShiftTypeForTime = (date) => {
  const h = date.getHours();
  const m = date.getMinutes();
  const timeVal = h * 60 + m;

  // 00:00 to 07:59 -> Extra
  if (timeVal < 8 * 60) return 'Extra';
  // 08:00 to 12:00 -> Manha
  if (timeVal <= 12 * 60) return 'Manha';
  // 12:01 to 12:59 -> Gap (treated as Extra or Tarde depending on proximity, defaulting to Extra for safety if working during lunch)
  if (timeVal < 13 * 60) return 'Extra'; 
  // 13:00 to 17:00 -> Tarde
  if (timeVal <= 17 * 60) return 'Tarde';
  // 17:01 to 23:30 -> Extra
  if (timeVal <= 23 * 60 + 30) return 'Extra';
  
  return 'Extra';
};

/**
 * Splits a single record into multiple records based on strict shift boundaries using USER-SELECTED times.
 * 
 * CRITICAL LOGIC CHANGE:
 * This function MUST use `hora_inicio_escolhido` and `hora_fim_escolhido` for determining shift splits.
 * We rely on the user's explicit input (e.g. "07:00" start, "19:00" end) to create clean, predictable records.
 * 
 * Algorithm:
 * 1. Parse user-selected start ("HH:mm") and end ("HH:mm") times onto the record's base date.
 * 2. Define valid shift segments: 
 *    - Extra (00:00-08:00)
 *    - Manha (08:00-12:00)
 *    - Tarde (13:00-17:00)
 *    - Extra (17:00-23:30)
 * 3. Iterate through segments and find overlaps with the User-Selected Time Range.
 * 4. Create split records for each overlap using the chosen times.
 * 
 * Test Case Example:
 * User selects 07:00 to 19:00.
 * Should produce:
 * 1. Extra 07:00-08:00
 * 2. Manha 08:00-12:00
 * 3. Tarde 13:00-17:00 (Lunch 12-13 skipped)
 * 4. Extra 17:00-19:00
 * 
 * @param {Object} record - The original record containing hora_inicio_escolhido and hora_fim_escolhido
 * @returns {Array} Array of split record objects
 */
export const splitRecordByMultipleShifts = (record) => {
  const { 
    usuario_id, 
    obra_id, 
    lat_inicio, 
    lon_inicio, 
    lat_fim,
    lon_fim,
    hora_inicio_real, // Kept for reference date, but NOT used for split logic
    hora_fim_real,    // Kept for reference, NOT used for split logic
    hora_inicio_escolhido,
    hora_fim_escolhido,
    distancia_metros,
    dentro_raio_500m
  } = record;

  // Using user-selected time: hora_inicio_escolhido
  // Using user-selected time: hora_fim_escolhido
  if (!hora_fim_escolhido) {
    // Cannot split an open record. Return as is.
    return [{
      ...record,
      turno: getShiftTypeForTime(new Date(hora_inicio_real))
    }];
  }

  // Base calculation date (usually today) from the real start timestamp
  const baseDate = new Date(hora_inicio_real);

  // Parse User-Selected Times onto the base date for comparison
  const chosenStart = parseTimeOnDate(hora_inicio_escolhido, baseDate);
  let chosenEnd = parseTimeOnDate(hora_fim_escolhido, baseDate);

  // Handle overnight shift edge case (End time is "smaller" than Start time -> next day)
  if (isBefore(chosenEnd, chosenStart)) {
    chosenEnd = addDays(chosenEnd, 1);
  }

  const splitRecords = [];

  // Iterate through defined segments
  SHIFT_SEGMENTS.forEach(segment => {
    // Construct segment start/end for the day of the record
    const segmentStart = getDateForTime(baseDate, segment.start);
    const segmentEnd = getDateForTime(baseDate, segment.end);

    // If the record spans to the next day, we might need to check segments for the next day too.
    // For simplicity in this specific "single day" shift logic, we assume shifts generally align with one calendar day or handled simply.
    // If chosenEnd is next day, we extend logic slightly or just clamp to end of day for standard logic.
    // However, if strict overnight shifts are needed, segment iteration would need to be smarter.
    // Assuming standard day shifts here for the requested logic.

    // Check overlap using User-Selected Times
    // Overlap Start = MAX(UserStart, SegmentStart)
    // Overlap End = MIN(UserEnd, SegmentEnd)
    
    // No overlap conditions:
    if (isAfter(chosenStart, segmentEnd) || chosenStart.getTime() === segmentEnd.getTime()) return; 
    if (isBefore(chosenEnd, segmentStart) || chosenEnd.getTime() === segmentStart.getTime()) return;

    // Calculate Intersection
    const intersectionStart = max([chosenStart, segmentStart]);
    const intersectionEnd = min([chosenEnd, segmentEnd]);

    // Ensure positive duration
    const durationMinutes = differenceInMinutes(intersectionEnd, intersectionStart);

    if (durationMinutes > 0) {
        // Format the new split times back to HH:mm string
        const splitStartStr = format(intersectionStart, 'HH:mm');
        const splitEndStr = format(intersectionEnd, 'HH:mm');

        // Create the record
        // Note: We use the intersection times for both 'Real' and 'Chosen' fields to keep data consistent for the split records.
        // The original 'Real' timestamp is just a reference point now.
        splitRecords.push({
          usuario_id,
          obra_id,
          lat_inicio,
          lon_inicio,
          lat_fim,
          lon_fim,
          // We set 'real' to the calculated intersection date/time so the database has valid timestamps
          hora_inicio_real: intersectionStart.toISOString(),
          hora_fim_real: intersectionEnd.toISOString(),
          // We set 'escolhido' to the calculated HH:mm strings
          hora_inicio_escolhido: splitStartStr,
          hora_fim_escolhido: splitEndStr,
          turno: segment.type,
          status_validacao: 'Pendente',
          dentro_raio_500m,
          distancia_metros
        });
    }
  });

  // Fallback: If no splits were generated (e.g. times completely outside all segments?), return original.
  // This shouldn't happen with 00:00-23:30 coverage, but purely defensive.
  if (splitRecords.length === 0) {
    return [{ ...record, turno: 'Extra' }]; 
  }

  return splitRecords;
};

/**
 * @deprecated Use splitRecordByMultipleShifts instead.
 * Maintained for backward compatibility.
 */
export const splitRecordByShiftBoundaries = (record) => {
  return splitRecordByMultipleShifts(record);
};

/**
 * Automatically calculates the closing time for an open shift record.
 * 
 * Updates to Logic (Task 1 & 6):
 * 1. Checks if an active session is in progress (isSessionActive). If so, skips closing.
 * 2. Checks if the record was recently updated/created (within thresholdMinutes). If so, skips closing.
 * 3. Applies original shift boundary logic only if the above checks pass.
 * 
 * Test Case (Task 6):
 * User clocks in at 07:00, clocks out at 22:00.
 * - If user is actively using the app (isSessionActive = true), this function returns record AS IS (no close).
 * - If user left app open but inactive for > thresholdMinutes, logic will trigger.
 * - This prevents aggressive auto-close while user is interacting with forms.
 * 
 * @param {Object} record - The open record object.
 * @param {Date} now - Current timestamp for comparison.
 * @param {number} thresholdMinutes - Minutes of inactivity before auto-close is allowed.
 * @param {boolean} isSessionActive - Flag indicating if user is actively clocking in/out.
 * @returns {Object} The modified record object (marked with needsSplit if closed, or original if active).
 */
export const autoCloseShiftRecord = (record, now = new Date(), thresholdMinutes = 5, isSessionActive = false) => {
  if (record.hora_fim_real) {
    return { ...record, needsSplit: false };
  }

  // 1. Session Active Check: Don't close if user is actively working on the record
  if (isSessionActive) {
      console.log(`[AutoClose] Skipping record ${record.id}: Active Session`);
      return { ...record, needsSplit: false };
  }

  // 2. Timestamp Threshold Check: Don't close if record is "fresh"
  // Use updated_at if available, fallback to hora_inicio_real (creation time)
  const lastActivity = record.updated_at ? new Date(record.updated_at) : new Date(record.hora_inicio_real);
  const diffMinutes = (now - lastActivity) / 1000 / 60;
  
  if (diffMinutes < thresholdMinutes) {
      console.log(`[AutoClose] Skipping record ${record.id}: Recently updated (${Math.round(diffMinutes)}m ago)`);
      return { ...record, needsSplit: false };
  }

  const start = new Date(record.hora_inicio_real);
  const hour = start.getHours();
  const minutes = start.getMinutes();
  const timeVal = hour * 60 + minutes;

  let closeTime = new Date(start);
  let closeTimeStr = "";

  // Before 08:00 (Start < 8*60) -> Close 12:00
  if (timeVal < 8 * 60) {
     closeTime.setHours(12, 0, 0, 0);
     closeTimeStr = "12:00";
  }
  // 08:00 - 12:00 (Start <= 12*60) -> Close 12:00
  else if (timeVal <= 12 * 60) { 
     closeTime.setHours(12, 0, 0, 0);
     closeTimeStr = "12:00";
  }
  // 13:00 - 17:00 (Start >= 13:00 AND Start <= 17:00) -> Close 17:00
  else if (timeVal >= 13 * 60 && timeVal <= 17 * 60) {
     closeTime.setHours(17, 0, 0, 0);
     closeTimeStr = "17:00";
  }
  // After 17:00 -> Close 23:30
  else if (timeVal > 17 * 60) {
     closeTime.setHours(23, 30, 0, 0);
     closeTimeStr = "23:30";
  }
  // Handling the 12:01-12:59 gap or weird times
  else {
     closeTime.setHours(17, 0, 0, 0);
     closeTimeStr = "17:00";
  }

  // Handle case where close time is earlier than start time (e.g. overnight)
  if (closeTime < start) {
      closeTime.setDate(closeTime.getDate() + 1);
  }

  return {
    ...record,
    hora_fim_real: closeTime.toISOString(),
    hora_fim_escolhido: closeTimeStr,
    status_validacao: 'Fechado Automaticamente', 
    needsSplit: true 
  };
};

export const recalculateHoursWithSplitRecords = (records) => {
  const totals = {
    manha_hours: 0,
    tarde_hours: 0,
    extra_hours: 0,
    total_hours: 0
  };

  records.forEach(record => {
    if (!record.hora_inicio_real || !record.hora_fim_real) return;

    const start = new Date(record.hora_inicio_real);
    const end = new Date(record.hora_fim_real);
    const durationHours = differenceInMinutes(end, start) / 60;

    if (durationHours > 0) {
      if (record.turno === 'Manha') totals.manha_hours += durationHours;
      else if (record.turno === 'Tarde') totals.tarde_hours += durationHours;
      else if (record.turno === 'Extra') totals.extra_hours += durationHours;
      
      totals.total_hours += durationHours;
    }
  });

  return totals;
};