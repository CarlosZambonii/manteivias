import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/hooks/useLanguage';

const MobileFilterSheet = ({ 
  statusFilter, 
  setStatusFilter, 
  sortConfig, 
  setSortConfig,
  resultCount 
}) => {
  const { t } = useLanguage();

  const filters = [
    { value: 'Todos', label: t('validation.all') },
    { value: 'Pendente', label: t('validation.pending') },
    { value: 'Aprovado', label: t('validation.approved') },
    { value: 'Recusado', label: t('validation.rejected') }
  ];

  const sortOptions = [
    { key: 'data_envio', label: t('validation.submissionDate') },
    { key: 'nome', label: t('validation.employee') },
    { key: 'dias', label: t('validation.requestedDates') },
    { key: 'status', label: t('common.status') },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden gap-2 h-9">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden xs:inline">{t('validation.filters')}</span>
          {statusFilter !== 'Todos' && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 min-w-[1.25rem] text-[10px] flex items-center justify-center">1</Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-xl px-0 z-[100]">
        <SheetHeader className="px-6 pb-4 pt-4">
          <SheetTitle className="text-center sm:text-left">{t('validation.filters')}</SheetTitle>
        </SheetHeader>
        
        <div className="px-6 py-4 space-y-8 overflow-y-auto max-h-[calc(80vh-8rem)]">
            {/* Status Filter */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('common.status')}</h4>
                <div className="flex flex-wrap gap-2">
                    {filters.map(filter => (
                        <Button
                            key={filter.value}
                            variant={statusFilter === filter.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter(filter.value)}
                            className="rounded-full h-9 px-4 text-sm"
                        >
                            {filter.label}
                        </Button>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Sorting */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t('validation.sortBy')}</h4>
                <div className="flex flex-col gap-2">
                    {sortOptions.map(option => (
                        <Button
                            key={option.key}
                            variant="ghost"
                            className="justify-between w-full h-12 px-4 font-normal hover:bg-muted/50 rounded-lg border border-transparent hover:border-muted"
                            onClick={() => {
                                const newDirection = sortConfig.key === option.key && sortConfig.direction === 'ascending' 
                                    ? 'descending' 
                                    : 'ascending';
                                setSortConfig({ key: option.key, direction: newDirection });
                            }}
                        >
                            <span className="text-base">{option.label}</span>
                            {sortConfig.key === option.key && (
                                <Badge variant="secondary" className="ml-2 gap-1 h-6 px-2">
                                    <ArrowUpDown className="h-3 w-3" />
                                    {sortConfig.direction === 'ascending' ? 'Crescente' : 'Decrescente'}
                                </Badge>
                            )}
                        </Button>
                    ))}
                </div>
            </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
             <SheetClose asChild>
                <Button className="w-full h-12 text-lg font-semibold">
                    {t('validation.results')} ({resultCount})
                </Button>
             </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilterSheet;