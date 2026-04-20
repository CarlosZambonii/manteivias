import React, { useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Clock, Calendar, Building, Info, CheckCircle, XCircle, Ban, FileSignature, BadgePercent, MessageSquare, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const getStatusVariant = (status) => {
    switch (status) {
        case 'Aprovado': return 'success';
        case 'Rejeitado': return 'destructive';
        case 'Pendente': return 'secondary';
        case 'Anulado por Correção': return 'warning';
        case 'Fechado Automaticamente': return 'secondary';
        default: return 'outline';
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'Aprovado': return <CheckCircle className="h-4 w-4 mr-2" />;
        case 'Rejeitado': return <XCircle className="h-4 w-4 mr-2" />;
        case 'Pendente': return <Clock className="h-4 w-4 mr-2" />;
        case 'Anulado por Correção': return <Ban className="h-4 w-4 mr-2" />;
        case 'Fechado Automaticamente': return <Zap className="h-4 w-4 mr-2" />;
        default: return <Info className="h-4 w-4 mr-2" />;
    }
};

const RecordHistoryItem = ({ record }) => {
    const isMonthly = record.hasOwnProperty('allocations');
    const title = isMonthly ? `Registo de ${format(parseISO(record.mes), 'MMMM yyyy', { locale: pt })}` : "Registo de Ponto";
    const dateToFormat = record.hora_inicio_real || record.date;
    const dateDisplay = isMonthly ? format(parseISO(record.date), 'dd/MM/yyyy HH:mm') : format(parseISO(dateToFormat), 'dd/MM/yyyy');
    
    // Logic for Location Badge
    let isStartOnSite = false;
    let distance = null;
    let showLocationBadge = false;

    if (!isMonthly) {
        if (record.dentro_raio_500m !== null && record.dentro_raio_500m !== undefined) {
             isStartOnSite = record.dentro_raio_500m;
             distance = record.distancia_metros;
             showLocationBadge = true;
        }
    }

    const locBadgeColor = isStartOnSite ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200';
    const locBadgeText = isStartOnSite ? 'Dentro do Local' : 'Fora do Local';

    const isAutoClose = useMemo(() => {
        if (isMonthly || !record.hora_fim_real || !record.hora_fim_escolhido) return false;
        try {
            if (record.status === 'Fechado Automaticamente' || record.status_validacao === 'Fechado Automaticamente') return true;
            
            const realEnd = new Date(record.hora_fim_real);
            const realTimeStr = format(realEnd, 'HH:mm');
            // If the real time exactly matches the chosen time with 0 seconds, it was likely auto-generated
            return realTimeStr === record.hora_fim_escolhido && realEnd.getSeconds() === 0;
        } catch (e) {
            return false;
        }
    }, [record, isMonthly]);

    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <AccordionItem value={`record-${record.id}`} className="bg-background border rounded-lg overflow-hidden">
                <AccordionTrigger className="p-3 sm:p-4 hover:no-underline">
                    <div className="w-full grid grid-cols-[auto,1fr,auto] sm:grid-cols-[auto,2fr,1fr,auto] items-center gap-2 sm:gap-4 text-sm">
                        <div className="p-2 bg-primary/10 rounded-full">
                            {isMonthly ? <FileSignature className="h-5 w-5 text-primary" /> : <Calendar className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="text-left">
                            <p className="font-semibold">{title}</p>
                            <p className="text-xs text-muted-foreground">{dateDisplay}</p>
                        </div>
                        <div className="hidden sm:block text-left text-muted-foreground truncate">
                            {!isMonthly && (
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    <span>{record.obra?.nome || "N/A"}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {showLocationBadge && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge variant="outline" className={`${locBadgeColor} hidden sm:inline-flex`}>
                                                {locBadgeText}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Distância: {distance}m</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                            <Badge variant={getStatusVariant(record.status)} className="capitalize">
                                {getStatusIcon(record.status)}
                                {record.status}
                            </Badge>
                            {record.status === 'Rejeitado' && record.rejeicao_comentario && (
                                <MessageSquare className="h-4 w-4 text-red-500 sm:hidden" />
                            )}
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-4 bg-muted/50 border-t grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                         {/* Rejection Section */}
                        {record.status === 'Rejeitado' && record.rejeicao_comentario && (
                             <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }}
                                className="col-span-1 md:col-span-2 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md shadow-sm mb-2"
                             >
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3 w-full">
                                        <div className="flex justify-between items-center">
                                             <h3 className="text-sm font-medium text-red-800">Registo Rejeitado</h3>
                                             {record.updated_at && (
                                                 <span className="text-xs text-red-400">
                                                    {format(new Date(record.updated_at), "d 'de' MMM 'às' HH:mm", { locale: pt })}
                                                 </span>
                                             )}
                                        </div>
                                        <div className="mt-2 text-sm text-red-700">
                                            <p className="italic">"{record.rejeicao_comentario}"</p>
                                        </div>
                                    </div>
                                </div>
                             </motion.div>
                        )}

                        {isMonthly ? (
                            <>
                                <div>
                                    <h4 className="font-semibold flex items-center mb-2"><Info className="mr-2 h-4 w-4 text-primary" />Detalhes</h4>
                                    <p><strong>Submetido em:</strong> {dateDisplay}</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold flex items-center mb-2"><Building className="mr-2 h-4 w-4 text-primary" />Distribuição</h4>
                                    {record.allocations.map((alloc, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <span>{alloc.obra_nome}</span>
                                            <Badge variant="outline" className="flex items-center gap-1">
                                                <BadgePercent className="h-3 w-3" />
                                                {alloc.percentagem}%
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h4 className="font-semibold flex items-center mb-2"><Clock className="mr-2 h-4 w-4 text-primary" />Horário Selecionado</h4>
                                    <p><strong>Entrada:</strong> {record.hora_inicio_escolhido || '--:--'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <strong>Saída:</strong> 
                                        <span>{record.hora_fim_escolhido || '--:--'}</span>
                                        {isAutoClose && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center justify-center p-1 rounded-full bg-secondary/50 hover:bg-secondary cursor-help transition-colors">
                                                            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <p>Fecho Automático</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold flex items-center mb-2"><Building className="mr-2 h-4 w-4 text-primary" />Local</h4>
                                    <p><strong>Obra:</strong> {record.obra?.nome || "N/A"}</p>
                                    {showLocationBadge && (
                                         <p className="mt-1">
                                            <Badge variant="outline" className={locBadgeColor}>
                                                {locBadgeText} ({distance}m)
                                            </Badge>
                                         </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </motion.div>
    );
};

export default RecordHistoryItem;