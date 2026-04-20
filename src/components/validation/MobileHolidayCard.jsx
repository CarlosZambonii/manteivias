import React, { memo } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, CalendarDays, Plane, Check, X, AlertCircle, MoreVertical } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const MobileHolidayCard = ({ 
  item, 
  onApprove, 
  onReject, 
  formatDates, 
  getStatusBadge,
  isPending,
  publicHolidays 
}) => {
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Background colors based on swipe position - updated to match standard application palette
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['rgba(239, 68, 68, 0.9)', 'rgba(30, 41, 59, 0.0)', 'rgba(34, 197, 94, 0.9)']
  );

  const handleDragEnd = async (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const threshold = 100;

    if (offset > threshold || velocity > 500) {
      if (item.status_validacao === 'Pendente') {
        if (navigator.vibrate) navigator.vibrate(50);
        await controls.start({ x: 500, opacity: 0 });
        onApprove(item);
      } else {
        controls.start({ x: 0 });
      }
    } else if (offset < -threshold || velocity < -500) {
      if (item.status_validacao === 'Pendente') {
        if (navigator.vibrate) navigator.vibrate([50, 50]);
        await controls.start({ x: -500, opacity: 0 });
        onReject(item);
      } else {
        controls.start({ x: 0 });
      }
    } else {
      controls.start({ x: 0 });
    }
  };

  const hasConflict = publicHolidays?.length > 0 && item.dias && item.dias.some(d => 
    publicHolidays.some(ph => ph.data === d)
  );

  return (
    <div className="relative mb-4 overflow-hidden rounded-xl bg-background border border-border shadow-sm transition-all hover:shadow-md">
        {/* Swipe Action Layer Indicators */}
        <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none">
            <div className="flex items-center text-white font-bold text-base">
                <Check className="mr-2 h-6 w-6" /> Aprovar
            </div>
            <div className="flex items-center text-white font-bold text-base">
                Rejeitar <X className="ml-2 h-6 w-6" />
            </div>
        </div>

        {/* Swipeable Card Content */}
        <motion.div
            style={{ x, background }}
            drag={item.status_validacao === 'Pendente' ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            animate={controls}
            className="relative z-10 bg-card rounded-xl shadow-sm border border-border/50"
        >
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4 gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                         <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
                            <User className="h-5 w-5 text-primary" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm sm:text-base text-foreground truncate leading-tight">{item.usuarios?.nome}</h3>
                            <p className="text-xs text-muted-foreground truncate font-medium">{item.usuarios?.tipo_registo}</p>
                         </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        {getStatusBadge(item.status_validacao)}
                         {item.status_validacao === 'Pendente' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1 hover:bg-muted transition-colors rounded-full">
                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => onApprove(item)} className="text-green-500 focus:text-green-600 focus:bg-green-500/10 cursor-pointer">
                                        <Check className="mr-2 h-4 w-4" /> Aprovar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onReject(item)} className="text-red-500 focus:text-red-600 focus:bg-red-500/10 cursor-pointer">
                                        <X className="mr-2 h-4 w-4" /> Rejeitar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2.5">
                        <Badge variant="secondary" className="bg-secondary/50 text-secondary-foreground border-secondary-foreground/20 py-1 flex items-center gap-2">
                          {item.tipos_justificação?.codigo === 'FE' ? (
                            <Plane className="h-3.5 w-3.5" />
                          ) : (
                            <CalendarDays className="h-3.5 w-3.5" />
                          )}
                          <span className="font-semibold text-[11px] uppercase tracking-wider">{item.tipos_justificação?.nome}</span>
                        </Badge>
                    </div>

                    <div className="p-3.5 bg-muted/40 rounded-lg border border-border/50">
                        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
                           <CalendarDays className="h-3 w-3" /> Datas Solicitadas
                        </div>
                        <div className="text-sm text-foreground font-medium leading-relaxed break-words">
                            {formatDates(item.dias)}
                        </div>
                        {hasConflict && (
                            <div className="mt-3 flex items-center text-xs text-amber-500 font-semibold bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                                <AlertCircle className="h-3.5 w-3.5 mr-2 shrink-0" />
                                Coincide com feriado público
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                            <span>Solicitado: {item.data_envio ? format(parseISO(item.data_envio), 'dd/MM HH:mm') : '-'}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </motion.div>
    </div>
  );
};

export default memo(MobileHolidayCard);