import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const SimpleSuggestionModal = ({ 
    isOpen, 
    onClose, 
    onSubmit 
}) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({ title: '', content: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorDetails, setErrorDetails] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({ title: '', content: '' });
            setErrorDetails(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        // 1. Validation
        if (!formData.title?.trim() || !formData.content?.trim()) {
            setErrorDetails({ message: "Por favor, preencha o título e a descrição." });
            return;
        }

        setIsSubmitting(true);
        setErrorDetails(null);

        // 2. Prepare Payload
        // Status is forced to 'pendente' for all new suggestions
        const payload = {
            title: formData.title.trim(),
            content: formData.content.trim(),
            status: 'pendente',
            submitted_by: user?.id 
        };

        // 3. Debug Logging
        console.group("💡 Submitting Suggestion");
        console.log("User:", user?.id);
        console.log("Payload:", payload);
        console.groupEnd();

        try {
            // 4. Submit
            await onSubmit(payload);
            console.log("✅ Suggestion submitted successfully");
            onClose();
        } catch (error) {
            console.error("❌ SimpleSuggestionModal Error:", error);
            
            // 5. Error Formatting
            let errorMessage = error.message || "Ocorreu um erro desconhecido.";
            let errorDetailsMsg = "";
            
            if (error.code) {
                errorDetailsMsg += `Code: ${error.code} `;
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
                    <DialogTitle>Nova Sugestão</DialogTitle>
                    <DialogDescription>
                        Tem uma ideia para melhorar a aplicação? Partilhe connosco!
                    </DialogDescription>
                </DialogHeader>

                {errorDetails && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro ao enviar</AlertTitle>
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
                        <Label htmlFor="sug-title" className="text-foreground">Título *</Label>
                        <Input
                            id="sug-title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Assunto da sugestão..."
                            className="text-white placeholder:text-gray-400 bg-secondary/20 border-border"
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sug-content" className="text-foreground">Descrição *</Label>
                        <Textarea
                            id="sug-content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Descreva a sua ideia em detalhe..."
                            className="min-h-[150px] text-white placeholder:text-gray-400 bg-secondary/20 border-border"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !formData.title || !formData.content}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Sugestão
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SimpleSuggestionModal;