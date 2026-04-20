import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SimpleUpdateModal = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    title = "Nova Atualização", 
    submitButtonText = "Publicar"
}) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({ 
        title: '', 
        content: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);

    const isAdminStar = user?.tipo_usuario === 'admin_star';

    useEffect(() => {
        if (isOpen) {
            setFormData({ 
                title: '', 
                content: ''
            });
            setErrorDetails(null);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        // 1. Validation
        if (!isAdminStar) {
            const errorMsg = "Permissão Negada: Apenas administradores podem publicar atualizações.";
            console.error(errorMsg);
            setErrorDetails({ message: errorMsg });
            return;
        }

        if (!formData.title?.trim() || !formData.content?.trim()) {
            const errorMsg = "Campos obrigatórios: Título e conteúdo são necessários.";
            console.error(errorMsg);
            setErrorDetails({ message: errorMsg });
            return;
        }

        setIsSubmitting(true);
        setErrorDetails(null);
        
        // 2. Prepare Payload
        // We only send title and content. Type/Category are handled by the parent component.
        const payload = {
            title: formData.title.trim(),
            content: formData.content.trim()
        };

        // 3. Debug Logging
        console.group("🚀 Submitting Update");
        console.log("User:", user.id);
        console.log("Payload:", payload);
        console.groupEnd();

        try {
            // 4. Submit to Parent Handler
            await onSubmit(payload);
            
            console.log("✅ Update submitted successfully");
            onClose();
        } catch (error) {
            console.error("❌ SimpleUpdateModal Submission Error:", error);
            
            // 5. Error Formatting
            let errorMessage = error.message || "Ocorreu um erro desconhecido ao guardar.";
            let errorDetailsMsg = "";
            
            if (error.code) {
                errorDetailsMsg += `Postgres Code: ${error.code} `;
            }
            if (error.details) {
                errorDetailsMsg += `Details: ${error.details}`;
            }
            if (error.hint) {
                errorDetailsMsg += ` | Hint: ${error.hint}`;
            }

            setErrorDetails({
                message: errorMessage,
                technical: errorDetailsMsg
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes abaixo para criar o registo.
                    </DialogDescription>
                </DialogHeader>
                
                {!isAdminStar && (
                    <Alert variant="destructive" className="mb-4">
                        <Lock className="h-4 w-4" />
                        <AlertTitle>Permissão Negada</AlertTitle>
                        <AlertDescription>
                            Você não tem permissão para criar atualizações. Apenas administradores (admin_star) podem realizar esta ação.
                        </AlertDescription>
                    </Alert>
                )}

                {errorDetails && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro ao submeter</AlertTitle>
                        <AlertDescription>
                            <p>{errorDetails.message}</p>
                            {errorDetails.technical && (
                                <p className="text-xs mt-1 opacity-80 font-mono bg-black/10 p-1 rounded break-all">
                                    {errorDetails.technical}
                                </p>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-foreground">Título *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Resumo curto..."
                            className="text-white placeholder:text-gray-400 bg-secondary/20 border-border" 
                            disabled={!isAdminStar || isSubmitting}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="content" className="text-foreground">Conteúdo *</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Descrição detalhada..."
                            className="min-h-[150px] text-white placeholder:text-gray-400 bg-secondary/20 border-border" 
                            disabled={!isAdminStar || isSubmitting}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !formData.title || !formData.content || !isAdminStar}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitButtonText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SimpleUpdateModal;