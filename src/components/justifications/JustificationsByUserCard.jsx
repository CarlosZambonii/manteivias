import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, User, Clock, AlertTriangle, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import JustificationDaySection from './JustificationDaySection';
import { cn } from '@/lib/utils';

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
};

const JustificationsByUserCard = ({ group, onUpdateStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group justifications by Date (start date) for display
  const justificationsByDate = useMemo(() => {
    const byDate = {};
    group.justifications.forEach(j => {
       const days = j.dias || [];
       if (days.length === 0) return;
       // Sort days to find start date
       const sorted = days.map(d => parseISO(d)).sort((a,b) => a-b);
       // Use start date as key
       const dateKey = sorted[0].toISOString(); 
       
       if (!byDate[dateKey]) byDate[dateKey] = [];
       byDate[dateKey].push(j);
    });

    // Sort dates descending (newest first)
    return Object.entries(byDate).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [group.justifications]);

  return (
    <Card className={cn(
        "overflow-hidden border-l-4 transition-all duration-200 shadow-sm hover:shadow",
        group.pendingCount > 0 ? "border-l-amber-500 hover:border-l-amber-600" : "border-l-primary/30 hover:border-l-primary"
    )}>
      <div 
        className="p-3 md:p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 md:gap-4">
            <Avatar className={cn("h-8 w-8 md:h-10 md:w-10 border-2 flex-shrink-0", group.pendingCount > 0 ? "border-amber-100" : "border-background")}>
                <AvatarImage src={group.user?.avatar_url} loading="lazy" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs md:text-sm">
                    {getInitials(group.user?.nome)}
                </AvatarFallback>
            </Avatar>
            <div>
                <h3 className="font-semibold text-base md:text-lg text-foreground tracking-tight line-clamp-1">
                    {group.user?.nome || 'Colaborador Desconhecido'}
                </h3>
                <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className="font-medium text-foreground/80">{group.justifications.length}</span> registo(s)
                </p>
            </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
            {group.pendingCount > 0 && (
                <Badge variant="warning" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 shadow-sm gap-1 whitespace-nowrap text-[10px] md:text-xs px-1.5 md:px-2.5">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="hidden sm:inline">{group.pendingCount} Pendente(s)</span>
                    <span className="sm:hidden">{group.pendingCount}</span>
                </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 md:h-10 md:w-10 p-0 text-muted-foreground flex-shrink-0">
                {isExpanded ? <ChevronUp className="h-4 w-4 md:h-5 md:w-5" /> : <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-muted/20 border-t border-border/50"
            >
                <div className="p-3 md:p-6 space-y-4 md:space-y-6">
                   {justificationsByDate.length === 0 ? (
                       <div className="text-center py-4 text-muted-foreground text-sm italic">
                           Sem datas válidas associadas.
                       </div>
                   ) : (
                       justificationsByDate.map(([dateKey, justifications]) => (
                           <div key={dateKey} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <h4 className="font-medium text-xs md:text-sm text-muted-foreground capitalize">
                                        {format(parseISO(dateKey), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                                    </h4>
                                    <div className="h-px bg-border flex-grow ml-2 opacity-60" />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {justifications.map(justification => (
                                        <JustificationDaySection 
                                            key={justification.id} 
                                            justification={justification} 
                                            onUpdateStatus={onUpdateStatus}
                                        />
                                    ))}
                                </div>
                           </div>
                       ))
                   )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default JustificationsByUserCard;