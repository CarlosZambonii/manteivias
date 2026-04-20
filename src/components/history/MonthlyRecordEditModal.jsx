import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { formatObraDisplay } from '@/utils/formatObraDisplay';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MonthlyRecordEditModal = ({ isOpen, onOpenChange, recordGroup, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [worksites, setWorksites] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchWorksites = async () => {
      const { data, error } = await supabase.from('obras').select('id, nome').order('id', { ascending: true });
      if (!error && data) {
        setWorksites(data);
      }
    };
    fetchWorksites();
  }, []);

  useEffect(() => {
    if (recordGroup && isOpen) {
      setAllocations(
        recordGroup.records.map((r, index) => ({
          _id: index, // Local ID for key management
          obra_id: String(r.obra_id),
          percentagem: r.percentagem,
        }))
      );
    }
  }, [recordGroup, isOpen]);

  const handleAddAllocation = () => {
    setAllocations([...allocations, { _id: Date.now(), obra_id: '', percentagem: '' }]);
  };

  const handleRemoveAllocation = (idToRemove) => {
    setAllocations(allocations.filter(a => a._id !== idToRemove));
  };

  const handleAllocationChange = (id, field, value) => {
    setAllocations(allocations.map(a => 
      a._id === id ? { ...a, [field]: value } : a
    ));
  };

  const currentTotal = allocations.reduce((sum, a) => sum + Number(a.percentagem || 0), 0);
  const remaining = 100 - currentTotal;

  const handleSave = async () => {
    if (currentTotal !== 100) {
      toast({ variant: 'destructive', title: 'Atenção', description: 'O total das percentagens deve ser exatamente 100%.' });
      return;
    }

    const hasEmpty = allocations.some(a => !a.obra_id || !a.percentagem || Number(a.percentagem) <= 0);
    if (hasEmpty) {
      toast({ variant: 'destructive', title: 'Atenção', description: 'Preencha todas as obras e garanta que as percentagens são maiores que 0.' });
      return;
    }

    const uniqueObras = new Set(allocations.map(a => a.obra_id));
    if (uniqueObras.size !== allocations.length) {
       toast({ variant: 'destructive', title: 'Atenção', description: 'Não pode selecionar a mesma obra mais do que uma vez.' });
       return;
    }

    setIsSaving(true);
    try {
      // 1. Mark existing records for this month as cancelled instead of deleting them
      const { error: cancelError } = await supabase
        .from('registros_mensais')
        .update({ status_validacao: 'Cancelado' })
        .eq('usuario_id', user.id)
        .eq('mes', recordGroup.dateKey)
        .eq('data_submissao', recordGroup.data_submissao);

      if (cancelError) throw cancelError;

      // 2. Insert new allocations with updated values
      const insertData = allocations.map(a => ({
        usuario_id: user.id,
        mes: recordGroup.dateKey,
        obra_id: parseInt(a.obra_id),
        percentagem: Number(a.percentagem),
        status_validacao: 'Pendente',
        data_submissao: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('registros_mensais')
        .insert(insertData);

      if (insertError) throw insertError;

      toast({ title: 'Sucesso', description: 'Registo mensal atualizado com sucesso.' });
      onSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao guardar', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!recordGroup) return null;

  const formattedMonth = format(parseISO(recordGroup.dateKey), 'MMMM yyyy', { locale: pt });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-xl rounded-xl max-h-[90vh] flex flex-col p-0 bg-background overflow-hidden">
        
        <DialogHeader className="px-6 py-5 border-b shrink-0 bg-muted/10">
          <DialogTitle className="text-xl capitalize">
            Editar Registo - {formattedMonth}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto custom-scrollbar flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between mb-2">
             <Label className="text-base font-semibold">Alocações de Obra</Label>
             <div className="flex items-center gap-2">
               <span className="text-sm text-muted-foreground">Total:</span>
               <span className={`font-bold text-lg ${currentTotal === 100 ? 'text-green-600' : currentTotal > 100 ? 'text-red-600' : 'text-primary'}`}>
                 {currentTotal}%
               </span>
             </div>
          </div>

          {currentTotal !== 100 && (
             <Alert variant={currentTotal > 100 ? "destructive" : "default"} className={currentTotal < 100 ? "border-amber-500/50 bg-amber-500/10 text-amber-700" : ""}>
               <AlertCircle className={`h-4 w-4 ${currentTotal < 100 ? "text-amber-600" : ""}`} />
               <AlertDescription>
                 {currentTotal > 100 
                   ? `O total ultrapassa 100% (excesso de ${currentTotal - 100}%).` 
                   : `Falta alocar ${remaining}% para atingir os 100%.`}
               </AlertDescription>
             </Alert>
          )}

          <div className="space-y-4">
            {allocations.map((alloc, index) => (
              <div key={alloc._id} className="flex gap-3 items-start bg-muted/20 p-3 rounded-lg border">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Obra</Label>
                  <Select 
                    value={alloc.obra_id} 
                    onValueChange={(val) => handleAllocationChange(alloc._id, 'obra_id', val)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione a obra" />
                    </SelectTrigger>
                    <SelectContent>
                      {worksites.map(w => (
                        <SelectItem key={w.id} value={String(w.id)}>
                          {formatObraDisplay(w.id, w.nome)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-24 space-y-2">
                  <Label className="text-xs">Percentagem</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={alloc.percentagem}
                      onChange={(e) => handleAllocationChange(alloc._id, 'percentagem', e.target.value)}
                      className="pr-6 bg-background"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveAllocation(alloc._id)}
                    disabled={allocations.length === 1}
                    className="text-red-500 hover:text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            className="w-full border-dashed" 
            onClick={handleAddAllocation}
            disabled={currentTotal >= 100}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Obra
          </Button>

        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto" disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || currentTotal !== 100} className="w-full sm:w-auto">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Alterações
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default MonthlyRecordEditModal;