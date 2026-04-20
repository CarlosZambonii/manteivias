export const getShiftLabel = (shiftZone) => {
    switch (shiftZone) {
      case 'Extra': return 'Hora Extra';
      case 'Manhã': return 'Turno da Manhã';
      case 'Tarde': return 'Turno da Tarde';
      default: return 'Desconhecido';
    }
  };
  
  export const getShiftColor = (shiftZone) => {
    switch (shiftZone) {
      case 'Extra': return 'bg-red-100 text-red-800 border-red-200';
      case 'Manhã': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Tarde': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  export const formatShiftTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    return m === '00' ? `${h}h` : `${h}h${m}`;
  };
  
  export const getShiftDescription = (shiftZone) => {
    switch (shiftZone) {
      case 'Extra': return 'Fora do horário normal. Requer validação extra.';
      case 'Manhã': return 'Horário normal matutino (08:00 - 12:00).';
      case 'Tarde': return 'Horário normal vespertino (13:00 - 17:00).';
      default: return 'Horário não classificado.';
    }
  };