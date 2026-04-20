import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdjustmentsFilter = ({ filters, onFilterChange }) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-6">
    <div className="flex-1 w-full">
      <Label htmlFor="month-filter">Mês</Label>
      <Input
        id="month-filter"
        type="month"
        value={filters.month}
        onChange={(e) => onFilterChange('month', e.target.value)}
        className="w-full mt-1.5"
      />
    </div>
    <div className="flex-1 w-full">
      <Label htmlFor="status-filter">Situação</Label>
      <Select
        value={filters.status}
        onValueChange={(value) => onFilterChange('status', value)}
      >
        <SelectTrigger id="status-filter" className="w-full mt-1.5">
          <SelectValue placeholder="Filtrar por situação..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todos">Todos</SelectItem>
          <SelectItem value="Pendente">Pendente</SelectItem>
          <SelectItem value="Aprovado">Aprovado</SelectItem>
          <SelectItem value="Rejeitado">Rejeitado</SelectItem>
          <SelectItem value="Falta de Registo">Falta de Registo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export default AdjustmentsFilter;