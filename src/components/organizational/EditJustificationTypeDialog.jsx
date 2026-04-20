import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const EditJustificationTypeDialog = ({ justificationType, onOpenChange, onSuccess }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isNew = !justificationType?.id;

  useEffect(() => {
    if (justificationType) {
      setFormData({
        nome: justificationType.nome || '',
        codigo: justificationType.codigo || '',
      });
    }
  }, [justificationType]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.nome) {
      toast({
        variant: 'destructive',
        title: `Erro`,
        description: "O campo 'Nome' é obrigatório.",
      });
      setLoading(false);
      return;
    }

    let error;
    if (isNew) {
      ({ error } = await supabase.from('tipos_justificação').insert([formData]));
    } else {
      ({ error } = await supabase.from('tipos_justificação').update(formData).eq('id', justificationType.id));
    }

    setLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: `Erro ao ${isNew ? 'criar' : 'atualizar'} tipo`,
        description: error.message,
      });
    } else {
      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: `Tipo de justificação ${isNew ? 'criado' : 'atualizado'} com sucesso.`,
      });
      onSuccess();
    }
  };
  
  if (!justificationType) return null;

  return (
    <Dialog open={!!justificationType} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Adicionar Novo Tipo' : `Editar Tipo: ${justificationType.nome}`}</DialogTitle>
          <DialogDescription>
            {isNew ? 'Preencha os dados do novo tipo de justificação.' : 'Faça alterações nos dados do tipo.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome" className="text-right">Nome</Label>
            <Input id="nome" value={formData.nome} onChange={handleChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="codigo" className="text-right">Código</Label>
            <Input id="codigo" value={formData.codigo} onChange={handleChange} className="col-span-3" />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditJustificationTypeDialog;