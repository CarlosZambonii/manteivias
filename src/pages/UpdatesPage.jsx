import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Loader2, Lightbulb, Rocket, Newspaper, 
    Edit, Trash2, ChevronLeft, WifiOff, Smartphone, Layout, Zap, Map,
    Info, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import SimpleUpdateModal from '@/components/updates/SimpleUpdateModal';
import SimpleSuggestionModal from '@/components/updates/SimpleSuggestionModal';
import ReceivedUpdatesValidation from '@/components/updates/ReceivedUpdatesValidation';

// Keep UpdateEditor for Editing functionality only
const UpdateEditor = ({ onSave, onCancel, update }) => {
    // Default to "Announcement" if type is missing or invalid
    const [title, setTitle] = useState(update?.title || '');
    const [content, setContent] = useState(update?.content || '');
    const [type, setType] = useState(update?.type ? update.type : 'Announcement');
    const [category, setCategory] = useState(update?.category || 'rocket');
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleSave = async () => {
        if (!title || !content) {
            toast({ variant: 'destructive', title: 'Campos em falta', description: 'Título e conteúdo são obrigatórios.' });
            return;
        }
        setIsSaving(true);
        const payload = { title, content, type, category, created_by: user.id };
        let error;
        
        // This component is now only used for editing existing updates
        if (update?.id) {
            ({ error } = await supabase.from('updates').update(payload).eq('id', update.id));
        } else {
             // Fallback just in case
            ({ error } = await supabase.from('updates').insert(payload));
        }

        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao guardar', description: error.message });
        } else {
            toast({ variant: 'success', title: 'Sucesso!', description: 'Atualização guardada.' });
            onSave();
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6 overflow-y-auto max-h-[90vh] bg-background">
                <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl">Editar Atualização</DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">Edite os detalhes da atualização.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm sm:text-base text-foreground">Título</Label>
                        <Input 
                            id="title" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            className="text-base sm:text-sm h-12 sm:h-10 text-white placeholder:text-gray-400 bg-secondary/20 border-border"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="content" className="text-sm sm:text-base text-foreground">Conteúdo</Label>
                        <Textarea 
                            id="content" 
                            value={content} 
                            onChange={(e) => setContent(e.target.value)} 
                            rows={5} 
                            className="text-base sm:text-sm min-h-[120px] text-white placeholder:text-gray-400 bg-secondary/20 border-border" 
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm sm:text-base text-foreground">Tipo</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-12 sm:h-10 text-white bg-secondary/20 border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Announcement">Anúncio (Geral)</SelectItem>
                                    <SelectItem value="Feature">Feature</SelectItem>
                                    <SelectItem value="Improvement">Melhoria</SelectItem>
                                    <SelectItem value="Maintenance">Manutenção</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm sm:text-base text-foreground">Categoria</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-12 sm:h-10 text-white bg-secondary/20 border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rocket">Funcionalidade (Rocket)</SelectItem>
                                    <SelectItem value="lightbulb">Melhoria (Lightbulb)</SelectItem>
                                    <SelectItem value="roadmap">Roadmap / Futuro</SelectItem>
                                    <SelectItem value="PWA">PWA</SelectItem>
                                    <SelectItem value="Offline">Offline</SelectItem>
                                    <SelectItem value="Mobile">Mobile</SelectItem>
                                    <SelectItem value="UI">UI</SelectItem>
                                    <SelectItem value="Performance">Performance</SelectItem>
                                    <SelectItem value="default">Geral (Jornal)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
                    <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto h-12 sm:h-10">Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto h-12 sm:h-10">
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const UpdatesPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    
    // Data States
    const [updates, setUpdates] = useState([]);
    const [upcoming, setUpcoming] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [mySuggestions, setMySuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal States
    const [editingUpdate, setEditingUpdate] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showFutureModal, setShowFutureModal] = useState(false);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);

    const isStarAdmin = user?.tipo_usuario === 'admin_star';

    // Log schema on mount as requested for debugging
    useEffect(() => {
        const logSchema = async () => {
            if (isStarAdmin) {
                const { data, error } = await supabase.rpc('debug_updates_schema');
                if (!error) {
                    console.log("🔍 [DB Schema Inspection] 'updates' table constraints:", data);
                }
            }
        };
        logSchema();
    }, [isStarAdmin]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            const { data: updatesData, error: updatesError } = await supabase.from('updates').select('*, created_by(nome)').order('created_at', { ascending: false });
            if (updatesError) throw updatesError;
            
            // Filter for main updates list
            setUpdates(updatesData.filter(u => 
                u.type !== 'Upcoming' && u.category !== 'roadmap'
            ));

            // Filter for upcoming/roadmap items
            setUpcoming(updatesData.filter(u => 
                u.category === 'roadmap' || u.type === 'Upcoming' 
            ));

            if (isStarAdmin) {
                const { data: suggestionsData, error: suggestionsError } = await supabase.from('suggestions').select('*, submitted_by(nome, funcao)').order('created_at', { ascending: false });
                if (suggestionsError) throw suggestionsError;
                setSuggestions(suggestionsData);
            }
            
            const { data: mySuggestionsData, error: mySuggestionsError } = await supabase.from('suggestions').select('*').eq('submitted_by', user.id).order('created_at', { ascending: false });
            if (mySuggestionsError) throw mySuggestionsError;
            setMySuggestions(mySuggestionsData);

        } catch (error) {
            console.error("Fetch Error:", error);
            toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast, isStarAdmin, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // -- Handlers for New Modals --

    const handleCreateUpdate = async ({ title, content, type, category }) => {
        // Double check permission at handler level
        if (!isStarAdmin) {
            throw new Error('Permissão negada. Apenas admin_star pode criar atualizações.');
        }

        // We accept default values passed from the invocation if missing in data
        // This handles cases where the modal doesn't return type/category
        const finalType = type || 'Announcement';
        const finalCategory = category || 'default';

        console.group("🚀 Processing Update Creation");
        console.log("Input:", { title, content, type: finalType, category: finalCategory, created_by: user.id });

        const payload = { 
            title, 
            content, 
            type: finalType, 
            category: finalCategory,
            created_by: user.id 
        };
        
        const { error } = await supabase.from('updates').insert(payload);
        
        console.groupEnd();
        
        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error; // Pass back to modal for display
        }
        
        toast({ variant: 'success', title: 'Atualização criada!', description: 'A nova atualização foi publicada.' });
        fetchData();
    };

    const handleCreateSuggestion = async ({ title, content, status }) => {
        // Ensure status defaults to 'pendente' which is valid according to new constraints
        const safeStatus = status || 'pendente';
        
        console.group("💡 Processing Suggestion Creation");
        console.log("Input:", { title, content, status: safeStatus, submitted_by: user.id });

        const payload = { 
            title, 
            content, 
            submitted_by: user.id,
            status: safeStatus
        };
        
        const { error } = await supabase.from('suggestions').insert(payload);
        
        console.groupEnd();

        if (error) {
             console.error("Supabase Insert Error:", error);
            throw error; // Pass back to modal
        }
        
        toast({ variant: 'success', title: 'Sugestão enviada!', description: 'Obrigado pela sua contribuição!' });
        fetchData();
    };

    // -- Existing List Renderers --

    const handleDeleteUpdate = async (id) => {
        const { error } = await supabase.from('updates').delete().eq('id', id);
        if (error) {
            toast({ variant: 'destructive', title: 'Erro ao apagar', description: error.message });
        } else {
            toast({ variant: 'success', title: 'Apagado!', description: 'A atualização foi removida.' });
            fetchData();
        }
    };

    const getIcon = (category) => {
        switch(category) {
            case 'rocket': return <Rocket className="h-5 w-5 text-blue-500" />;
            case 'lightbulb': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
            case 'roadmap': return <Map className="h-5 w-5 text-indigo-500" />;
            case 'PWA': return <Rocket className="h-5 w-5 text-purple-500" />;
            case 'Offline': return <WifiOff className="h-5 w-5 text-slate-500" />;
            case 'Mobile': return <Smartphone className="h-5 w-5 text-green-500" />;
            case 'UI': return <Layout className="h-5 w-5 text-pink-500" />;
            case 'Performance': return <Zap className="h-5 w-5 text-orange-500" />;
            default: return <Newspaper className="h-5 w-5 text-primary" />;
        }
    };

    const renderUpdateCard = (item) => (
        <Card key={item.id} className="mb-4 bg-card/50 backdrop-blur-sm border-l-4 border-l-primary/20 hover:border-l-primary transition-colors overflow-hidden">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 w-full">
                        <div className="mt-1 p-2 bg-background/50 rounded-full border shadow-sm shrink-0">
                             {getIcon(item.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                             <CardTitle className="text-lg sm:text-xl leading-tight mb-1 break-words">{item.title}</CardTitle>
                             <CardDescription className="text-sm sm:text-base flex flex-wrap gap-2 items-center">
                                <span className="block sm:inline">
                                    {format(new Date(item.created_at), "d 'de' MMM, yyyy", { locale: pt })} • {item.created_by?.nome || 'Admin'}
                                </span>
                             </CardDescription>
                        </div>
                    </div>
                    {isStarAdmin && (
                        <div className="flex gap-2 self-end sm:self-start shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => setEditingUpdate(item)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => handleDeleteUpdate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pl-[4.5rem]">
                <p className="whitespace-pre-wrap text-muted-foreground text-sm sm:text-base leading-relaxed break-words">{item.content}</p>
            </CardContent>
        </Card>
    );

    const formatStatus = (status) => {
        if (!status) return 'Desconhecido';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const renderSuggestionCard = (item) => (
        <Card key={item.id} className="mb-4">
            <CardContent className="p-4 sm:p-6">
                <h3 className="font-semibold text-base sm:text-lg mb-2">{item.title}</h3>
                <p className="whitespace-pre-wrap text-sm sm:text-base break-words">{item.content}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Enviado por {item.submitted_by?.nome} em {format(new Date(item.created_at), "d/MM/yy 'às' HH:mm", { locale: pt })} - Status: {formatStatus(item.status)}
                </p>
            </CardContent>
        </Card>
    );
    
    const renderMySuggestionCard = (item) => (
        <Card key={item.id} className="mb-4">
            <CardContent className="p-4 sm:p-6">
                 <h3 className="font-semibold text-base sm:text-lg mb-2">{item.title}</h3>
                <p className="whitespace-pre-wrap text-sm sm:text-base break-words">{item.content}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Enviado em {format(new Date(item.created_at), "d/MM/yy 'às' HH:mm", { locale: pt })} - Status: <span className="font-bold">{formatStatus(item.status)}</span>
                </p>
            </CardContent>
        </Card>
    );

    return (
        <>
            <Helmet>
                <title>Atualizações</title>
                <meta name="description" content="Central de atualizações, próximas funcionalidades e sugestões da equipa." />
            </Helmet>
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
            >
                <Button 
                    variant="ghost" 
                    onClick={() => navigate(-1)} 
                    className="mb-4 hover:bg-accent group pl-0 sm:pl-4"
                >
                    <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar
                </Button>
                
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Central de Atualizações</h1>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {isStarAdmin ? (
                        <>
                            <Button 
                                onClick={() => setShowUpdateModal(true)} 
                                variant="default" 
                                className="flex-1 h-12"
                            >
                                <Newspaper className="mr-2 h-5 w-5" /> 
                                Adicionar Atualização
                            </Button>
                            <Button 
                                onClick={() => setShowFutureModal(true)} 
                                variant="default" 
                                className="flex-1 h-12"
                            >
                                <Rocket className="mr-2 h-5 w-5" /> 
                                Adicionar Atualização Futura
                            </Button>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground text-sm text-center">
                           <Info className="w-4 h-4 mr-2 inline-block" />
                           Apenas administradores podem gerir atualizações. Você pode visualizar e sugerir melhorias.
                        </div>
                    )}
                    <Button 
                        onClick={() => setShowSuggestionModal(true)} 
                        variant="default" 
                        className="flex-1 h-12"
                    >
                        <Lightbulb className="mr-2 h-5 w-5" /> 
                        Adicionar Sugestão
                    </Button>
                </div>

                {editingUpdate && <UpdateEditor update={editingUpdate} onSave={() => { setEditingUpdate(null); fetchData(); }} onCancel={() => setEditingUpdate(null)} />}

                {/* Simplified Modal calls passing fixed types/categories */}
                <SimpleUpdateModal 
                    isOpen={showUpdateModal} 
                    onClose={() => setShowUpdateModal(false)} 
                    onSubmit={(data) => handleCreateUpdate({ ...data, type: 'Announcement', category: 'default' })}
                    title="Adicionar Nova Atualização"
                    submitButtonText="Publicar Atualização"
                />

                <SimpleUpdateModal 
                    isOpen={showFutureModal} 
                    onClose={() => setShowFutureModal(false)} 
                    onSubmit={(data) => handleCreateUpdate({ ...data, type: 'Feature', category: 'roadmap' })}
                    title="Adicionar Atualização Futura"
                    submitButtonText="Agendar Funcionalidade"
                />

                <SimpleSuggestionModal
                    isOpen={showSuggestionModal}
                    onClose={() => setShowSuggestionModal(false)}
                    onSubmit={handleCreateSuggestion}
                />

                <Tabs defaultValue="updates" className="w-full">
                    <TabsList className="w-full h-auto flex flex-col sm:grid sm:grid-cols-4 gap-2 bg-muted/50 p-2 rounded-lg">
                        <TabsTrigger value="updates" className="w-full justify-start sm:justify-center h-10 px-4 text-sm sm:text-base"><Newspaper className="mr-2 h-4 w-4" />Atualizações</TabsTrigger>
                        <TabsTrigger value="upcoming" className="w-full justify-start sm:justify-center h-10 px-4 text-sm sm:text-base"><Rocket className="mr-2 h-4 w-4" />Futuro</TabsTrigger>
                        <TabsTrigger value="suggestions" className="w-full justify-start sm:justify-center h-10 px-4 text-sm sm:text-base"><Lightbulb className="mr-2 h-4 w-4" />Sugestões</TabsTrigger>
                        {isStarAdmin && <TabsTrigger value="received" className="w-full justify-start sm:justify-center h-10 px-4 text-sm sm:text-base"><CheckCircle2 className="mr-2 h-4 w-4" />Recebidas</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="updates" className="mt-6 space-y-4">
                        {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div> : updates.map(renderUpdateCard)}
                    </TabsContent>
                    
                    <TabsContent value="upcoming" className="mt-6 space-y-4">
                        {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div> : upcoming.map(renderUpdateCard)}
                    </TabsContent>
                    
                    <TabsContent value="suggestions" className="mt-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 px-1">Minhas Sugestões</h2>
                            {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div> : mySuggestions.map(renderMySuggestionCard)}
                        </div>
                        
                        {isStarAdmin && suggestions.length > 0 && (
                             <div className="mt-8 pt-8 border-t border-border/40">
                                <h2 className="text-xl font-semibold mb-4 px-1">Todas as Sugestões Recebidas</h2>
                                {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div> : suggestions.map(renderSuggestionCard)}
                            </div>
                        )}
                    </TabsContent>

                    {isStarAdmin && (
                        <TabsContent value="received" className="mt-6">
                            <ReceivedUpdatesValidation />
                        </TabsContent>
                    )}
                </Tabs>
            </motion.div>
        </>
    );
};

export default UpdatesPage;