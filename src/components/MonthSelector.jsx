import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { addMonths, subMonths } from 'date-fns';

const MonthSelector = ({ selectedMonth, onMonthChange }) => {
  const handlePrevMonth = () => {
    onMonthChange(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(selectedMonth, 1));
  };

  const formattedMonth = format(selectedMonth, 'MMMM yyyy', { locale: pt });

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handlePrevMonth}
        className="h-8 w-8 md:h-10 md:w-10"
      >
        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
      </Button>
      <span className="w-32 md:w-40 text-center font-semibold capitalize text-sm md:text-base truncate px-2">
        {formattedMonth}
      </span>
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleNextMonth}
        className="h-8 w-8 md:h-10 md:w-10"
      >
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
      </Button>
    </div>
  );
};

export default MonthSelector;