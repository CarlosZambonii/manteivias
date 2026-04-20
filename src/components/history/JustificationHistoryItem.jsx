import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, CheckCircle2, AlertCircle, Clock10 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const JustificationHistoryItem = ({ justification }) => {
  const getStatusVariant = (status) => {
    switch (status) {
      case 'Aprovado':
        return 'success';
      case 'Rejeitado':
        return 'destructive';
      case 'Pendente':
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Aprovado':
        return <CheckCircle2 className="mr-2 h-4 w-4" />;
      case 'Rejeitado':
        return <AlertCircle className="mr-2 h-4 w-4" />;
      case 'Pendente':
      default:
        return <Clock10 className="mr-2 h-4 w-4" />;
    }
  };

  const formattedDate = justification.data_envio ? format(parseISO(justification.data_envio), 'PPP', { locale: pt }) : 'N/A';
  const type = justification.tipos_justificação?.nome || 'Não especificado';

  const formatDays = (days) => {
    if (!days || days.length === 0) return 'Nenhuma data';
    if (days.length === 1) return format(parseISO(days[0]), 'dd/MM/yyyy');
    return `${days.length} dias`;
  };

  return (
    <>
      <TableRow className="hidden sm:table-row">
        <TableCell><Badge variant="outline">Justificação</Badge></TableCell>
        <TableCell>{formattedDate}</TableCell>
        <TableCell>{type}</TableCell>
        <TableCell>{formatDays(justification.dias)}</TableCell>
        <TableCell><Badge variant={getStatusVariant(justification.status_validacao)}>{justification.status_validacao}</Badge></TableCell>
      </TableRow>

      <Card className="sm:hidden bg-card/80 backdrop-blur-sm">
        <CardHeader className="p-3">
            <CardTitle className="flex items-center justify-between text-sm">
                <span>Justificação</span>
                 <Badge variant={getStatusVariant(justification.status_validacao)} className="capitalize text-xs px-2 py-0.5">
                    {getStatusIcon(justification.status_validacao)}
                    {justification.status_validacao}
                </Badge>
            </CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-xs space-y-2">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Enviado em: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Tipo: {type}</span>
            </div>
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Dias: {formatDays(justification.dias)}</span>
            </div>
        </CardContent>
      </Card>
    </>
  );
};

export default JustificationHistoryItem;