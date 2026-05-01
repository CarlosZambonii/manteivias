import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, ShieldCheck, User, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mockRegistrations = [
  { id: 1, user: 'João Silva', date: '2025-07-16', shift: 'Manhã', entry: '08:01', exit: '12:05', total: '4h 4m', status: 'pending' },
  { id: 2, user: 'Maria Santos', date: '2025-07-16', shift: 'Tarde', entry: '13:00', exit: '17:30', total: '4h 30m', status: 'pending' },
  { id: 3, user: 'Pedro Costa', date: '2025-07-15', shift: 'Manhã', entry: '07:55', exit: '12:15', total: '4h 20m', status: 'approved' },
];

const mockAdjustments = [
  { id: 1, user: 'Carlos Pereira', date: '2025-07-14', field: 'Saída', oldValue: '16:30', newValue: '17:00', reason: 'Fiquei a terminar uma tarefa urgente.', status: 'pending' },
  { id: 2, user: 'Ana Ferreira', date: '2025-07-13', field: 'Entrada', oldValue: '08:15', newValue: '08:00', reason: 'Esqueci-me de registar na hora certa.', status: 'rejected' },
];

const AdminPage = () => {
    const { toast } = useToast();

    const handleApproval = (id, type, approved) => {
        toast({
            title: `Pedido ${approved ? 'Aprovado' : 'Rejeitado'}`,
            description: `O pedido ${id} de ${type} foi ${approved ? 'aprovado' : 'rejeitado'} com sucesso.`,
            className: approved ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
        });
        // Here you would typically update the state or call an API
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
        >
            <div className="flex items-center gap-4 mb-8">
                <ShieldCheck className="h-10 w-10 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Painel de Administração</h1>
                    <p className="text-muted-foreground">Valide os registos de ponto e pedidos de correção.</p>
                </div>
            </div>

            <Tabs defaultValue="registrations" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="registrations">
                        <Clock className="mr-2 h-4 w-4" />
                        Validação de Pontos
                    </TabsTrigger>
                    <TabsTrigger value="adjustments">
                        <User className="mr-2 h-4 w-4" />
                        Pedidos de Correção
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="registrations">
                    <div className="bg-card border rounded-lg shadow-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Utilizador</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Turno</TableHead>
                                    <TableHead>Entrada</TableHead>
                                    <TableHead>Saída</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockRegistrations.map((reg) => (
                                    <TableRow key={reg.id}>
                                        <TableCell>{reg.user}</TableCell>
                                        <TableCell>{reg.date}</TableCell>
                                        <TableCell>{reg.shift}</TableCell>
                                        <TableCell>{reg.entry}</TableCell>
                                        <TableCell>{reg.exit}</TableCell>
                                        <TableCell>{reg.total}</TableCell>
                                        <TableCell>
                                            <Badge variant={reg.status === 'pending' ? 'secondary' : reg.status === 'approved' ? 'default' : 'destructive'}>
                                                {reg.status === 'pending' ? 'Pendente' : reg.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {reg.status === 'pending' && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button onClick={() => handleApproval(reg.id, 'registo', true)} size="icon" className="bg-green-600 hover:bg-green-700 h-8 w-8">
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button onClick={() => handleApproval(reg.id, 'registo', false)} size="icon" variant="destructive" className="h-8 w-8">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
                <TabsContent value="adjustments">
                    <div className="bg-card border rounded-lg shadow-lg overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Utilizador</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Campo</TableHead>
                                    <TableHead>Valor Antigo</TableHead>
                                    <TableHead>Valor Novo</TableHead>
                                    <TableHead>Motivo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockAdjustments.map((adj) => (
                                    <TableRow key={adj.id}>
                                        <TableCell>{adj.user}</TableCell>
                                        <TableCell>{adj.date}</TableCell>
                                        <TableCell>{adj.field}</TableCell>
                                        <TableCell>{adj.oldValue}</TableCell>
                                        <TableCell>{adj.newValue}</TableCell>
                                        <TableCell className="max-w-xs truncate">{adj.reason}</TableCell>
                                        <TableCell>
                                            <Badge variant={adj.status === 'pending' ? 'secondary' : adj.status === 'approved' ? 'default' : 'destructive'}>
                                                {adj.status === 'pending' ? 'Pendente' : adj.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {adj.status === 'pending' && (
                                                 <div className="flex gap-2 justify-end">
                                                    <Button onClick={() => handleApproval(adj.id, 'ajuste', true)} size="icon" className="bg-green-600 hover:bg-green-700 h-8 w-8">
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button onClick={() => handleApproval(adj.id, 'ajuste', false)} size="icon" variant="destructive" className="h-8 w-8">
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
};

export default AdminPage;