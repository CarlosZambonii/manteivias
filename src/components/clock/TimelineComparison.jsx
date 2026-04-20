import React from 'react';
import { format, differenceInMinutes, parseISO } from 'date-fns';

const TimelineComparison = ({ actualDate, selectedTimeStr }) => {
  if (!actualDate || !selectedTimeStr) return null;

  const actualDateObj = typeof actualDate === 'string' ? parseISO(actualDate) : actualDate;
  
  // Parse selected time into today's date context for comparison
  const [hours, minutes] = selectedTimeStr.split(':').map(Number);
  const selectedDateObj = new Date(actualDateObj);
  selectedDateObj.setHours(hours, minutes, 0, 0);

  const diffMinutes = differenceInMinutes(actualDateObj, selectedDateObj);
  const absDiff = Math.abs(diffMinutes);

  // Styling logic based on difference
  let diffColor = 'text-green-600 bg-green-100';
  if (absDiff > 5) diffColor = 'text-yellow-600 bg-yellow-100';
  if (absDiff > 15) diffColor = 'text-orange-600 bg-orange-100';

  const isActualFirst = diffMinutes > 0; // Actual is after selected
  
  return (
    <div className="w-full hidden sm:block mt-6 mb-4 px-4 animate-fade-in">
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>{selectedTimeStr} (Selecionada)</span>
        <span>{format(actualDateObj, 'HH:mm')} (Real)</span>
      </div>
      
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden flex">
        <div 
          className="absolute top-0 bottom-0 bg-gradient-to-r from-gray-400 to-primary opacity-50"
          style={{ 
            left: isActualFirst ? '30%' : '70%', 
            right: isActualFirst ? '30%' : '70%',
            width: '40%'
          }} 
        />
        {/* Markers */}
        <div className="absolute top-0 bottom-0 w-1 bg-primary rounded-full left-1/4 z-10 shadow-sm" title="Hora Selecionada" />
        <div className="absolute top-0 bottom-0 w-1 bg-gray-500 rounded-full right-1/4 z-10 shadow-sm" title="Hora Real" />
      </div>

      <div className="mt-3 flex justify-center">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${diffColor}`}>
          Diferença: {absDiff} min {diffMinutes > 0 ? '(Atraso)' : diffMinutes < 0 ? '(Adiantado)' : ''}
        </span>
      </div>
    </div>
  );
};

export default TimelineComparison;