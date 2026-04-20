import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import CorrectionCard from '@/components/corrections/CorrectionCard';
import { cn } from '@/lib/utils';

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
};

const CorrectionsByUserCard = ({ group, onUpdateStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group user corrections by Date
  const correctionsByDate = useMemo(() => {
     const byDate = {};
     group.corrections.forEach(c => {
         const dateKey = c.data_correcao; 
         if (!byDate[dateKey]) byDate[dateKey] = [];
         byDate[dateKey].push(c);
     });
     
     // Sort dates descending
     return Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]));
  }, [group.corrections]);

  return (
    <Card className={cn(
        "overflow-hidden transition-all duration-300 border-l-4",
        isExpanded ? "border-l-primary shadow-md ring-1 ring-border" : "border-l-transparent hover:border-l-primary/40 hover:shadow-sm"
    )}>
      <div 
        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* User Info */}
        <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-background ring-1 ring-border/20 shadow-sm">
                <AvatarImage src={group.user?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(group.user?.nome)}
                </AvatarFallback>
            </Avatar>
            <div>
                <h3 className="font-bold text-base text-foreground">{group.user?.nome || 'Colaborador Desconhecido'}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                        {group.corrections.length} registro{group.corrections.length !== 1 ? 's' : ''}
                    </span>
                    {group.pendingCount > 0 && (
                        <span className="text-[10px] text-amber-600 font-bold px-1.5 py-0.5 bg-amber-100 rounded-sm dark:bg-amber-900/40 dark:text-amber-400">
                           ⚠️ {group.pendingCount} pendente{group.pendingCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* Status & Toggle */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-dashed">
             <div className="sm:hidden text-xs font-semibold text-muted-foreground uppercase">
                Ações
             </div>
             <div className="flex items-center gap-3">
                {group.pendingCount > 0 ? (
                    <Badge variant="warning" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 shadow-sm whitespace-nowrap">
                        Aguardando Validação
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 shadow-sm whitespace-nowrap dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
                        Processado
                    </Badge>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted shrink-0 rounded-full">
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                        <ChevronDown className="h-5 w-5" />
                    </motion.div>
                </Button>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-muted/10 border-t border-border/40 shadow-inner"
            >
                <div className="p-4 sm:p-6 space-y-8">
                    {correctionsByDate.map(([dateKey, corrections]) => (
                        <div key={dateKey} className="space-y-4">
                            <div className="flex items-center gap-3 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 border-b border-border/40">
                                <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                                    <CalendarDays className="h-4 w-4" />
                                </div>
                                <h4 className="font-semibold text-sm text-foreground capitalize">
                                    {format(parseISO(dateKey), "EEEE, d 'de' MMMM", { locale: pt })}
                                </h4>
                                <span className="text-xs text-muted-foreground ml-auto font-medium bg-muted px-2 py-0.5 rounded-full">
                                    {corrections.length} item{corrections.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {corrections
                                  .sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao))
                                  .map((correction, idx) => (
                                    <motion.div
                                        key={correction.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <CorrectionCard 
                                            correction={correction} 
                                            onUpdateStatus={onUpdateStatus}
                                            className="h-full border-border/60 hover:border-primary/40 bg-background"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default CorrectionsByUserCard;