import { setHours, setMinutes, setSeconds } from 'date-fns';

const getLocalISOString = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const applyTimeToDate = (date, timeStr) => {
    if (!timeStr || !date) return null;
    const [h, m] = timeStr.split(':').map(Number);
    let newDate = new Date(date);
    newDate = setHours(newDate, h);
    newDate = setMinutes(newDate, m);
    newDate = setSeconds(newDate, 0);
    newDate.setMilliseconds(0);
    // Return raw local time without converting to UTC
    return getLocalISOString(newDate);
};

/**
 * Assigns proper 'real' and 'escolhido' times to generated records.
 */
export const assignRecordTimes = (
    recordData, 
    baseDate, 
    userOpenRealTime, 
    userCloseRealTime, 
    isAutomatic, 
    isFirstRecord, 
    isLastRecord
) => {
    // If automatic close, real end time is just the chosen boundary time
    // If middle record in a cascade, real time is the boundary time
    
    const startReal = isFirstRecord && userOpenRealTime 
        ? getLocalISOString(userOpenRealTime) 
        : applyTimeToDate(baseDate, recordData.horaInicioEscolhido);
        
    const endReal = (isLastRecord && !isAutomatic) && userCloseRealTime 
        ? getLocalISOString(userCloseRealTime) 
        : applyTimeToDate(baseDate, recordData.horaFimEscolhido);

    return {
        ...recordData,
        hora_inicio_escolhido: recordData.horaInicioEscolhido,
        hora_fim_escolhido: recordData.horaFimEscolhido,
        hora_inicio_real: startReal,
        hora_fim_real: endReal
    };
};

export const ensureTimeConsistency = (records, baseDate, openReal, closeReal, isAutomatic) => {
    return records.map((rec, index) => {
        const isFirst = index === 0;
        const isLast = index === records.length - 1;
        return assignRecordTimes(rec, baseDate, openReal, closeReal, isAutomatic, isFirst, isLast);
    });
};

/**
 * Transforms cascade logic output into final Supabase insert format.
 */
export const convertToRecordFormat = (cascadeRecords, baseRecord, baseDate, openReal, closeReal, isAutomatic) => {
    const timedRecords = ensureTimeConsistency(cascadeRecords, baseDate, openReal, closeReal, isAutomatic);
    
    return timedRecords.map(tr => ({
        usuario_id: baseRecord.usuario_id,
        obra_id: baseRecord.obra_id,
        lat_inicio: baseRecord.lat_inicio,
        lon_inicio: baseRecord.lon_inicio,
        lat_fim: isAutomatic ? null : baseRecord.lat_fim,
        lon_fim: isAutomatic ? null : baseRecord.lon_fim,
        distancia_metros: baseRecord.distancia_metros,
        dentro_raio_500m: baseRecord.dentro_raio_500m,
        status_validacao: isAutomatic ? 'Fechado Automaticamente' : 'Pendente',
        turno: tr.turno,
        hora_inicio_escolhido: tr.hora_inicio_escolhido,
        hora_fim_escolhido: tr.hora_fim_escolhido,
        hora_inicio_real: tr.hora_inicio_real,
        hora_fim_real: tr.hora_fim_real
    }));
};