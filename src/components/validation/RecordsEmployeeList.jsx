import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, User, Clock, AlertTriangle, CheckCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO, isSameDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import RecordValidationCard from './RecordValidationCard';

// Helper to group records by User -> Date
const groupRecords = (records, searchFilter, shiftFilter) => {
  const grouped = {};

  records.forEach(record => {
    // 1. Filter by Search (Employee Name)
    const employeeName = record.usuario?.nome || 'Desconhecido';
    if (searchFilter && !employeeName.toLowerCase().includes(searchFilter.toLowerCase())) {
        return;
    }

    // 2. Filter by Shift
    if (shiftFilter !== 'all' && record.turno !== shiftFilter) {
        return;
    }

    const userId = record.usuario_id;
    if (!grouped[userId]) {
        grouped[userId] = {
            user: record.usuario,
            records: [],
            pendingCount: 0
        };
    }

    grouped[userId].records.push(record);
    if (record.status_validacao === 'Pendente' || record.status_validacao === 'Fechado Automaticamente') {
        grouped[userId].pendingCount++;
    }
  });

  return Object.values(grouped).sort((a, b) => {
     // Sort users by pending count (desc) then name (asc)
     if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
     return (a.user?.nome || '').localeCompare(b.user?.nome || '');
  });
};

const EmployeeRow = ({ group, onUpdateRecord, onDeleteRecord, onBulkApprove }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group user records by Date
  const recordsByDate = useMemo(() => {
     const byDate = {};
     group.records.forEach(r => {
         const dateKey = format(parseISO(r.hora_inicio_real), 'yyyy-MM-dd');
         if (!byDate[dateKey]) byDate[dateKey] = [];
         byDate[dateKey].push(r);
     });
     
     // Sort dates descending
     return Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]));
  }, [group.records]);

  return (
    <Card className="overflow-hidden border-l-4 border-l-primary/20 hover:border-l-primary transition-all">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
            <Avatar>
                <AvatarImage src={group.user?.avatar_url} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div>
                <h3 className="font-semibold text-lg">{group.user?.nome || 'Colaborador Desconhecido'}</h3>
                <p className="text-xs text-muted-foreground">{group.records.length} registo(s) encontrado(s)</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
            {group.pendingCount > 0 && (
              <>
                <Badge variant="warning" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0">
                    {group.pendingCount} Pendente(s)
                </Badge>
                {onBulkApprove && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      const pending = group.records.filter(
                        r => r.status_validacao === 'Pendente' || r.status_validacao === 'Fechado Automaticamente'
                      );
                      onBulkApprove(pending);
                    }}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Aprovar todos
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                <div className="p-4 space-y-6">
                    {recordsByDate.map(([dateKey, records]) => (
                        <div key={dateKey} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <h4 className="font-medium text-sm text-muted-foreground capitalize">
                                    {format(parseISO(dateKey), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                                </h4>
                                <div className="h-px bg-border flex-grow ml-2" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                {records
                                  .sort((a, b) => new Date(b.hora_inicio_real) - new Date(a.hora_inicio_real))
                                  .map(record => (
                                    <RecordValidationCard 
                                        key={record.id} 
                                        record={record} 
                                        onUpdateStatus={onUpdateRecord}
                                        onDeleteSuccess={onDeleteRecord}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

const RecordsEmployeeList = ({ records, searchFilter, shiftFilter, onUpdateRecord, onDeleteRecord, onBulkApprove }) => {
  const groupedData = useMemo(() =>
    groupRecords(records, searchFilter, shiftFilter),
  [records, searchFilter, shiftFilter]);

  if (groupedData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <User className="h-12 w-12 mb-2 opacity-20" />
            <p>Nenhum colaborador encontrado com os filtros atuais.</p>
        </div>
      );
  }

  return (
    <div className="space-y-3">
      {groupedData.map(group => (
        <EmployeeRow
            key={group.user?.id || 'unknown'}
            group={group}
            onUpdateRecord={onUpdateRecord}
            onDeleteRecord={onDeleteRecord}
            onBulkApprove={onBulkApprove}
        />
      ))}
    </div>
  );
};

export default RecordsEmployeeList;