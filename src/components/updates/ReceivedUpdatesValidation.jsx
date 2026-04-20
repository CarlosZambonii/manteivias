import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle, RefreshCw, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

const StatusBadge = ({ status }) => {
    let className = '';
    
    // Normalize status for case-insensitive comparison (DB values are lowercase now)
    const s = status?.toLowerCase() || '';
    
    if (s === 'pendente') {
        className = 'bg-amber-500 hover:bg-amber-600 text-white border-transparent';
    } else if (s === 'visualizada') {
        className = 'bg-blue-500 hover:bg-blue-600 text-white border-transparent';
    } else if (s === 'aprovada') {
        className = 'bg-green-600 hover:bg-green-700 text-white border-transparent';
    } else if (s === 'recusada') {
        className = 'bg-destructive hover:bg-destructive/90 text-destructive-foreground border-transparent';
    } else {
        className = 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent';
    }

    return (
        <Badge className={className}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Desconhecido'}
        </Badge>
    );
};

const ReceivedUpdatesValidation = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState(null);

    const isAdminStar = user?.tipo_usuario === 'admin_star';

    const fetchSuggestions = async () => {
        if (!user || !isAdminStar) return;
        
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching suggestions for validation...");
            // Query suggestions table directly
            // Removed 'email' from submitted_by selection as it does not exist in usuarios table
            const { data, error } = await supabase
                .from('suggestions')
                .select('*, submitted_by(nome, funcao)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            console.log(`Fetched ${data?.length || 0} suggestions`);
            setSuggestions(data || []);
        } catch (err) {
            console.error("Error fetching suggestions:", err);
            setError(err.message || 'Erro ao carregar sugestões.');
            toast({
                variant: 'destructive',
                title: 'Erro ao carregar',
                description: err.message || 'Não foi possível carregar as sugestões.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [user, isAdminStar]);

    const handleStatusChange = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            console.log(`Updating suggestion ${id} to status: ${newStatus}`);
            const { error } = await supabase
                .from('suggestions')
                .update({ 
                    status: newStatus
                })
                .eq('id', id);

            if (error) throw error;

            toast({
                variant: 'success',
                title: 'Status atualizado',
                description: `A sugestão foi marcada como ${newStatus}.`
            });

            // Update local state to reflect change immediately
            setSuggestions(prev => prev.map(item => 
                item.id === id ? { ...item, status: newStatus } : item
            ));

        } catch (err) {
            console.error("Error updating suggestion status:", err);
            toast({
                variant: 'destructive',
                title: 'Falha na atualização',
                description: err.message || 'Não foi possível alterar o status. Verifique as permissões.'
            });
        } finally {
            setUpdatingId(null);
        }
    };

    if (!isAdminStar) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border border-dashed">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Acesso Restrito</h3>
                <p className="text-muted-foreground">Apenas administradores (admin_star) podem gerir sugestões recebidas.</p>
            </div>
        );
    }

    if (loading && suggestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">A carregar sugestões...</p>
            </div>
        );
    }

    if (error) {
         return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertCircle className="h-10 w-10 text-destructive mb-4" />
                <h3 className="text-lg font-medium text-destructive">Erro ao carregar dados</h3>
                <p className="text-muted-foreground max-w-sm mt-2 mb-4">{error}</p>
                <Button variant="outline" onClick={fetchSuggestions}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
                </Button>
            </div>
        );
    }

    if (suggestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/30 rounded-lg border border-dashed">
                <div className="bg-background p-4 rounded-full mb-4">
                    <Mail className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Sem sugestões</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                    Não existem sugestões submetidas para validação neste momento.
                </p>
                <Button variant="outline" onClick={fetchSuggestions} className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Gestão de Sugestões ({suggestions.length})</h3>
                <Button variant="ghost" size="sm" onClick={fetchSuggestions} disabled={loading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
                    Atualizar
                </Button>
            </div>
            
            <div className="grid gap-4">
                {suggestions.map((item) => (
                    <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md border-l-4 border-l-primary/20 bg-card/60">
                        <CardHeader className="pb-3 bg-muted/10">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <StatusBadge status={item.status} />
                                        <span className="flex items-center text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full border">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {format(new Date(item.created_at), "d 'de' MMM, yyyy 'às' HH:mm", { locale: pt })}
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg leading-tight mt-2">
                                        {item.title || "Sem Título"}
                                    </CardTitle>
                                </div>
                                <div className="text-right text-sm">
                                    <div className="font-medium text-foreground">{item.submitted_by?.nome || 'Utilizador Desconhecido'}</div>
                                    <div className="text-muted-foreground text-xs">{item.submitted_by?.funcao || 'N/A'}</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="py-4">
                            <p className="text-sm sm:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {item.content || "Conteúdo não disponível."}
                            </p>
                        </CardContent>
                        <CardFooter className="bg-muted/30 py-3 flex flex-wrap justify-between items-center gap-4 border-t">
                            <span className="text-xs text-muted-foreground font-medium flex items-center">
                                Ação Necessária:
                            </span>
                            <div className="w-full sm:w-[200px]">
                                <Select 
                                    value={item.status?.toLowerCase()} 
                                    onValueChange={(value) => handleStatusChange(item.id, value)}
                                    disabled={updatingId === item.id}
                                >
                                    <SelectTrigger className="h-9 text-sm bg-background">
                                        {updatingId === item.id ? (
                                            <div className="flex items-center">
                                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                A atualizar...
                                            </div>
                                        ) : (
                                            <SelectValue placeholder="Alterar status" />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="visualizada">Visualizada</SelectItem>
                                        <SelectItem value="aprovada">Aprovada</SelectItem>
                                        <SelectItem value="recusada">Recusada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ReceivedUpdatesValidation;