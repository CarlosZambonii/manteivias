import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, User, Plane, CalendarDays, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, parseISO } from 'date-fns';

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
};

const HolidayItemCard = ({ item, onApprove, onReject, formatDates, getStatusBadge, publicHolidays }) => {
    const isPending = item.status_validacao === 'Pendente';
    const hasConflict = publicHolidays?.length > 0 && item.dias && item.dias.some(d => 
        publicHolidays.some(ph => ph.data === d)
    );

    return (
        <Card className="relative text-sm shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-background">
                        {item.tipos_justificação?.codigo === 'FE' ? <Plane className="h-3 w-3 mr-1 text-blue-500" /> : <CalendarDays className="h-3 w-3 mr-1 text-orange-500" />}
                        {item.tipos_justificação?.nome}
                    </Badge>
                </div>
                {hasConflict && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-transparent cursor-help text-[10px] px-1.5 py-0 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Conflito
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent>Coincide com feriado público</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </CardHeader>
            <CardContent className="p-3 py-2 space-y-2">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm sm:text-base">
                        {formatDates(item.dias)}
                    </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Submetido: {item.data_envio ? format(parseISO(item.data_envio), 'dd/MM/yyyy HH:mm') : '-'}</span>
                    <span>Total: {item.dias?.length || 0} dia(s)</span>
                </div>
                {item.comentario && (
                    <div className="text-xs mt-2 bg-muted/50 p-2 rounded border border-border/50 text-foreground">
                        {item.comentario}
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-3 pt-0 flex justify-end gap-2">
                {!isPending && (
                    <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(item.status_validacao)}
                        <span className="text-[10px] text-muted-foreground italic">
                            Validado por {item.validator_name || item.validado_por || 'Sistema'}
                        </span>
                    </div>
                )}
                {isPending && (
                    <>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:hover:bg-red-900/20"
                            onClick={() => onReject(item)}
                        >
                            Rejeitar
                        </Button>
                        <Button 
                            size="sm" 
                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => onApprove(item)}
                        >
                            Aprovar
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
};

const HolidaysByUserCard = ({ group, onApprove, onReject, formatDates, getStatusBadge, publicHolidays }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="overflow-hidden border-l-4 border-l-primary/20 hover:border-l-primary transition-all">
            <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={group.user?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(group.user?.nome)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-lg leading-none">{group.user?.nome || 'Colaborador Desconhecido'}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            {group.records.length} pedido(s) • {group.user?.tipo_registo || 'N/A'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {group.pendingCount > 0 && (
                        <Badge variant="warning" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0">
                            {group.pendingCount} Pendente(s)
                        </Badge>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                        className="bg-muted/30 border-t"
                    >
                        <div className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {group.records.map(record => (
                                    <HolidayItemCard 
                                        key={record.id} 
                                        item={record} 
                                        onApprove={onApprove}
                                        onReject={onReject}
                                        formatDates={formatDates}
                                        getStatusBadge={getStatusBadge}
                                        publicHolidays={publicHolidays}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
};

export default HolidaysByUserCard;