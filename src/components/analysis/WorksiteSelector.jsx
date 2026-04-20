import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Combobox } from '@/components/ui/combobox';
import { formatObraDisplay } from '@/utils/formatObraDisplay';

const WorksiteSelector = ({ onWorksiteChange }) => {
  const [worksites, setWorksites] = useState([]);
  const [selectedWorksite, setSelectedWorksite] = useState(null);
  const { toast } = useToast();

  const fetchWorksites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('obras')
        .select('id, nome')
        .order('id', { ascending: true }); // Standardized sorting

      if (error) throw error;

      const formattedWorksites = data.map(worksite => ({
        value: worksite.id.toString(),
        label: formatObraDisplay(worksite.id, worksite.nome), // Standardized display
        id: worksite.id,
        name: worksite.nome,
      }));
      setWorksites(formattedWorksites);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar obras',
        description: error.message,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchWorksites();
  }, [fetchWorksites]);

  const handleSelectWorksite = (worksiteValue) => {
    const worksite = worksites.find(w => w.value === worksiteValue);
    setSelectedWorksite(worksite);
    onWorksiteChange(worksite || null);
  };

  return (
    <Combobox
      options={worksites}
      value={selectedWorksite?.value}
      onChange={handleSelectWorksite}
      placeholder="Selecione uma obra..."
      searchPlaceholder="Procurar obra..."
      emptyPlaceholder="Nenhuma obra encontrada."
      className="w-full max-w-sm"
    />
  );
};

export default WorksiteSelector;