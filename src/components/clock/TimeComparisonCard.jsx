import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import TimelineComparison from './TimelineComparison';

const TimeComparisonCard = ({ actualDate, selectedTimeStr, compact = false, title = "Comparação de Horários" }) => {
  if (!actualDate || !selectedTimeStr) return null;

  const actualDateObj = typeof actualDate === 'string' ? parseISO(actualDate) : actualDate;
  const actualFormatted = format(actualDateObj, 'HH:mm');

  const [hours, minutes] = selectedTimeStr.split(':').map(Number);
  const selectedDateObj = new Date(actualDateObj);
  selectedDateObj.setHours(hours, minutes, 0, 0);

  const diffMinutes = Math.abs(differenceInMinutes(actualDateObj, selectedDateObj));
  
  let alertLevel = 'success';
  if (diffMinutes > 5) alertLevel = 'warning';
  if (diffMinutes > 15) alertLevel = 'destructive';

  if (compact) {
    return (
      <Card className="w-full shadow-sm animate-fade-in border-l-4" style={{ borderLeftColor: `hsl(var(--${alertLevel}))` }}>
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> Real: {actualFormatted}</span>
            <span className="text-sm font-bold text-primary flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Sel: {selectedTimeStr}</span>
          </div>
          <Badge variant={alertLevel} className="text-[10px]">
            {diffMinutes} min diff
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md animate-slide-up bg-card overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          {title}
        </h3>
        {diffMinutes > 15 && (
           <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
             <AlertCircle className="h-3 w-3" /> Diferença alta
           </Badge>
        )}
      </div>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Actual Time */}
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1" aria-label="Hora que você entrou">Hora Real</span>
            <div className="flex items-center gap-2 text-2xl font-mono text-gray-700 dark:text-gray-300">
              <Clock className="h-6 w-6" />
              {actualFormatted}
            </div>
            <span className="text-xs text-gray-400 mt-2">Registado pelo sistema</span>
          </div>

          {/* Selected Time */}
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <span className="text-sm text-primary font-medium mb-1" aria-label="Hora que você selecionou">Hora Selecionada</span>
            <div className="flex items-center gap-2 text-2xl font-mono text-primary font-bold">
              <CheckCircle className="h-6 w-6" />
              {selectedTimeStr}
            </div>
            <Badge variant="success" className="mt-2 text-[10px] uppercase">✓ Confirmado p/ Registo</Badge>
          </div>
        </div>

        <TimelineComparison actualDate={actualDateObj} selectedTimeStr={selectedTimeStr} />

      </CardContent>
    </Card>
  );
};

export default TimeComparisonCard;