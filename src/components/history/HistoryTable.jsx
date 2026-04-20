import React from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow } from '@/components/ui/table';
import RecordHistoryItem from './RecordHistoryItem';
import JustificationHistoryItem from './JustificationHistoryItem';
import CorrectionHistoryItem from './CorrectionHistoryItem';

const renderHistoryItem = (item) => {
  switch (item.type) {
    case 'record':
      return <RecordHistoryItem record={item.data} />;
    case 'justification':
      return <JustificationHistoryItem justification={item.data} />;
    case 'correction':
      return <CorrectionHistoryItem correction={item.data} />;
    default:
      return null;
  }
};

const HistoryTable = ({ history }) => {
  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Detalhes</TableHead>
            <TableHead>Local/Comentário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map(item => renderHistoryItem(item))}
        </TableBody>
      </Table>
    </div>
  );
};

export default HistoryTable;