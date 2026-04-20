import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import React from 'react';
import { DayPicker } from 'react-day-picker';
import { isSameDay, parseISO } from 'date-fns';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import HolidayTooltip from '@/components/ui/HolidayTooltip';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  holidays = [],
  ...props
}) {
  
  // Custom DayContent to handle Holiday logic
  const HolidayDayContent = (dayProps) => {
    const { date } = dayProps;
    
    // Find if the current day is a holiday
    // We normalize comparisons by comparing date strings or standardizing time
    const holiday = holidays.find(h => {
        const holidayDate = typeof h.data === 'string' ? parseISO(h.data) : h.data;
        return isSameDay(holidayDate, date);
    });

    if (holiday) {
        return (
            <HolidayTooltip holidayName={holiday.nome} date={date}>
                <div className="relative w-full h-full flex items-center justify-center">
                    <span className="z-10">{date.getDate()}</span>
                    <Star 
                        className="absolute -top-1 -right-1 h-2.5 w-2.5 text-amber-600 fill-amber-500 animate-pulse" 
                        strokeWidth={2}
                    />
                </div>
            </HolidayTooltip>
        );
    }

    return <span>{date.getDate()}</span>;
  };

  // Create a modifier for holidays to apply background styles
  const holidayModifier = {
    holiday: holidays.map(h => typeof h.data === 'string' ? parseISO(h.data) : h.data)
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      modifiers={holidayModifier}
      modifiersClassNames={{
        holiday: "bg-amber-100/50 text-amber-900 font-medium hover:bg-amber-200/60 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40"
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        DayContent: HolidayDayContent,
        ...props.components // Allow overrides if any passed
      }}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell:
          'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside:
          'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle:
          'aria-selected:bg-accent aria-selected:text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };