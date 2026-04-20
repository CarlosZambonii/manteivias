import React from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, Edit, PlusCircle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useOfflineManager } from '@/contexts/OfflineManager';

const getStatusVariant = (status) => {
  if (!status) return 'outline';
  return { 'Aprovado': 'success', 'Rejeitado': 'destructive' }[status] || 'secondary';
};

const getStatusIcon = (status) => {
  if (!status) return null;
  const components = {
    'Aprovado': <CheckCircle className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />,
    'Rejeitado': <XCircle className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />,
    'Pendente': <Clock className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
  };
  return components[status] || components['Pendente'];
};

const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : '--:--';

const AdjustmentsTable = ({ records, onEdit }) => {
  const { isOnline } = useOfflineManager();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Desktop Table View */}
        <div className="rounded-lg border overflow-hidden hidden md:block">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead className="text-center">Horas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {records.map((record) => (
                    <TableRow key={record.id} className={record.type === 'missing' ? 'bg-muted/20' : ''}>
                    <TableCell className="font-medium">
                        {format(parseISO(record.hora_inicio_real || record.date), "d 'de' MMMM, yyyy", { locale: pt })}
                    </TableCell>
                    <TableCell>{record.obra?.nome || <span className="text-muted-foreground">N/A</span>}</TableCell>
                    <TableCell className="text-center font-mono">
                        {record.type === 'record' ? `${formatTime(record.hora_inicio_escolhido)} - ${formatTime(record.hora_fim_escolhido)}` : <span className="text-muted-foreground">Sem Registo</span>}
                    </TableCell>
                    <TableCell>
                        {record.status_validacao ? (
                        <Badge variant={getStatusVariant(record.status_validacao)} className="capitalize whitespace-nowrap">
                            {getStatusIcon(record.status_validacao)}
                            {record.status_validacao}
                        </Badge>
                        ) : (
                        <Badge variant="outline">Não Registado</Badge>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                        <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                            <Button 
                              onClick={() => onEdit(record)} 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              disabled={!isOnline && record.type !== 'record'} // Disable new actions if offline, edit existing might be OK if handled
                            >
                                {record.type === 'record' ? <Edit className="h-4 w-4" /> : <PlusCircle className="h-4 w-4 text-primary" />}
                            </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p>
                                {record.type === 'record' ? 'Editar Registo' : 'Adicionar Registo'}
                                {!isOnline && ' (Offline)'}
                            </p>
                            </TooltipContent>
                        </Tooltip>
                        </TooltipProvider>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
            {records.map((record) => (
                <Card key={record.id} className={record.type === 'missing' ? 'bg-muted/20' : ''}>
                    <CardHeader className="p-4 pb-2">
                         <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-semibold">
                                {format(parseISO(record.hora_inicio_real || record.date), "d 'de' MMMM, yyyy", { locale: pt })}
                            </CardTitle>
                             {record.status_validacao ? (
                                <Badge variant={getStatusVariant(record.status_validacao)} className="capitalize whitespace-nowrap text-xs">
                                    {getStatusIcon(record.status_validacao)}
                                    {record.status_validacao}
                                </Badge>
                                ) : (
                                <Badge variant="outline" className="text-xs">Não Registado</Badge>
                                )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 text-sm text-muted-foreground space-y-2">
                        <div className="flex justify-between">
                            <span className="font-medium">Obra:</span>
                            <span>{record.obra?.nome || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-medium">Horário:</span>
                            <span className="font-mono text-foreground">
                                {record.type === 'record' ? `${formatTime(record.hora_inicio_escolhido)} - ${formatTime(record.hora_fim_escolhido)}` : 'Sem Registo'}
                            </span>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-end">
                        <Button 
                          onClick={() => onEdit(record)} 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          disabled={!isOnline && record.type !== 'record'}
                        >
                            {record.type === 'record' ? <><Edit className="mr-2 h-3 w-3" /> Editar Registo</> : <><PlusCircle className="mr-2 h-3 w-3" /> Adicionar Registo</>}
                            {!isOnline && <WifiOff className="ml-2 h-3 w-3" />}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </motion.div>
  );
};

export default AdjustmentsTable;