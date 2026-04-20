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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const EditWorksiteDialog = ({ open, onOpenChange, worksite, users, onSuccess }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isNew = !worksite?.id;

  useEffect(() => {
    const initialData = {
      id: worksite?.id || '',
      nome: worksite?.nome || '',
      address: worksite?.address || '',
      latitude: worksite?.latitude || '',
      longitude: worksite?.longitude || '',
      encarregado_id: worksite?.encarregado_id || null,
      status: worksite?.status || 'em execução',
    };
    setFormData(initialData);
  }, [worksite]);

  const handleChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.id || !formData.nome) {
      toast({
        variant: 'destructive',
        title: `Erro`,
        description: "Os campos 'ID' e 'Nome' são obrigatórios.",
      });
      setLoading(false);
      return;
    }

    const payload = {
        ...formData,
        id: parseInt(formData.id, 10),
        latitude: formData.latitude ? parseFloat(String(formData.latitude).replace(',', '.')) : null,
        longitude: formData.longitude ? parseFloat(String(formData.longitude).replace(',', '.')) : null,
        encarregado_id: formData.encarregado_id && formData.encarregado_id !== 'none' ? parseInt(formData.encarregado_id, 10) : null,
    };

    let error;
    if (isNew) {
      ({ error } = await supabase.from('obras').insert([payload]));
    } else {
      ({ error } = await supabase.from('obras').update(payload).eq('id', worksite.id));
    }

    setLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: `Erro ao ${isNew ? 'criar' : 'atualizar'} obra`,
        description: error.code === '23505' ? 'Este ID de obra já existe. Por favor, escolha outro.' : error.message,
      });
    } else {
      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: `Obra ${isNew ? 'criada' : 'atualizada'} com sucesso.`,
      });
      onSuccess();
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Adicionar Nova Obra' : `Editar Obra: ${worksite?.nome}`}</DialogTitle>
          <DialogDescription>
            {isNew ? 'Preencha os dados da nova obra.' : 'Faça alterações nos dados da obra.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="id" className="text-right">ID</Label>
            <Input id="id" type="number" value={formData.id} onChange={(e) => handleChange('id', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome" className="text-right">Nome</Label>
            <Input id="nome" value={formData.nome || ''} onChange={(e) => handleChange('nome', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="address" className="text-right pt-2">Address</Label>
            <Textarea id="address" value={formData.address || ''} onChange={(e) => handleChange('address', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="latitude" className="text-right">Latitude</Label>
            <Input id="latitude" type="number" step="any" value={formData.latitude || ''} onChange={(e) => handleChange('latitude', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="longitude" className="text-right">Longitude</Label>
            <Input id="longitude" type="number" step="any" value={formData.longitude || ''} onChange={(e) => handleChange('longitude', e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="encarregado_id" className="text-right">Encarregado</Label>
            <Select onValueChange={(value) => handleChange('encarregado_id', value)} value={formData.encarregado_id?.toString() || 'none'}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um encarregado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {(users || []).map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>{user.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select onValueChange={(value) => handleChange('status', value)} value={formData.status}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em execução">em execução</SelectItem>
                <SelectItem value="inativa">inativa</SelectItem>
                <SelectItem value="encerrada">encerrada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditWorksiteDialog;