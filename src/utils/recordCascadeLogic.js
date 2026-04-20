/**
 * Core logic for cascading records generation.
 */

const timeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

/**
 * Generates cascaded records based on open and optional close time.
 * If closeTime is provided, segments are bridged across the entire duration (Manual Close).
 * If closeTime is null, strict auto-close rules are applied sequentially (Auto Close).
 */
export const generateCascadingRecords = (openTimeStr, closeTimeStr = null, openDate = new Date()) => {
    const records = [];
    const openMin = timeToMinutes(openTimeStr);
    const closeMin = closeTimeStr ? timeToMinutes(closeTimeStr) : null;
    
    // Define the valid work segments and their automatic continuity chains
    const segments = [
      { zone: 'Extra', start: 0, end: 8 * 60, nextAuto: 8 * 60 },
      { zone: 'Manhã', start: 8 * 60, end: 12 * 60, nextAuto: null }, // Stops at 12:00
      { zone: 'Tarde', start: 13 * 60, end: 17 * 60, nextAuto: 17 * 60 },
      { zone: 'Extra', start: 17 * 60, end: 23 * 60 + 30, nextAuto: null } // Stops at 23:30
    ];

    if (closeMin !== null) {
      // MANUAL CLOSE: Generate all valid overlapping segments
      for (const seg of segments) {
         const overlapStart = Math.max(openMin, seg.start);
         const overlapEnd = Math.min(closeMin, seg.end);
         
         if (overlapStart < overlapEnd) {
            records.push({
               shiftZone: seg.zone,
               turno: seg.zone,
               horaInicioEscolhido: minutesToTime(overlapStart),
               horaFimEscolhido: minutesToTime(overlapEnd)
            });
         }
      }
    } else {
      // AUTO CLOSE: Follow the strict continuity chain
      let currentMin = openMin;
      while (currentMin !== null) {
         const seg = segments.find(s => currentMin >= s.start && currentMin < s.end);
         if (!seg) break; // Escaped valid segments
         
         records.push({
           shiftZone: seg.zone,
           turno: seg.zone,
           horaInicioEscolhido: minutesToTime(currentMin),
           horaFimEscolhido: minutesToTime(seg.end)
         });
         
         currentMin = seg.nextAuto; // Move to next chained segment (or null to stop)
      }
    }
    
    return records;
};

export const applyAutoCloseRules = (openTimeStr) => {
    return generateCascadingRecords(openTimeStr, null);
};