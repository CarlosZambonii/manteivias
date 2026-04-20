import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/lib/customSupabaseClient';

const AddSubcontractorDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess, 
  subcontractorToEdit = null, 
  defaultCompany = '',
  companies = [] 
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    nif: '',
    empresa: '',
    funcao: '', 
    inicio_vinculo: '' // Added start date field
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!subcontractorToEdit;

  // Initialize form state when dialog opens or props change
  useEffect(() => {
    if (open) {
      console.log('[AddSubcontractorDialog] Dialog opened.');
      if (subcontractorToEdit) {
        console.log('[AddSubcontractorDialog] Mode: EDIT. Loading data:', subcontractorToEdit);
        setFormData({
          nome: subcontractorToEdit.nome || '',
          nif: subcontractorToEdit.nif || '',
          empresa: subcontractorToEdit.empresa || '',
          funcao: subcontractorToEdit.funcao || '',
          inicio_vinculo: subcontractorToEdit.inicio_vinculo || '',
        });
      } else {
        console.log('[AddSubcontractorDialog] Mode: ADD. Default company:', defaultCompany);
        setFormData({
          nome: '',
          nif: '',
          empresa: defaultCompany || '',
          funcao: '',
          inicio_vinculo: new Date().toISOString().split('T')[0], // Default to today for new records
        });
      }
    }
  }, [subcontractorToEdit, defaultCompany, open]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[Submit] Form submission started');
    
    // 1. Validate Form State
    console.log('[Submit] Validating state:', formData);
    
    if (!formData.nome.trim()) {
      toast({ variant: 'destructive', title: 'Erro de Validação', description: 'O nome é obrigatório.' });
      return;
    }
    if (!formData.empresa.trim()) {
      toast({ variant: 'destructive', title: 'Erro de Validação', description: 'O nome da empresa é obrigatório.' });
      return;
    }
    if (!formData.nif.trim()) {
      toast({ variant: 'destructive', title: 'Erro de Validação', description: 'O NIF é obrigatório.' });
      return;
    }
    if (!formData.funcao.trim()) {
      toast({ variant: 'destructive', title: 'Erro de Validação', description: 'A especialização (função) é obrigatória.' });
      return;
    }
    if (!formData.inicio_vinculo) {
       toast({ variant: 'destructive', title: 'Erro de Validação', description: 'A data de início de vínculo é obrigatória.' });
       return;
    }

    setLoading(true);

    try {
      // 2. Prepare Payload
      const dataToSend = {
        nome: formData.nome.trim(),
        nif: formData.nif.trim(),
        empresa: formData.empresa.trim(),
        funcao: formData.funcao.trim(),
        tipo_usuario: 'subempreiteiro',
        tipo_registo: 'diario',
        status: 'Ativo',
        inicio_vinculo: formData.inicio_vinculo
      };

      console.log('[Submit] Payload prepared for Supabase:', dataToSend);

      let resultData = null;

      if (isEditing) {
        // UPDATE existing user
        console.log(`[Submit] Updating user ID: ${subcontractorToEdit.id}`);
        const { data, error } = await supabase
          .from('usuarios')
          .update(dataToSend)
          .eq('id', subcontractorToEdit.id)
          .select();

        if (error) throw error;
        
        resultData = data;
        console.log('[Submit] Update successful:', data);
        toast({ title: 'Sucesso', description: 'Subempreiteiro atualizado com sucesso.' });

      } else {
        // CREATE new user via DIRECT INSERT
        console.log('[Submit] Creating new user via direct insert to "usuarios" table');
        
        const { data, error } = await supabase
          .from('usuarios')
          .insert([dataToSend])
          .select()
          .single();

        if (error) throw error;
        
        resultData = data;
        console.log('[Submit] Insert successful, new user created:', data);
        
        // Wait a small moment to ensure propagation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast({ title: 'Sucesso', description: 'Subempreiteiro criado com sucesso.' });
      }

      // 3. Close dialog and refresh only AFTER success is confirmed
      console.log('[Submit] Calling onSuccess callback...');
      if (onSuccess) {
         await onSuccess();
      }
      
      console.log('[Submit] Closing dialog...');
      onOpenChange(false);

    } catch (error) {
      console.error('[Submit] Final Catch Error:', error);
      
      // Determine user-friendly error message
      let errorMessage = 'Ocorreu um erro ao salvar os dados.';
      
      if (error.code === '23505') { // Postgres unique_violation code
        if (error.message?.includes('nif')) {
            errorMessage = 'Já existe um utilizador registado com este NIF.';
        } else if (error.message?.includes('email')) {
            errorMessage = 'Já existe um utilizador registado com este email.';
        } else {
            errorMessage = 'Dados duplicados detectados. Verifique se o utilizador já existe.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Erro no Registo',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Subempreiteiro' : 'Adicionar Subempreiteiro'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados do subempreiteiro.' : 'Preencha os dados para adicionar um novo subempreiteiro.'}
          </DialogDescription>
        </DialogHeader>
        
        <form id="subcontractor-form" onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nome" className="text-right">Nome *</Label>
            <Input 
              id="nome" 
              value={formData.nome} 
              onChange={handleChange} 
              className="col-span-3" 
              placeholder="Nome do responsável" 
              required 
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="empresa" className="text-right">Empresa *</Label>
            <Input 
              id="empresa" 
              value={formData.empresa} 
              onChange={handleChange} 
              className="col-span-3" 
              placeholder="Nome da empresa" 
              required 
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nif" className="text-right">NIF *</Label>
            <Input 
              id="nif" 
              value={formData.nif} 
              onChange={handleChange} 
              className="col-span-3" 
              placeholder="NIF da empresa ou responsável" 
              required 
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="funcao" className="text-right">Especialização *</Label>
            <Input 
              id="funcao" 
              value={formData.funcao} 
              onChange={handleChange} 
              className="col-span-3" 
              placeholder="Ex: Eletricidade, AVAC, etc." 
              required 
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="inicio_vinculo" className="text-right">Início Vínculo *</Label>
             <Input 
              id="inicio_vinculo" 
              type="date"
              value={formData.inicio_vinculo} 
              onChange={handleChange} 
              className="col-span-3" 
              required
            />
          </div>
        </form>
        
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="subcontractor-form" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar Alterações' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubcontractorDialog;