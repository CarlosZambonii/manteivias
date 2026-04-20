import React from 'react';
import { Badge } from "@/components/ui/badge";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Wrench, Check, X, Clock, Info, Calendar, Timer, Building, MessageSquare, FileSignature, BadgePercent } from 'lucide-react';

const formatDate = (dateString, fmt = 'dd/MM/yyyy') => dateString ? format(parseISO(dateString), fmt, { locale: pt }) : '-';
const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : '--:--';

const getStatusVariant = (status) => ({ 'Aprovado': 'success', 'Rejeitado': 'destructive' }[status] || 'secondary');

const CorrectionHistoryItem = ({ correction }) => {
  const isMonthly = !!correction.mes;
  const obraDisplay = correction.obra ? `${correction.obra.id} - ${correction.obra.nome}` : 'N/A';
  
  const title = isMonthly ? 'Correção Mensal' : 'Correção de Ponto';
  const icon = isMonthly ? <FileSignature className="h-5 w-5 text-primary" /> : <Wrench className="h-5 w-5 text-primary" />;

  return (
    <AccordionItem value={`correction-${correction.id}`} className="bg-background border rounded-lg overflow-hidden">
      <AccordionTrigger className="p-3 sm:p-4 hover:no-underline">
        <div className="w-full grid grid-cols-[auto,1fr,auto] sm:grid-cols-[auto,1fr,1fr,1fr,auto] items-center gap-2 sm:gap-4 text-sm">
          <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
          
          <div className="text-left">
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{formatDate(correction.data_solicitacao)}</p>
          </div>
          
          <div className="hidden sm:block text-left text-muted-foreground">
            {isMonthly ? format(parseISO(correction.mes), 'MMMM yyyy', { locale: pt }) : formatDate(correction.data_correcao)}
          </div>

          <div className="hidden sm:block text-left text-muted-foreground truncate">
             {isMonthly ? `${correction.alocacoes?.length || 0} alocações` : obraDisplay}
          </div>
          
          <Badge variant={getStatusVariant(correction.status)} className="capitalize justify-self-end">{correction.status}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="p-4 bg-muted/50 border-t grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="md:col-span-1 space-y-2">
            <h4 className="font-semibold flex items-center"><Info className="mr-2 h-4 w-4 text-primary" />Informações</h4>
            <p><strong>Submetido em:</strong> {formatDate(correction.data_solicitacao, 'dd/MM/yyyy HH:mm')}</p>
            {correction.justificacao && (
                <p><strong>Justificação:</strong> {correction.justificacao}</p>
            )}
          </div>
          
          {isMonthly ? (
             <div className="md:col-span-2 space-y-2">
              <h4 className="font-semibold flex items-center"><Building className="mr-2 h-4 w-4 text-primary" />Distribuição por Obras</h4>
              <ul className="space-y-1">
                {(correction.alocacoes || []).map((op, index) => (
                  <li key={index} className="flex justify-between items-center bg-background p-2 rounded-md">
                    <span>{op.obra?.id} - {op.obra?.nome || 'Obra não encontrada'}</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <BadgePercent className="h-3 w-3" />
                      {op.percentagem}%
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
             <div className="md:col-span-2 space-y-2">
                <h4 className="font-semibold flex items-center"><Timer className="mr-2 h-4 w-4 text-primary" />Detalhes da Correção</h4>
                <p><strong>Dia corrigido:</strong> {formatDate(correction.data_correcao)}</p>
                <p><strong>Horas:</strong> {formatTime(correction.hora_inicio_sugerida)} - {formatTime(correction.hora_fim_sugerida)}</p>
                <p><strong>Obra:</strong> {obraDisplay}</p>
             </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default CorrectionHistoryItem;