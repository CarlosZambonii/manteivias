import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import CorrectionCard from './CorrectionCard';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const CorrectionTable = ({ corrections, onUpdateStatus }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'data_solicitacao', direction: 'descending' });

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedCorrections = useMemo(() => {
    let sortableItems = [...corrections];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        switch (sortConfig.key) {
          case 'colaborador':
            aValue = a.usuario?.nome || '';
            bValue = b.usuario?.nome || '';
            break;
          case 'obra':
            aValue = a.obra?.id || 0;
            bValue = b.obra?.id || 0;
            break;
          default:
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [corrections, sortConfig]);

  const getSortIcon = (key) => {
     if (sortConfig.key !== key) return null;
     return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

  return (
    <div className="space-y-6 px-4 py-6 bg-background rounded-lg border border-border/40 shadow-sm">
      {/* Sorting Control Header */}
      <div className="flex justify-between items-center mb-6">
         <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Lista de Correções
         </h3>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-muted-foreground hover:text-foreground">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Ordenar por: {sortConfig.key === 'colaborador' ? 'Nome' : sortConfig.key === 'data_correcao' ? 'Data' : sortConfig.key === 'obra' ? 'Obra' : 'Status'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => requestSort('colaborador')}>
                    Colaborador {getSortIcon('colaborador')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => requestSort('data_correcao')}>
                    Data {getSortIcon('data_correcao')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => requestSort('obra')}>
                    Obra {getSortIcon('obra')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => requestSort('status')}>
                    Status {getSortIcon('status')}
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>

      {sortedCorrections.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
             <div className="bg-muted/50 p-4 rounded-full w-fit mx-auto mb-4">
                <AlertCircle className="h-8 w-8 opacity-40" />
             </div>
             <p className="font-medium">Nenhuma correção encontrada.</p>
             <p className="text-sm opacity-70 mt-1">Tente ajustar os filtros de busca.</p>
          </div>
      ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             <AnimatePresence>
                 {sortedCorrections.map((correction) => (
                    <motion.div
                        key={correction.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <CorrectionCard 
                            correction={correction} 
                            onUpdateStatus={onUpdateStatus}
                            className="h-full" 
                        />
                    </motion.div>
                 ))}
             </AnimatePresence>
          </motion.div>
      )}
    </div>
  );
};

export default CorrectionTable;