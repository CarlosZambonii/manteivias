import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const MonthMultiSelect = ({ months = [], selectedMonths = [], onChange }) => {
  const allSelected = months.length > 0 && selectedMonths.length === months.length;

  const isSelected = (m) =>
    selectedMonths.some(s => format(s, 'yyyy-MM') === format(m, 'yyyy-MM'));

  const toggle = (m) => {
    const key = format(m, 'yyyy-MM');
    if (isSelected(m)) {
      onChange(selectedMonths.filter(s => format(s, 'yyyy-MM') !== key));
    } else {
      onChange([...selectedMonths, m]);
    }
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : [...months]);
  };

  const label = allSelected
    ? 'Todos os Meses'
    : selectedMonths.length === 0
      ? 'Selecionar mês...'
      : selectedMonths.length === 1
        ? format(selectedMonths[0], 'MMMM yyyy', { locale: pt })
        : `${selectedMonths.length} meses selecionados`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal h-10">
          <span className="truncate capitalize">{label}</span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2" align="start">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox
              id="ms-all"
              checked={allSelected}
              onCheckedChange={toggleAll}
            />
            <label htmlFor="ms-all" className="text-sm font-medium leading-none cursor-pointer">
              Todos os Meses
            </label>
          </div>
          <ScrollArea className="h-64">
            <div className="flex flex-col space-y-3 pt-2 pb-2 px-1">
              {months.map(m => {
                const key = format(m, 'yyyy-MM');
                return (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ms-${key}`}
                      checked={isSelected(m)}
                      onCheckedChange={() => toggle(m)}
                    />
                    <label htmlFor={`ms-${key}`} className="text-sm font-medium leading-none cursor-pointer capitalize">
                      {format(m, 'MMMM yyyy', { locale: pt })}
                    </label>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MonthMultiSelect;
