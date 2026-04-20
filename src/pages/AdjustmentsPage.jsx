import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Minus, Send, CalendarDays, ChevronLeft, PenLine as FilePenLine, Edit } from 'lucide-react';
import { format, parseISO, startOfMonth, subMonths, addMonths, endOfMonth, eachDayOfInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Combobox } from '@/components/ui/combobox';
import AdjustmentModal from '@/components/adjustments/AdjustmentModal';

const AdjustmentsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const userRecordType = user?.tipo_registo?.toLowerCase();
    
    const getTabs = () => {
        if (userRecordType === 'diario') {
            return (
                <>
                    <TabsTrigger value="daily">Corrigir Faltas</TabsTrigger>
                    <TabsTrigger value="history">Registos Diários</TabsTrigger>
                </>
            );
        }
        return <TabsTrigger value="monthly">Registos Mensais</TabsTrigger>;
    };
    
    const getDefaultTab = () => {
        if (userRecordType === 'mensal') return 'monthly';
        return 'daily';
    };

    return (
        <>
            <Helmet>
                <title>Minhas Correções</title>
                <meta name="description" content="Corrija os seus registos de ponto diários ou mensais." />
            </Helmet>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
                 <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:pl-2 transition-all">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Minhas Correções</h1>

                <Tabs defaultValue={getDefaultTab()} className="w-full">
                    <TabsList className={`grid w-full h-auto ${userRecordType === 'diario' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {getTabs()}
                    </TabsList>

                    {userRecordType === 'diario' && (
                      <>
                        <TabsContent value="daily"><DailyAbsenceTab /></TabsContent>
                        <TabsContent value="history"><DailyRecordsTab /></TabsContent>
                      </>
                    )}
                     {userRecordType === 'mensal' && (
                        <TabsContent value="monthly"><MonthlyCorrectionTab /></TabsContent>
                     )}
                </Tabs>
            </div>
        </>
    );
};

const MonthNavigator = ({ month, setMonth }) => (
    <div className="flex items-center gap-2 w-full justify-between sm:justify-start sm:w-auto mt-4 sm:mt-0">
        <Button variant="outline" size="icon" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-semibold flex-1 text-center sm:w-36 sm:flex-none capitalize">
            {format(month, 'MMMM yyyy', { locale: pt })}
        </span>
        <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4 rotate-180" />
        </Button>
    </div>
);

const DailyAbsenceTab = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [month, setMonth] = useState(new Date());
    const [absences, setAbsences] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchAbsences = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_user_daily_status', {
                p_user_id: user.id,
                p_month: format(month, 'yyyy-MM-dd')
            });
            if (error) throw error;
            const filteredAbsences = data.filter(d => d.status === 'Falta de Registo');
            setAbsences(filteredAbsences);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as faltas.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, month, toast]);

    useEffect(() => {
        fetchAbsences();
    }, [fetchAbsences]);
    
    const handleEdit = (absence) => {
        setSelectedItem({ ...absence, type: 'absence' });
        setIsModalOpen(true);
    };

    return (
        <Card className="mt-4">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <CardTitle>Corrigir Faltas</CardTitle>
                <MonthNavigator month={month} setMonth={setMonth} />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : absences.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">Nenhuma falta encontrada para este mês.</p>
                ) : (
                    <>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Dia da Semana</TableHead>
                                    <TableHead className="text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {absences.map(absence => (
                                    <TableRow key={absence.date}>
                                        <TableCell>{format(parseISO(absence.date), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="capitalize">{format(parseISO(absence.date), 'EEEE', { locale: pt })}</TableCell>
                                        <TableCell className="text-right">
                                            <Button onClick={() => handleEdit(absence)}>
                                                <Plus className="mr-2 h-4 w-4" /> Corrigir
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                         {absences.map(absence => (
                             <Card key={absence.date} className="bg-background">
                                <CardContent className="p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-lg">{format(parseISO(absence.date), 'dd/MM/yyyy')}</span>
                                        <span className="text-sm text-muted-foreground capitalize">{format(parseISO(absence.date), 'EEEE', { locale: pt })}</span>
                                    </div>
                                    <Button onClick={() => handleEdit(absence)} className="w-full mt-2 min-h-[44px]">
                                        <Plus className="mr-2 h-4 w-4" /> Justificar Falta
                                    </Button>
                                </CardContent>
                             </Card>
                         ))}
                    </div>
                    </>
                )}
            </CardContent>
            {selectedItem && (
                 <AdjustmentModal
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    item={selectedItem}
                    onSave={() => {
                        setIsModalOpen(false);
                        fetchAbsences();
                    }}
                />
            )}
        </Card>
    );
};

const DailyRecordsTab = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [month, setMonth] = useState(new Date());
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchRecords = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_user_daily_status', {
                p_user_id: user.id,
                p_month: format(month, 'yyyy-MM-dd')
            });
            if (error) throw error;
            const filteredRecords = data.filter(d => d.type === 'record');
            setRecords(filteredRecords);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os registos.' });
        } finally {
            setIsLoading(false);
        }
    }, [user, month, toast]);
    
    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleEdit = (record) => {
        setSelectedItem({ ...record, type: 'record'});
        setIsModalOpen(true);
    };
    
    return (
        <Card className="mt-4">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <CardTitle>Registos Diários</CardTitle>
                <MonthNavigator month={month} setMonth={setMonth} />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : records.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">Nenhum registo encontrado para este mês.</p>
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Turno</TableHead>
                                        <TableHead>Horas</TableHead>
                                        <TableHead>Obra</TableHead>
                                        <TableHead className="text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.map(record => (
                                        <TableRow key={record.id}>
                                            <TableCell>{format(parseISO(record.date), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{record.shift}</TableCell>
                                            <TableCell>{record.start_time?.substring(0,5)} - {record.end_time?.substring(0,5)}</TableCell>
                                            <TableCell>{record.worksite_name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" onClick={() => handleEdit(record)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Corrigir
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {/* Mobile View */}
                        <div className="md:hidden grid grid-cols-1 gap-4">
                            {records.map(record => (
                                <Card key={record.id} className="bg-background">
                                    <CardContent className="p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-lg">{format(parseISO(record.date), 'dd/MM/yyyy')}</span>
                                            <Badge variant="outline">{record.shift}</Badge>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Horas:</span>
                                                <span className="font-mono">{record.start_time?.substring(0,5)} - {record.end_time?.substring(0,5)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Obra:</span>
                                                <span className="text-right truncate max-w-[200px]">{record.worksite_name}</span>
                                            </div>
                                        </div>
                                        <Button variant="outline" onClick={() => handleEdit(record)} className="w-full mt-1 min-h-[44px]">
                                            <Edit className="mr-2 h-4 w-4" /> Corrigir Registo
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
             {selectedItem && (
                 <AdjustmentModal
                    isOpen={isModalOpen}
                    setIsOpen={setIsModalOpen}
                    item={selectedItem}
                    onSave={() => {
                        setIsModalOpen(false);
                        fetchRecords();
                    }}
                />
            )}
        </Card>
    );
};


const MonthlyCorrectionTab = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [month, setMonth] = useState(new Date());
    const [worksites, setWorksites] = useState([]);
    const [monthlyRecord, setMonthlyRecord] = useState(null);
    const [currentAllocations, setCurrentAllocations] = useState([]);
    const [correctionAllocations, setCorrectionAllocations] = useState([{ obra_id: '', percentagem: 100 }]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchWorkSites = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('obras').select('id, nome');
            if (error) throw error;
            setWorksites(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar obras', description: error.message });
        }
    }, [toast]);

    const fetchMonthlyRecord = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
            const { data: records, error } = await supabase
                .from('registros_mensais')
                .select(`id, mes, status_validacao, obra_id, percentagem, obra:obras(id, nome)`)
                .eq('usuario_id', user.id)
                .eq('mes', monthStart);

            if (error) throw error;

            if (records && records.length > 0) {
                const allocations = records.map(r => ({
                    obra_id: r.obra_id,
                    percentagem: r.percentagem,
                    obra_nome: r.obra.nome
                }));
                setMonthlyRecord({ mes: records[0].mes, status: records[0].status_validacao });
                setCurrentAllocations(allocations);
                setCorrectionAllocations(JSON.parse(JSON.stringify(allocations)).map(a => ({...a, obra_id: String(a.obra_id)})));
            } else {
                setMonthlyRecord(null);
                setCurrentAllocations([]);
                setCorrectionAllocations([{ obra_id: '', percentagem: 100 }]);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar registo mensal', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, month, toast]);

    useEffect(() => {
        fetchWorkSites();
    }, [fetchWorkSites]);

    useEffect(() => {
        fetchMonthlyRecord();
    }, [month, fetchMonthlyRecord]);

    const handleAllocationChange = (index, field, value) => {
        const newAllocations = [...correctionAllocations];
        newAllocations[index][field] = value;
        setCorrectionAllocations(newAllocations);
    };

    const addAllocation = () => setCorrectionAllocations([...correctionAllocations, { obra_id: '', percentagem: 0 }]);
    const removeAllocation = (index) => setCorrectionAllocations(correctionAllocations.filter((_, i) => i !== index));

    const totalPercentage = useMemo(() => correctionAllocations.reduce((sum, alloc) => sum + (Number(alloc.percentagem) || 0), 0), [correctionAllocations]);

    const handleSubmit = async () => {
        if (totalPercentage !== 100) {
            toast({ variant: 'destructive', title: 'Percentagem inválida', description: 'A soma das percentagens deve ser exatamente 100%.' });
            return;
        }
        if (correctionAllocations.some(a => !a.obra_id)) {
            toast({ variant: 'destructive', title: 'Obra não selecionada', description: 'Por favor, selecione uma obra para cada alocação.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const mes = format(startOfMonth(month), 'yyyy-MM-dd');

            const { data: existingCorrection, error: checkError } = await supabase
                .from('correcoes_mensais')
                .select('id')
                .eq('usuario_id', user.id)
                .eq('mes', mes)
                .eq('status', 'Pendente')
                .maybeSingle();

            if (checkError) throw checkError;
            if (existingCorrection) {
                toast({ variant: 'destructive', title: 'Correção já pendente', description: 'Já existe uma correção pendente para este mês.' });
                setIsSubmitting(false);
                return;
            }

            const { data: correctionData, error: correctionError } = await supabase
                .from('correcoes_mensais')
                .insert({
                    usuario_id: user.id,
                    mes: mes,
                    data_solicitacao: new Date().toISOString(),
                    status: 'Pendente',
                })
                .select()
                .single();

            if (correctionError) throw correctionError;

            const allocationData = correctionAllocations.map(a => ({
                correcao_mensal_id: correctionData.id,
                obra_id: a.obra_id,
                percentagem: a.percentagem,
            }));
            
            const { error: allocationError } = await supabase
                .from('correcoes_mensais_alocacoes')
                .insert(allocationData);
            
            if (allocationError) throw allocationError;
            
            toast({ variant: 'success', title: 'Pedido de Correção Enviado!', description: 'O seu pedido de correção foi enviado para validação.' });
            setDialogOpen(false);
            fetchMonthlyRecord();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao enviar correção', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const monthOptions = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));

    return (
        <Card className="shadow-lg mt-4">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="text-xl">Registo Mensal</CardTitle>
                        <CardDescription>Ajuste a sua alocação de tempo por obra para o mês.</CardDescription>
                    </div>
                    <Select value={format(month, 'yyyy-MM')} onValueChange={(val) => setMonth(parseISO(`${val}-15`))}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map(m => (
                                <SelectItem key={format(m, 'yyyy-MM')} value={format(m, 'yyyy-MM')}>
                                    {format(m, 'MMMM yyyy', { locale: pt })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div> :
                    monthlyRecord ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted">
                                <h3 className="font-semibold mb-2">Registo Atual para {format(month, 'MMMM yyyy', { locale: pt })}</h3>
                                <ul className="space-y-2">
                                {currentAllocations.map((alloc, index) => (
                                    <li key={index} className="flex justify-between items-center text-sm">
                                        <span>{alloc.obra_nome || 'Obra não encontrada'}</span>
                                        <span className="font-bold">{alloc.percentagem}%</span>
                                    </li>
                                ))}
                                </ul>
                                <p className="text-sm text-muted-foreground mt-2">Status: <span className="font-semibold">{monthlyRecord.status}</span></p>
                            </div>
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full min-h-[44px]"><FilePenLine className="mr-2 h-4 w-4"/>Solicitar Correção</Button>
                                </DialogTrigger>
                                <DialogContent className="w-[95vw] max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Corrigir Alocação Mensal</DialogTitle>
                                    </DialogHeader>
                                    <CorrectionForm 
                                        allocations={correctionAllocations}
                                        handleAllocationChange={handleAllocationChange}
                                        addAllocation={addAllocation}
                                        removeAllocation={removeAllocation}
                                        worksites={worksites}
                                        totalPercentage={totalPercentage}
                                    />
                                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                                         <DialogClose asChild>
                                            <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                                        </DialogClose>
                                        <Button onClick={handleSubmit} disabled={isSubmitting || totalPercentage !== 100} className="w-full sm:w-auto">
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4"/>}
                                            Enviar Pedido
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : (
                         <div className="text-center py-10">
                            <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">Nenhum registo encontrado</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Não existe um registo mensal para {format(month, 'MMMM yyyy', { locale: pt })}.</p>
                            <Button className="mt-4 w-full sm:w-auto min-h-[44px]" onClick={() => navigate('/registar-ponto/mensal')}>Criar Registo Mensal</Button>
                        </div>
                    )
                }
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground">Ao solicitar uma correção, o seu registo anterior será substituído após aprovação.</p>
            </CardFooter>
        </Card>
    )
};

const CorrectionForm = ({ allocations, handleAllocationChange, addAllocation, removeAllocation, worksites, totalPercentage }) => {
    
    const worksiteOptions = useMemo(() => 
        worksites.map(site => ({
            value: String(site.id),
            label: `${site.id} - ${site.nome}`
        })), [worksites]);

    return (
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {allocations.map((alloc, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-end gap-2 p-3 border rounded-lg bg-background">
                    <div className="flex-1 w-full">
                        <Label htmlFor={`worksite-${index}`}>Obra</Label>
                        <Combobox
                            options={worksiteOptions}
                            value={alloc.obra_id}
                            onChange={(v) => handleAllocationChange(index, 'obra_id', v)}
                            placeholder="Selecione a obra..."
                            searchPlaceholder="Pesquisar..."
                            emptyPlaceholder="Nenhuma obra."
                            triggerClassName="h-10 w-full"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex-1 sm:w-24">
                            <Label htmlFor={`percentage-${index}`}>Percentagem</Label>
                            <Input id={`percentage-${index}`} type="number" value={alloc.percentagem} onChange={(e) => handleAllocationChange(index, 'percentagem', e.target.value)} placeholder="%" />
                        </div>
                        <div className="flex items-end">
                            <Button variant="destructive" size="icon" onClick={() => removeAllocation(index)} disabled={allocations.length === 1} className="h-10 w-10"><Minus className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </div>
            ))}
            <Button variant="outline" onClick={addAllocation} className="w-full min-h-[44px]"><Plus className="mr-2 h-4 w-4" />Adicionar Obra</Button>
            <div className={`mt-4 text-right font-bold ${totalPercentage === 100 ? 'text-green-500' : 'text-red-500'}`}>
                Total: {totalPercentage}%
            </div>
        </div>
    );
};


export default AdjustmentsPage;