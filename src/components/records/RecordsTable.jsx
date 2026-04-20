import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Clock, Check, X, MapPin, Calendar, Timer, AlertTriangle, Building, MessageSquare, ArrowUpDown, Split, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import RecordLocationMap from '@/components/records/RecordLocationMap.jsx';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { calculateDistance } from '@/utils/calculateDistance';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TimeComparisonCard from '@/components/clock/TimeComparisonCard';

const getStatusVariant = (status) => {
  const variants = { 
    'Aprovado': 'success', 
    'Rejeitado': 'destructive',
    'Fechado Automaticamente': 'warning'
  };
  return variants[status] || 'secondary';
};

const getStatusIcon = (status) => {
  const statusIconMap = {
    'Aprovado': <CheckCircle className="mr-2 h-4 w-4" />,
    'Rejeitado': <XCircle className="mr-2 h-4 w-4" />,
    'Pendente': <Clock className="mr-2 h-4 w-4" />,
    'Fechado Automaticamente': <AlertTriangle className="mr-2 h-4 w-4" />,
  };
  return statusIconMap[status] || <Clock className="mr-2 h-4 w-4" />;
};

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('pt-PT') : '-';

const formatChosenTime = (timeString) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
};

const LocationStatus = ({ record }) => {
  let isStartOnSite = false;
  let distance = null;

  if (record.dentro_raio_500m !== null && record.dentro_raio_500m !== undefined) {
      isStartOnSite = record.dentro_raio_500m;
      distance = record.distancia_metros;
  } else {
      const worksiteCoords = record.obra ? { lat: record.obra.latitude, lon: record.obra.longitude } : null;
      const startCoords = record.lat_inicio ? { lat: record.lat_inicio, lon: record.lon_inicio } : null;
      
      if (worksiteCoords && startCoords) {
          distance = calculateDistance(startCoords.lat, startCoords.lon, worksiteCoords.lat, worksiteCoords.lon);
          isStartOnSite = distance <= 500;
      }
  }

  const badgeColor = isStartOnSite ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-orange-100 text-orange-800 hover:bg-orange-200';
  const badgeText = isStartOnSite ? 'Dentro do Local' : 'Fora do Local';
  
  if (distance === null && !record.lat_inicio) {
      return <Badge variant="outline" className="text-gray-500">Sem Localização</Badge>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
           <Badge className={`${badgeColor} border-0`}>
              {badgeText}
           </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Distância aproximada: {distance !== null ? `${distance} metros` : 'Desconhecida'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ShiftBadge = ({ turno }) => {
    let color = 'bg-gray-100 text-gray-800';
    if (turno === 'Manha') color = 'bg-blue-100 text-blue-800';
    if (turno === 'Tarde') color = 'bg-orange-100 text-orange-800';
    if (turno === 'Extra') color = 'bg-purple-100 text-purple-800';
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`${color} border-0 capitalize cursor-help`}>{turno}</Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Horários de Turno:</p>
            <ul className="text-xs list-disc pl-4 mt-1">
              <li>Extra: 00:00-08:00</li>
              <li>Manhã: 08:00-12:00</li>
              <li>Tarde: 13:00-17:00</li>
              <li>Extra: 17:00-23:30</li>
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
};

const RejectDialog = ({ open, onOpenChange, onConfirm }) => {
    const [comment, setComment] = useState('');

    const handleConfirm = () => {
        if (!comment.trim()) return;
        onConfirm(comment);
        setComment('');
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rejeitar Registo</DialogTitle>
                    <DialogDescription>
                        Por favor, adicione um comentário a justificar a rejeição deste registo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Label htmlFor="rejection-comment">Comentário (Obrigatório)</Label>
                    <Textarea 
                        id="rejection-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Ex: Horas de entrada e saída não correspondem ao esperado."
                        className="min-h-[100px]"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={!comment.trim()}>Confirmar Rejeição</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
};

const RecordsTable = ({ records, setRecords, onUpdateSuccess }) => {
  const { user, isReadOnlyAdmin } = useAuth();
  const { toast } = useToast();
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [recordToReject, setRecordToReject] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'hora_inicio_real', direction: 'descending' });
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedRecords = useMemo(() => {
    // Filter out visually cancelled records by default in validation views
    let sortableItems = [...records].filter(r => r.status_validacao !== 'Cancelado' && r.status_validacao !== 'Cancelado pela Correção');
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;
        switch (sortConfig.key) {
            case 'colaborador':
                aValue = a.usuario?.nome || '';
                bValue = b.usuario?.nome || '';
                break;
            case 'obra_id':
                aValue = a.obra?.id || 0;
                bValue = b.obra?.id || 0;
                break;
            case 'horas_escolhidas':
                aValue = a.hora_inicio_escolhido || '';
                bValue = b.hora_inicio_escolhido || '';
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
  }, [records, sortConfig]);

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const handleUpdateStatus = async (record, status, rejectionComment = '') => {
    try {
      const updateData = {
        status_validacao: status,
        validado_por: user.id,
        updated_at: new Date().toISOString()
      };

      if (status === 'Rejeitado') {
        updateData.rejeicao_comentario = rejectionComment;
      }

      const { error } = await supabase
        .from('registros_ponto')
        .update(updateData)
        .eq('id', record.id);

      if (error) throw error;

      const statusText = status === 'Aprovado' ? 'aprovado' : 'rejeitado';
      
      toast({
        variant: 'success',
        title: `Registo ${statusText}!`,
        description: `O estado do registo foi atualizado com sucesso.`,
      });

      if (onUpdateSuccess) {
        onUpdateSuccess();
      } else {
         setRecords(prevRecords => prevRecords.filter(r => r.id !== record.id));
      }

    } catch (error) {
      console.error("Error updating status:", error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: 'Não foi possível atualizar o registo.' });
    }
  };

  const openRejectDialog = (record) => {
    setRecordToReject(record);
    setIsRejectDialogOpen(true);
  };

  const confirmRejection = (comment) => {
    if (recordToReject) {
        handleUpdateStatus(recordToReject, 'Rejeitado', comment);
    }
    setIsRejectDialogOpen(false);
    setRecordToReject(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="rounded-lg border overflow-hidden hidden md:block bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead onClick={() => requestSort('colaborador')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Colaborador {renderSortArrow('colaborador')}</div></TableHead>
              <TableHead onClick={() => requestSort('obra_id')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">ID Obra {renderSortArrow('obra_id')}</div></TableHead>
              <TableHead onClick={() => requestSort('hora_inicio_real')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Data {renderSortArrow('hora_inicio_real')}</div></TableHead>
              <TableHead>Turno</TableHead>
              <TableHead onClick={() => requestSort('horas_escolhidas')} className="cursor-pointer hover:bg-muted/50 text-center"><div className="flex items-center justify-center">Horas Escolhidas {renderSortArrow('horas_escolhidas')}</div></TableHead>
              <TableHead>Local do Registo</TableHead>
              <TableHead onClick={() => requestSort('status_validacao')} className="cursor-pointer hover:bg-muted/50"><div className="flex items-center">Status {renderSortArrow('status_validacao')}</div></TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRecords.map((record) => {
              const activeCorrections = record.correcoes_ponto?.filter(c => c.status !== 'Rejeitado' && c.status !== 'Cancelado') || [];
              const hasActiveCorrections = activeCorrections.length > 0;

              return (
              <React.Fragment key={record.id}>
                <TableRow className={`${expandedRows.has(record.id) ? "bg-muted/50" : ""} ${hasActiveCorrections ? 'bg-yellow-50/10' : ''}`}>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="p-0 h-6 w-6" onClick={() => toggleRow(record.id)}>
                       {expandedRows.has(record.id) ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{record.usuario?.nome || 'Desconhecido'}</TableCell>
                  <TableCell>{record.obra?.id || 'N/A'}</TableCell>
                  <TableCell>{formatDate(record.hora_inicio_real)}</TableCell>
                  <TableCell><ShiftBadge turno={record.turno} /></TableCell>
                  <TableCell className="text-center font-mono">
                    {formatChosenTime(record.hora_inicio_escolhido)} - {formatChosenTime(record.hora_fim_escolhido)}
                  </TableCell>
                  <TableCell>
                    <LocationStatus record={record} />
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-1">
                          <Badge variant={getStatusVariant(record.status_validacao)} className="capitalize">
                            {getStatusIcon(record.status_validacao)}
                            {record.status_validacao || 'Pendente'}
                          </Badge>
                          {record.status_validacao === 'Rejeitado' && record.rejeicao_comentario && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle className="flex items-center text-destructive"><XCircle className="mr-2 h-5 w-5"/> Registo Rejeitado</DialogTitle></DialogHeader>
                                <div className="bg-red-50 p-4 rounded-md border border-red-100">
                                    <Label className="text-red-900 font-semibold mb-2 block">Motivo da Rejeição:</Label>
                                    <p className="text-red-800 italic">{record.rejeicao_comentario}</p>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                        {hasActiveCorrections && (
                            <Badge variant="warning" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-0 whitespace-nowrap text-[10px] px-1.5 py-0" title="Tem correções pendentes ou aprovadas">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Em Correção
                            </Badge>
                        )}
                      </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="outline" className="h-8 w-8">
                            <MapPin className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Localização do Registo</DialogTitle>
                          </DialogHeader>
                          <RecordLocationMap record={record} />
                        </DialogContent>
                      </Dialog>
                      {record.status_validacao !== 'Aprovado' && (
                        <Button 
                            onClick={() => handleUpdateStatus(record, 'Aprovado')} 
                            size="icon" 
                            className="bg-green-600 hover:bg-green-700 h-8 w-8" 
                            disabled={isReadOnlyAdmin || hasActiveCorrections}
                            title={hasActiveCorrections ? 'Bloqueado devido a correção pendente/aprovada' : 'Aprovar'}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {record.status_validacao !== 'Rejeitado' && (
                        <Button 
                            onClick={() => openRejectDialog(record)} 
                            size="icon" 
                            variant="destructive" 
                            className="h-8 w-8" 
                            disabled={isReadOnlyAdmin || hasActiveCorrections}
                            title={hasActiveCorrections ? 'Bloqueado devido a correção pendente/aprovada' : 'Rejeitar'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                <AnimatePresence>
                  {expandedRows.has(record.id) && (
                    <TableRow className="bg-muted/20 border-b-0 hover:bg-muted/20">
                      <TableCell colSpan={9} className="p-4 overflow-hidden">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="grid grid-cols-2 gap-4 max-w-4xl">
                            <TimeComparisonCard 
                              compact 
                              actualDate={record.hora_inicio_real} 
                              selectedTimeStr={formatChosenTime(record.hora_inicio_escolhido)}
                              title="Entrada"
                            />
                            {record.hora_fim_real && record.hora_fim_escolhido ? (
                              <TimeComparisonCard 
                                compact 
                                actualDate={record.hora_fim_real} 
                                selectedTimeStr={formatChosenTime(record.hora_fim_escolhido)}
                                title="Saída"
                              />
                            ) : (
                              <div className="flex items-center justify-center border rounded-lg p-3 text-muted-foreground bg-muted/50 text-sm">
                                Sem registo de saída
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </AnimatePresence>
              </React.Fragment>
            )})}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {sortedRecords.map((record) => {
          const activeCorrections = record.correcoes_ponto?.filter(c => c.status !== 'Rejeitado' && c.status !== 'Cancelado') || [];
          const hasActiveCorrections = activeCorrections.length > 0;

          return (
          <Card key={record.id} className={`w-full ${hasActiveCorrections ? 'border-yellow-300' : ''}`}>
            <CardHeader className="p-3">
              <CardTitle className="flex justify-between items-start text-sm">
                <span className="font-bold">{record.usuario?.nome || 'Desconhecido'}</span>
                 <Badge variant={getStatusVariant(record.status_validacao)} className="capitalize text-xs whitespace-nowrap">
                    {getStatusIcon(record.status_validacao)}
                    {record.status_validacao || 'Pendente'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center"><Building className="h-3 w-3 mr-2 text-primary" /> Obra ID: {record.obra?.id || 'N/A'}</div>
              <div className="flex items-center"><Calendar className="h-3 w-3 mr-2 text-primary" /> Data: {formatDate(record.hora_inicio_real)}</div>
              <div className="flex items-center"><Split className="h-3 w-3 mr-2 text-primary" /> Turno: <ShiftBadge turno={record.turno} /></div>
              <div className="flex items-center"><Timer className="h-3 w-3 mr-2 text-primary" /> Horas: {formatChosenTime(record.hora_inicio_escolhido)} - {formatChosenTime(record.hora_fim_escolhido)}</div>
              <div className="flex items-start"><MapPin className="h-3 w-3 mr-2 text-primary mt-0.5" /> <LocationStatus record={record} /></div>
              
              {hasActiveCorrections && (
                  <div className="text-xs text-yellow-800 mt-2 bg-yellow-100 p-2 rounded flex items-start font-medium">
                      <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Não é possível processar - tem correções pendentes ou aprovadas.</span>
                  </div>
              )}

              <div className="pt-2 border-t mt-2">
                <div className="mb-2 font-semibold text-foreground">Comparação de Horários</div>
                <TimeComparisonCard 
                  compact 
                  actualDate={record.hora_inicio_real} 
                  selectedTimeStr={formatChosenTime(record.hora_inicio_escolhido)}
                />
                {record.hora_fim_real && record.hora_fim_escolhido && (
                  <div className="mt-2">
                    <TimeComparisonCard 
                      compact 
                      actualDate={record.hora_fim_real} 
                      selectedTimeStr={formatChosenTime(record.hora_fim_escolhido)}
                    />
                  </div>
                )}
              </div>

              {record.status_validacao === 'Rejeitado' && record.rejeicao_comentario && (
                <div className="flex items-start text-red-500 mt-2 p-2 bg-red-50 rounded border border-red-100"><MessageSquare className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" /> <span className="italic">{record.rejeicao_comentario}</span></div>
              )}
            </CardContent>
            <CardFooter className="p-3 pt-0 flex justify-end gap-2 border-t mt-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="icon" variant="outline" className="h-8 w-8 mt-2">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Localização do Registo</DialogTitle>
                  </DialogHeader>
                  <RecordLocationMap record={record} />
                </DialogContent>
              </Dialog>
              {record.status_validacao !== 'Aprovado' && (
                <Button 
                    onClick={() => handleUpdateStatus(record, 'Aprovado')} 
                    size="icon" 
                    className="bg-green-600 hover:bg-green-700 h-8 w-8 mt-2" 
                    disabled={isReadOnlyAdmin || hasActiveCorrections}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              {record.status_validacao !== 'Rejeitado' && (
                 <Button 
                    onClick={() => openRejectDialog(record)} 
                    size="icon" 
                    variant="destructive" 
                    className="h-8 w-8 mt-2" 
                    disabled={isReadOnlyAdmin || hasActiveCorrections}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        )})}
      </div>
       <RejectDialog 
            open={isRejectDialogOpen} 
            onOpenChange={setIsRejectDialogOpen} 
            onConfirm={confirmRejection} 
        />
    </motion.div>
  );
};

export default RecordsTable;