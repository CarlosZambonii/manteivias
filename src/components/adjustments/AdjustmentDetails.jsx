import React from 'react';
import { format } from 'date-fns';

const AdjustmentDetails = ({ adjustment }) => {
  if (!adjustment) {
    return <p className="text-muted-foreground">Selecione um ajuste para ver os detalhes.</p>;
  }

  const {
    data_correcao,
    hora_inicio_sugerida,
    hora_fim_sugerida,
    obra,
    turno,
    tipo,
    status
  } = adjustment;

  return (
    <div className="space-y-4">
      <div>
        <p className="font-semibold text-lg">{tipo === 'NOVO' ? 'Novo Registo' : 'Correção de Registo'}</p>
        <p className="text-sm text-muted-foreground">{format(new Date(data_correcao), 'dd/MM/yyyy')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Início Sugerido</p>
          <p className="font-semibold break-all">{hora_inicio_sugerida}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Fim Sugerido</p>
          <p className="font-semibold break-all">{hora_fim_sugerida || 'N/A'}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm font-medium text-muted-foreground">Obra</p>
          <p className="font-semibold break-words">{obra?.nome || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Turno</p>
          <p className="font-semibold">{turno || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Estado</p>
          <p className="font-semibold">{status}</p>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentDetails;