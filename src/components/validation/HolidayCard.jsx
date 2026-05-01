import React, { useState, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, Check, X, CalendarDays, Plane, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
};

const HolidayCard = ({ item, onApprove, onReject, formatDates, getStatusBadge, publicHolidays }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasConflict = publicHolidays?.length > 0 && item.dias && item.dias.some(d => 
    publicHolidays.some(ph => ph.data === d)
  );

  return (
    <Card className="mb-3 overflow-hidden border-border/50 hover:shadow-md transition-all duration-200">
      <CardContent className="p-0">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Left: Employee Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 border border-border/50">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(item.usuarios?.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-sm truncate text-foreground" title={item.usuarios?.nome}>
                {item.usuarios?.nome}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {item.usuarios?.tipo_registo}
              </span>
            </div>
          </div>

          {/* Center: Dates & Type */}
          <div className="flex flex-col items-center justify-center w-1/3 hidden md:flex">
             <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-background">
                    {item.tipos_justificação?.codigo === 'FE' ? <Plane className="h-3 w-3 mr-1" /> : <CalendarDays className="h-3 w-3 mr-1" />}
                    {item.tipos_justificação?.nome}
                </Badge>
             </div>
             <span className="text-sm font-medium text-foreground text-center">
                {formatDates(item.dias)}
             </span>
             {hasConflict && (
                <span className="text-[10px] text-amber-500 flex items-center mt-1 font-medium">
                    <AlertCircle className="h-3 w-3 mr-1" /> Coincide com feriado
                </span>
             )}
          </div>

          {/* Right: Status & Action Trigger */}
          <div className="flex items-center justify-end gap-3 flex-shrink-0">
            <div className="flex flex-col items-end">
                {getStatusBadge(item.status_validacao)}
                <span className="text-[10px] text-muted-foreground mt-1">
                    {item.data_envio ? format(parseISO(item.data_envio), 'dd/MM/yyyy') : '-'}
                </span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden bg-muted/20 border-t border-border/50"
            >
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detalhes</div>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between md:hidden">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span>{item.tipos_justificação?.nome}</span>
                        </div>
                        <div className="flex justify-between md:hidden">
                            <span className="text-muted-foreground">Datas:</span>
                            <span>{formatDates(item.dias)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Submetido em:</span>
                            <span>{item.data_envio ? format(parseISO(item.data_envio), 'dd/MM/yyyy HH:mm') : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                             <span className="text-muted-foreground">Total de Dias:</span>
                             <span>{item.dias?.length || 0}</span>
                        </div>
                         {item.comentario && (
                            <div className="pt-2">
                                <span className="text-muted-foreground block mb-1">Comentário:</span>
                                <p className="text-foreground bg-background p-2 rounded-md border text-xs">{item.comentario}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col justify-end items-end gap-3">
                    {item.status_validacao === 'Pendente' ? (
                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <Button 
                                variant="outline" 
                                className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/30 dark:hover:bg-red-900/20"
                                onClick={(e) => { e.stopPropagation(); onReject(item); }}
                            >
                                <X className="h-4 w-4 mr-2" /> Rejeitar
                            </Button>
                            <Button 
                                className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white"
                                onClick={(e) => { e.stopPropagation(); onApprove(item); }}
                            >
                                <Check className="h-4 w-4 mr-2" /> Aprovar
                            </Button>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic flex items-center">
                            Validado por {item.validator_name || item.validado_por || 'Sistema'} em {item.data_validacao ? format(parseISO(item.data_validacao), 'dd/MM/yyyy') : '-'}
                        </div>
                    )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default memo(HolidayCard);