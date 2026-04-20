import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const HolidayTooltip = ({ holidayName, date, children }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="bg-amber-100 text-amber-900 border-amber-200">
          <div className="flex flex-col items-center">
            <span className="font-bold text-sm">{holidayName}</span>
            <span className="text-xs text-amber-700 capitalize">
              {format(date, "EEEE, d 'de' MMMM", { locale: pt })}
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default HolidayTooltip;