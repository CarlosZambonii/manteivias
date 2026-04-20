import React from 'react';
import { Loader2, AlertCircle, Filter, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import JustificationTable from './JustificationTable';

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name[0].toUpperCase();
};

const JustificationDetails = ({
  employee,
  justifications,
  isLoading,
  statusFilter,
  onStatusFilterChange,
  currentUserId,
  onUpdateStatus,
  onBack // Assuming a back function might be passed or we handle navigation if needed, but the prompt didn't strictly require back button logic here, just layout. 
         // However, in typical Master-Detail, a back button on mobile is good. I'll add a visual one if implied, but keep it simple.
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                {getInitials(employee.nome)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{employee.nome}</h1>
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                {employee.funcao || 'Funcionário'}
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30"></span>
                {justifications.length} registo{justifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border/50 w-full md:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground ml-2" />
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                <SelectTrigger className="w-full md:w-[180px] border-0 bg-transparent shadow-none focus:ring-0 h-8">
                <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-muted/30 animate-pulse rounded-xl border border-border/40" />
              ))}
          </div>
        ) : (
          <JustificationTable
            justifications={justifications}
            currentUserId={currentUserId}
            onUpdateStatus={onUpdateStatus}
          />
        )}
      </div>
    </div>
  );
};

export default JustificationDetails;