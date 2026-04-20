import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const getInitials = (name) => {
  if (!name) return '?';
  const names = name.split(' ');
  return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name[0].toUpperCase();
};

const EmployeeList = ({ employees, isLoading, onSelectEmployee }) => {
  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Nenhum colaborador encontrado</h3>
        <p className="text-muted-foreground text-sm">Não existem registos de ponto de colaboradores nesta obra.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {employees.map((employee, index) => (
        <motion.div
          key={employee.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.03 }}
        >
          <button
            onClick={() => onSelectEmployee(employee)}
            className="w-full text-left bg-secondary p-4 rounded-lg shadow-md hover:bg-secondary/80 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(employee.nome)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-foreground">{employee.nome}</p>
                <p className="text-sm text-muted-foreground">{employee.funcao}</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </button>
        </motion.div>
      ))}
    </div>
  );
};

export default EmployeeList;