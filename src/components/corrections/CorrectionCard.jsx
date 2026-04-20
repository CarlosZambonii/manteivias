import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, Clock, Building, Calendar, Timer, Info, MessageSquare, Briefcase } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import CorrectionActions from './CorrectionActions';
import { cn } from '@/lib/utils';

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
};

const formatDate = (dateString) => dateString ? format(parseISO(dateString), 'dd/MM/yyyy') : '-';
const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : '--:--';

const getStatusConfig = (status) => {
    switch(status) {
        case 'Aprovado': return { color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', label: 'Aprovado' };
        case 'Rejeitado': return { color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', label: 'Rejeitado' };
        default: return { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', label: 'Pendente' };
    }
};

const DetailRow = ({ icon: Icon, label, value, className }) => (
    <div className={cn("flex items-start gap-2 text-sm", className)}>
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">{label}</span>
            <span className="text-foreground">{value || '-'}</span>
        </div>
    </div>
);

const CorrectionCard = ({ correction, onUpdateStatus, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const employee = correction.usuario;
  const statusConfig = getStatusConfig(correction.status);

  return (
    <Card className={cn("overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-200 bg-card", className)}>
      <CardContent className="p-0">
        <div 
          className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Section 1: Header - User Info & Status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={employee?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(employee?.nome)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-sm text-foreground leading-tight">
                    {employee?.nome || 'Colaborador Desconhecido'}
                  </h4>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {employee?.funcao || 'Funcionário'}
                  </span>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
                 <Badge variant="outline" className={cn("capitalize px-2 py-0.5 text-xs font-medium border", statusConfig.color)}>
                    {statusConfig.label}
                 </Badge>
                 <motion.div 
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                 >
                    <ChevronDown className="h-4 w-4 text-muted-foreground/70" />
                 </motion.div>
            </div>
          </div>

          {/* Section 2: Quick Summary (Always Visible) */}
          <div className="grid grid-cols-2 gap-4 pb-2">
             <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-border/40">
                <Calendar className="h-4 w-4 text-primary/70" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Data</span>
                    <span className="text-sm font-medium">{formatDate(correction.data_correcao)}</span>
                </div>
             </div>
             <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-border/40">
                <Timer className="h-4 w-4 text-primary/70" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Horas</span>
                    <span className="text-sm font-medium">
                        {formatTime(correction.hora_inicio_sugerida)} - {formatTime(correction.hora_fim_sugerida)}
                    </span>
                </div>
             </div>
          </div>
          
        </div>

        {/* Section 3: Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="border-t border-border/50 bg-muted/10"
            >
              <div className="p-4 space-y-4">
                {/* Detailed Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow 
                        icon={Building} 
                        label="Obra / Local" 
                        value={correction.obra ? `${correction.obra.nome}` : 'N/A'} 
                    />
                    <DetailRow 
                        icon={Briefcase} 
                        label="Turno" 
                        value={correction.turno} 
                    />
                    <DetailRow 
                        icon={Info} 
                        label="Tipo de Correção" 
                        value={correction.tipo} 
                    />
                    <DetailRow 
                        icon={Clock} 
                        label="Solicitado em" 
                        value={correction.data_solicitacao ? format(parseISO(correction.data_solicitacao), 'dd/MM/yyyy HH:mm') : '-'} 
                    />
                </div>

                {correction.justificacao && (
                    <div className="bg-background rounded-md p-3 border border-border/60 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-muted-foreground uppercase">
                            <MessageSquare className="h-3 w-3" /> Justificação
                        </div>
                        <p className="text-sm text-foreground leading-relaxed italic">
                            "{correction.justificacao}"
                        </p>
                    </div>
                )}

                {/* Section 4: Actions Footer */}
                <div className="pt-2">
                    <CorrectionActions 
                        correction={correction} 
                        onUpdateStatus={onUpdateStatus} 
                    />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default CorrectionCard;