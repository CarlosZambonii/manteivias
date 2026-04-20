import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ChevronRight, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name[0].toUpperCase();
};

const JustificationEmployeeList = ({ employees, onSelectEmployee, isLoading, hasPending }) => {
  if (isLoading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl border border-border/50" />
            ))}
        </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-muted/10 rounded-xl border border-dashed border-border/50">
        <div className="bg-muted/50 p-4 rounded-full mb-4">
            <User className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
            {hasPending ? 'Tudo Validado!' : 'Nenhum registo encontrado'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            {hasPending 
                ? 'Não existem mais justificações pendentes para validar no momento.' 
                : 'Não foram encontrados colaboradores com justificações no histórico.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {employees.map((employee, idx) => (
        <motion.div 
            key={employee.id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
          <Card 
            onClick={() => onSelectEmployee(employee)} 
            className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200 group overflow-hidden"
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border border-border group-hover:border-primary transition-colors">
                  <AvatarImage src={employee.avatar_url} />
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {getInitials(employee.nome)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-1">
                    {employee.nome}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {employee.funcao || 'Funcionário'}
                  </p>
                  {employee.pending_count > 0 && (
                      <Badge variant="warning" className="mt-1.5 h-5 text-[10px] px-1.5 bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
                        {employee.pending_count} Pendente(s)
                      </Badge>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default JustificationEmployeeList;