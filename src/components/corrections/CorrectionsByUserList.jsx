import React, { useMemo } from 'react';
import CorrectionsByUserCard from './CorrectionsByUserCard';
import { AlertCircle, User } from 'lucide-react';

const groupCorrectionsByUser = (corrections, searchQuery) => {
  const grouped = {};

  corrections.forEach(correction => {
    // Filter by Search (Employee Name)
    const employeeName = correction.usuario?.nome || 'Desconhecido';
    if (searchQuery && !employeeName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
    }

    const userId = correction.usuario_id;
    if (!grouped[userId]) {
        grouped[userId] = {
            user: correction.usuario,
            corrections: [],
            pendingCount: 0
        };
    }

    grouped[userId].corrections.push(correction);
    if (correction.status === 'Pendente') {
        grouped[userId].pendingCount++;
    }
  });

  // Convert to array and sort
  return Object.values(grouped).sort((a, b) => {
     // 1. Users with pending corrections first
     if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
     if (a.pendingCount === 0 && b.pendingCount > 0) return 1;
     
     // 2. Sort by count descending
     if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;

     // 3. Alphabetical
     return (a.user?.nome || '').localeCompare(b.user?.nome || '');
  });
};

const CorrectionsByUserList = ({ corrections, searchQuery, onUpdateStatus }) => {
  const groupedData = useMemo(() => 
    groupCorrectionsByUser(corrections, searchQuery), 
  [corrections, searchQuery]);

  if (groupedData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/50">
            <User className="h-12 w-12 mb-2 opacity-20" />
            <h3 className="text-lg font-medium text-foreground">Nenhum colaborador encontrado</h3>
            <p className="text-sm">Tente ajustar os filtros ou a pesquisa.</p>
        </div>
      );
  }

  return (
    <div className="space-y-4">
      {groupedData.map(group => (
        <CorrectionsByUserCard 
            key={group.user?.id || 'unknown'} 
            group={group} 
            onUpdateStatus={onUpdateStatus}
        />
      ))}
    </div>
  );
};

export default CorrectionsByUserList;