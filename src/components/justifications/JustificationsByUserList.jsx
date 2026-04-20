import React, { useMemo } from 'react';
import JustificationsByUserCard from './JustificationsByUserCard';
import { Search, Inbox, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const groupJustificationsByUser = (justifications, searchQuery) => {
  const grouped = {};

  justifications.forEach(justification => {
    // Determine user object
    const user = justification.usuarios || justification.usuario;
    const userId = justification.usuario_id;
    const employeeName = user?.nome || 'Desconhecido';

    // Filter by Search (Employee Name)
    if (searchQuery && !employeeName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
    }

    if (!grouped[userId]) {
        grouped[userId] = {
            user: user,
            justifications: [],
            pendingCount: 0
        };
    }

    grouped[userId].justifications.push(justification);
    if (justification.status_validacao === 'Pendente') {
        grouped[userId].pendingCount++;
    }
  });

  // Sort groups: Pending first (desc count), then name (asc)
  return Object.values(grouped).sort((a, b) => {
     if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
     if (a.pendingCount === 0 && b.pendingCount > 0) return 1;
     if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
     return (a.user?.nome || '').localeCompare(b.user?.nome || '');
  });
};

const JustificationsByUserList = ({ justifications, searchQuery = '', onUpdateStatus, isLoading }) => {
  const groupedData = useMemo(() => 
    groupJustificationsByUser(justifications, searchQuery), 
  [justifications, searchQuery]);

  if (isLoading) {
      return (
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-24 w-full bg-muted/20 animate-pulse rounded-xl border border-border/40" />
            ))}
        </div>
      );
  }

  if (groupedData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-border/50 min-h-[300px]">
            {searchQuery ? (
                 <>
                    <Search className="h-12 w-12 mb-3 opacity-20" />
                    <h3 className="text-lg font-medium text-foreground">Sem resultados</h3>
                    <p className="text-sm max-w-xs mx-auto mt-1">Nenhum colaborador encontrado para "{searchQuery}".</p>
                 </>
            ) : (
                 <>
                    <User className="h-12 w-12 mb-3 opacity-20" />
                    <h3 className="text-lg font-medium text-foreground">Sem justificações</h3>
                    <p className="text-sm max-w-xs mx-auto mt-1">Não há justificações para validar com os filtros atuais.</p>
                 </>
            )}
        </div>
      );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {groupedData.map(group => (
            <motion.div
                key={group.user?.id || 'unknown'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
            >
                <JustificationsByUserCard 
                    group={group} 
                    onUpdateStatus={onUpdateStatus}
                />
            </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default JustificationsByUserList;