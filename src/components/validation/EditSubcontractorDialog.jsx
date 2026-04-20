import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, FilePlus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';

const AddDocumentColumnDialog = ({ onAdd, isReadOnly }) => {
  const [docName, setDocName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleAdd = async () => {
    if (!docName.trim()) {
      toast({ variant: 'destructive', title: 'O nome do documento não pode estar vazio.' });
      return;
    }
    setLoading(true);

    const columnName = 'doc_' + docName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    try {
      const { error: rpcError } = await supabase.rpc('add_document_column', { column_name: columnName });

      if (rpcError) {
        throw rpcError;
      }
      
      toast({ variant: 'success', title: 'Documento adicionado com sucesso!' });
      onAdd();
      setDocName('');
      setOpen(false);

    } catch (error) {
      console.error('Detailed error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao adicionar documento.', 
        description: error.message || 'Verifique se o nome já existe ou é válido.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" disabled={isReadOnly}>
          <FilePlus className="mr-2 h-4 w-4" />
          Adicionar Documento
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Adicionar Novo Tipo de Documento</AlertDialogTitle>
          <AlertDialogDescription>
            Insira o nome para o novo documento. Isto irá adicionar uma nova coluna de verificação para todos os subempreiteiros.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="doc-name">Nome do Documento</Label>
          <Input
            id="doc-name"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="Ex: Registo Criminal"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleAdd} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Adicionar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const EditDocumentColumnDialog = ({ document, onEdit, isReadOnly }) => {
    const [newName, setNewName] = useState(document.label);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const handleEdit = async () => {
        if (!newName.trim()) {
            toast({ variant: 'destructive', title: 'O nome do documento não pode estar vazio.' });
            return;
        }
        if (newName.trim() === document.label) {
            setOpen(false);
            return;
        }

        setLoading(true);
        const newColumnName = 'doc_' + newName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

        try {
            const { error: renameError } = await supabase.rpc('rename_document_column', {
                old_name: document.id,
                new_name: newColumnName
            });

            if (renameError) {
                throw renameError;
            }

            toast({ variant: 'success', title: 'Documento renomeado com sucesso!' });
            onEdit();
            setOpen(false);

        } catch (error) {
            console.error('Detailed error:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao renomear documento.',
                description: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={isReadOnly}>
                    <Edit className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Editar Nome do Documento</AlertDialogTitle>
                    <AlertDialogDescription>
                        Insira o novo nome para o documento.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="doc-new-name">Novo Nome</Label>
                    <Input
                        id="doc-new-name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ex: Registo Criminal"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEdit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const DeleteDocumentColumnDialog = ({ document, onDelete, isReadOnly }) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleDelete = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('remove_document_column', { p_column_name: document.id });
            if (error) throw error;
            toast({ variant: 'success', title: 'Documento excluído com sucesso!' });
            onDelete();
        } catch (error) {
            console.error('Detailed error:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao excluir documento.',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive/90" disabled={isReadOnly}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isto irá excluir permanentemente o tipo de documento "{document.label}" e todos os dados associados para todos os trabalhadores.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


const EditSubcontractorDialog = ({ open, onOpenChange, user, onSuccess }) => {
  const { user: currentUser, isReadOnlyAdmin, isEncarregado } = useAuth();
  const [documentFields, setDocumentFields] = useState([]);
  const [checkedState, setCheckedState] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingFields, setLoadingFields] = useState(true);
  const { toast } = useToast();

  const fetchDocumentFields = useCallback(async () => {
    setLoadingFields(true);
    const { data, error } = await supabase.rpc('get_document_columns');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar tipos de documento.' });
      setDocumentFields([]);
    } else {
      const fields = data.map(col => {
        const colName = col.column_name;
        return {
          id: colName,
          label: colName.replace(/^doc_/, '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        };
      });
      setDocumentFields(fields);
    }
    setLoadingFields(false);
  }, [toast]);

  // Access Control Check
  useEffect(() => {
    const verifyAccess = async () => {
        if (open && isEncarregado && user && currentUser) {
            try {
                // Get obras for encarregado
                const { data: myObras } = await supabase.from('obras').select('id').eq('encarregado_id', currentUser.id);
                const myObraIds = myObras.map(o => o.id);

                if (myObraIds.length === 0) {
                    toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você não tem obras atribuídas.' });
                    onOpenChange(false);
                    return;
                }

                // Check assignment
                const { data: assignment } = await supabase
                    .from('subcontractor_obra_assignments')
                    .select('id')
                    .eq('subcontractor_id', user.id)
                    .in('obra_id', myObraIds)
                    .maybeSingle();
                
                if (!assignment) {
                    toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Este subempreiteiro não está atribuído às suas obras.' });
                    onOpenChange(false);
                }
            } catch (err) {
                console.error("Error verifying access", err);
            }
        }
    };
    
    verifyAccess();
  }, [open, isEncarregado, user, currentUser, toast, onOpenChange]);

  useEffect(() => {
    if (open) {
      fetchDocumentFields();
    }
  }, [open, fetchDocumentFields]);

  useEffect(() => {
    if (user && documentFields.length > 0) {
      const initialState = {};
      documentFields.forEach(doc => {
        initialState[doc.id] = user[doc.id] || false;
      });
      setCheckedState(initialState);
    }
  }, [user, documentFields]);

  const handleCheckboxChange = (docId, checked) => {
    setCheckedState((prev) => ({ ...prev, [docId]: checked }));
  };

  const handleSuccessManagement = () => {
    fetchDocumentFields();
    onSuccess(); // To refetch user data on the main table
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('usuarios')
      .update(checkedState)
      .eq('id', user.id);

    setLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error.message,
      });
    } else {
      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Documentos do trabalhador atualizados com sucesso.',
      });
      onSuccess();
    }
  };
  
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Documentos: {user.nome}</DialogTitle>
          <DialogDescription>
            Marque os documentos que foram entregues pelo trabalhador.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {loadingFields ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {documentFields.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Checkbox 
                            id={doc.id} 
                            checked={checkedState[doc.id] || false} 
                            onCheckedChange={(checked) => handleCheckboxChange(doc.id, checked)}
                            disabled={isReadOnlyAdmin}
                        />
                        <Label htmlFor={doc.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {doc.label}
                        </Label>
                    </div>
                    <div className="flex items-center gap-1">
                        <EditDocumentColumnDialog document={doc} onEdit={handleSuccessManagement} isReadOnly={isReadOnlyAdmin} />
                        <DeleteDocumentColumnDialog document={doc} onDelete={handleSuccessManagement} isReadOnly={isReadOnlyAdmin} />
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <AddDocumentColumnDialog onAdd={handleSuccessManagement} isReadOnly={isReadOnlyAdmin} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" onClick={handleSubmit} disabled={loading || loadingFields || isReadOnlyAdmin}>
              {(loading || loadingFields) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubcontractorDialog;