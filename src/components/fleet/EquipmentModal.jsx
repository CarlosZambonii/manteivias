import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatObraDisplay } from '@/utils/formatObraDisplay';

const EquipmentModal = ({ isOpen, onClose, onSave, equipment, worksites, users }) => {
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    grupo_ativos: '',
    obra_id: '',
    encarregado: '',
    horas_km_atual: 0,
    prox_revisao_oleo_h_km: 0,
    status_manutencao: 'Funcional'
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        nome: equipment.nome || '',
        codigo: equipment.codigo || '',
        grupo_ativos: equipment.grupo_ativos || equipment.grupo || '',
        obra_id: equipment.obra_id?.toString() || '',
        encarregado: equipment.encarregado?.toString() || '',
        horas_km_atual: equipment.horas_km_atual || equipment.horas_atuais || 0,
        prox_revisao_oleo_h_km: equipment.prox_revisao_oleo_h_km || equipment.proxima_revisao_oleo || 0,
        status_manutencao: equipment.status_manutencao || equipment.status || 'Funcional'
      });
    } else {
      setFormData({
        nome: '',
        codigo: '',
        grupo_ativos: '',
        obra_id: '',
        encarregado: '',
        horas_km_atual: 0,
        prox_revisao_oleo_h_km: 0,
        status_manutencao: 'Funcional'
      });
    }
  }, [equipment, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{equipment ? 'Editar Equipamento' : 'Adicionar Equipamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" name="codigo" value={formData.codigo} onChange={handleChange} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="grupo_ativos">Grupo</Label>
            <Input id="grupo_ativos" name="grupo_ativos" value={formData.grupo_ativos} onChange={handleChange} placeholder="Ex: Escavadoras, Camiões..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Localização (Obra)</Label>
              <Select value={formData.obra_id} onValueChange={(val) => handleSelectChange('obra_id', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem alocação</SelectItem>
                  {worksites.map(w => (
                    <SelectItem key={w.id} value={w.id.toString()}>
                      {formatObraDisplay(w.id, w.nome)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Encarregado Responsável</Label>
               <Select value={formData.encarregado} onValueChange={(val) => handleSelectChange('encarregado', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horas_km_atual">Horas/KM Atuais</Label>
              <Input type="number" id="horas_km_atual" name="horas_km_atual" value={formData.horas_km_atual} onChange={handleChange} step="0.1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prox_revisao_oleo_h_km">Próx. Revisão (Óleo)</Label>
              <Input type="number" id="prox_revisao_oleo_h_km" name="prox_revisao_oleo_h_km" value={formData.prox_revisao_oleo_h_km} onChange={handleChange} step="0.1" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status Manutenção</Label>
            <Select value={formData.status_manutencao} onValueChange={(val) => handleSelectChange('status_manutencao', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Funcional">Funcional</SelectItem>
                <SelectItem value="Manutenção">Manutenção</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentModal;