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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { format, parse } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Combobox } from '@/components/ui/combobox';
import { formatObraOption } from '@/utils/formatObraDisplay';

const RegisterSubcontractorTimeDialog = ({ open, onOpenChange, worker, onSuccess }) => {
  const { user: adminUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [worksites, setWorksites] = useState([]);
  const [obraId, setObraId] = useState('');
  const [turno, setTurno] = useState('');
  const [dataRegisto, setDataRegisto] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchWorksites = async () => {
      const { data, error } = await supabase.from('obras')
        .select('id, nome, latitude, longitude')
        .order('id', { ascending: true }); // Standardized sorting
      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar obras.' });
      } else {
        setWorksites(data);
      }
    };
    fetchWorksites();
  }, [toast]);

  const handleTurnoChange = (value) => {
    setTurno(value);
    if (value === 'Manhã') {
      setHoraInicio('08:00');
      setHoraFim('12:00');
    } else if (value === 'Tarde') {
      setHoraInicio('13:00');
      setHoraFim('17:00');
    } else if (value === 'FullTime') {
      setHoraInicio('08:00');
      setHoraFim('17:00');
    } else {
      setHoraInicio('');
      setHoraFim('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!obraId || !dataRegisto || !horaInicio || !horaFim) {
      toast({
        variant: 'destructive',
        title: 'Campos em falta',
        description: 'Por favor, preencha todos os campos obrigatórios.',
      });
      return;
    }
    setLoading(true);

    const selectedWorksite = worksites.find(site => site.id.toString() === obraId);

    const startDateTime = parse(`${dataRegisto} ${horaInicio}`, 'yyyy-MM-dd HH:mm', new Date());
    const endDateTime = parse(`${dataRegisto} ${horaFim}`, 'yyyy-MM-dd HH:mm', new Date());

    const record = {
      usuario_id: worker.id,
      obra_id: parseInt(obraId, 10),
      turno,
      hora_inicio_escolhido: horaInicio,
      hora_fim_escolhido: horaFim,
      hora_inicio_real: startDateTime.toISOString(),
      hora_fim_real: endDateTime.toISOString(),
      status_validacao: 'Aprovado',
      validado_por: adminUser?.id,
      lat_inicio: selectedWorksite?.latitude,
      lon_inicio: selectedWorksite?.longitude,
      lat_fim: selectedWorksite?.latitude,
      lon_fim: selectedWorksite?.longitude,
    };

    const { error } = await supabase.from('registros_ponto').insert(record);

    setLoading(false);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao registar ponto',
        description: error.message,
      });
    } else {
      toast({
        variant: 'success',
        title: 'Sucesso!',
        description: 'Registo de ponto criado com sucesso.',
      });
      onSuccess();
    }
  };
  
  if (!worker) return null;

  const worksiteOptions = worksites.map(formatObraOption); // Standardized display

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registar Ponto para {worker.nome}</DialogTitle>
          <DialogDescription>
            Selecione a obra, data e horário. A localização e validação serão preenchidas automaticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="obra" className="text-right">Obra</Label>
            <div className="col-span-3">
              <Combobox
                options={worksiteOptions}
                value={obraId}
                onChange={setObraId}
                placeholder="Selecione a obra"
                searchPlaceholder="Pesquisar obra..."
                emptyPlaceholder="Nenhuma obra encontrada."
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="data" className="text-right">Data</Label>
            <Input id="data" type="date" value={dataRegisto} onChange={(e) => setDataRegisto(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="turno" className="text-right">Turno</Label>
            <Select onValueChange={handleTurnoChange} value={turno}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manhã">Manhã</SelectItem>
                <SelectItem value="Tarde">Tarde</SelectItem>
                <SelectItem value="FullTime">FullTime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hora_inicio" className="text-right">Início</Label>
            <Input id="hora_inicio" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hora_fim" className="text-right">Fim</Label>
            <Input id="hora_fim" type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} className="col-span-3" />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterSubcontractorTimeDialog;