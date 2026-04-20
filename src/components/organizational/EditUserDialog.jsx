import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';

const EditUserDialog = ({ open, onOpenChange, user, onSuccess }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isNew = !user?.id;

  const [formData, setFormData] = useState({
    nome: '',
    nif: '',
    senha: '',
    empresa: 'Manteivias',
    funcao: '',
    tipo_usuario: 'user',
    tipo_registo: 'Diário',
    inicio_vinculo: new Date().toISOString().split('T')[0],
    status: 'Ativo',
    categoria: 'geral',
  });

  useEffect(() => {
    if (user && open) {
      setFormData({
        nome: user.nome || '',
        nif: user.nif || '',
        senha: user.senha || '',
        empresa: user.empresa || 'Manteivias',
        funcao: user.funcao || '',
        tipo_usuario: user.tipo_usuario || 'user',
        tipo_registo: user.tipo_registo || 'Diário',
        inicio_vinculo: user.inicio_vinculo || new Date().toISOString().split('T')[0],
        status: user.status || 'Ativo',
        categoria: user.categoria || 'geral',
      });
    }
  }, [user, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isNew) {
        // NIF Duplicate Validation
        const { data: existingUser, error: checkError } = await supabase
          .from('usuarios')
          .select('id')
          .eq('nif', formData.nif)
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        if (existingUser) {
          toast({
            variant: 'destructive',
            title: 'Erro de Validação',
            description: 'Já existe um usuário com este NIF cadastrado',
          });
          setIsLoading(false);
          return;
        }

        // Proceed to create user using edge function
        const { error } = await supabase.functions.invoke('signup-user', {
          body: formData,
        });

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Utilizador criado com sucesso.',
        });
      } else {
        // Update user
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.senha) delete dataToUpdate.senha;

        const { error } = await supabase
          .from('usuarios')
          .update(dataToUpdate)
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: 'Sucesso',
          description: 'Utilizador atualizado com sucesso.',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao guardar o utilizador.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Adicionar Utilizador' : 'Editar Utilizador'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nif">NIF *</Label>
              <Input
                id="nif"
                name="nif"
                value={formData.nif}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">
                {isNew ? 'Senha *' : 'Nova Senha (opcional)'}
              </Label>
              <Input
                id="senha"
                name="senha"
                type="text"
                value={formData.senha}
                onChange={handleChange}
                required={isNew}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa *</Label>
              <Input
                id="empresa"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="funcao">Função *</Label>
              <Input
                id="funcao"
                name="funcao"
                value={formData.funcao}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Utilizador *</Label>
              <Select
                value={formData.tipo_usuario}
                onValueChange={(val) => handleSelectChange('tipo_usuario', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Utilizador</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="admin_star">Admin Star</SelectItem>
                  <SelectItem value="admin_c">Admin C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Registo *</Label>
              <Select
                value={formData.tipo_registo}
                onValueChange={(val) => handleSelectChange('tipo_registo', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diário">Diário</SelectItem>
                  <SelectItem value="Mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inicio_vinculo">Início de Vínculo *</Label>
              <Input
                id="inicio_vinculo"
                name="inicio_vinculo"
                type="date"
                value={formData.inicio_vinculo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => handleSelectChange('status', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;