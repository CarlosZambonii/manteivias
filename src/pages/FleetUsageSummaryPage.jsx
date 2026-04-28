import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { logAcao } from '@/lib/logService';

const SummaryItem = ({ label, value, children }) => (
  <div className="flex justify-between items-center py-3 border-b border-border/50">
    <span className="text-sm text-muted-foreground">{label}</span>
    {value && <span className="font-semibold text-right">{value}</span>}
    {children}
  </div>
);

const FleetUsageSummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [worksites, setWorksites] = useState([]);
  const [equipmentName, setEquipmentName] = useState('');
  
  const {
    equipment,
    worksite,
    date,
    condition,
    problemDescription,
    problemPhoto,
    photoPreview,
    unit,
    value
  } = location.state || {};

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Worksites
      const { data: worksiteData } = await supabase.from('obras').select('id, nome');
      if (worksiteData) setWorksites(worksiteData);

      // Fetch Equipment Name
      if (equipment) {
        const { data: eqData } = await supabase
          .from('equipamentos')
          .select('nome')
          .eq('id', equipment)
          .single();
        
        if (eqData) setEquipmentName(eqData.nome);
      }
    };
    fetchData();
  }, [equipment]);

  const getWorksiteName = (id) => {
    const found = worksites.find(w => w.id.toString() === id?.toString());
    return found ? found.nome : 'Desconhecida';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let photoUrl = null;

    // 1. Upload Photo if exists
    if (condition === 'no' && problemPhoto && typeof problemPhoto !== 'string') {
        const fileExt = problemPhoto.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `problemas_frota/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('anexos')
            .upload(filePath, problemPhoto);

        if (uploadError) {
            toast({
                title: "Erro no Upload",
                description: `Não foi possível enviar a foto: ${uploadError.message}`,
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }

        const { data } = supabase.storage.from('anexos').getPublicUrl(filePath);
        photoUrl = data.publicUrl;
    } else if (condition === 'no' && typeof photoUrl === 'string') {
        photoUrl = problemPhoto; // Preserve existing URL if user goes back and forth
    }

    // 2. Prepare Observations
    let observations = problemDescription || '';
    if (photoUrl) {
        observations += observations ? `\n\nAnexo: ${photoUrl}` : `Anexo: ${photoUrl}`;
    }
    if (unit) {
        observations += observations ? `\n\nUnidade: ${unit}` : `Unidade: ${unit}`;
    }

    // 3. Prepare Data Object matching table schema 'utilizacao_frota'
    const usageData = {
      equipamento_id: equipment,
      obra_id: worksite,
      data: date,
      funcionario_id: user?.id,
      estado: condition === 'yes' ? 'Operacional' : 'Avariado', // Correctly using 'estado' instead of 'condicoes_ok'
      observacoes: observations || null,
      horas_km_registadas: parseFloat(value),
    };

    // 4. Insert into Supabase
    const { error } = await supabase.from('utilizacao_frota').insert(usageData);

    if (error) {
      console.error("Erro inserção:", error);
      toast({
        title: "Erro ao Submeter",
        description: `Não foi possível guardar o registo: ${error.message}`,
        variant: "destructive",
      });
      setIsSubmitting(false);
    } else {
      logAcao(user, {
        acao: 'Criação',
        entidade: 'Utilização de Frota',
        modulo: 'Frotas',
        descricao: 'Utilização de equipamento registada',
        obraId: worksite ? Number(worksite) : null,
      });
      toast({
        title: "Registo Concluído!",
        description: "A utilização do equipamento foi registada com sucesso.",
        variant: "success",
      });
      navigate('/admin/frotas');
    }
  };

  if (!equipment) {
    return (
        <div className="flex flex-col justify-center items-center min-h-screen">
            <p className="text-muted-foreground">Dados do registo não encontrados.</p>
            <Button onClick={() => navigate('/admin/frotas/registar')} className="mt-4">
                Iniciar Novo Registo
            </Button>
        </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Resumo do Registo</title>
        <meta name="description" content="Resumo do registo de utilização de equipamento." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto max-w-2xl p-4 md:p-6"
      >
        <div className="flex justify-center">
            <Card className="w-full border-0 md:border md:shadow-lg">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold">Resumo do Registo</CardTitle>
                    <CardDescription>Confirme os dados antes de submeter.</CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-8 py-6">
                    <div className="bg-muted/50 rounded-lg p-6 space-y-2">
                        <SummaryItem label="Equipamento" value={equipmentName || 'A carregar...'} />
                        <SummaryItem label="Data" value={date ? format(new Date(date), 'dd/MM/yyyy', { locale: pt }) : 'N/A'} />
                        <SummaryItem label="Local" value={getWorksiteName(worksite)} />
                        <SummaryItem label="Condição">
                             <div className={`flex items-center gap-2 font-semibold ${condition === 'yes' ? 'text-green-500' : 'text-red-500'}`}>
                                {condition === 'yes' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                <span>{condition === 'yes' ? 'Operacional' : 'Avariado'}</span>
                            </div>
                        </SummaryItem>
                        <SummaryItem label={unit === 'Hora' ? "Horas" : "Dias"} value={`${value} ${unit === 'Hora' ? 'h' : 'd'}`} />

                        {condition === 'no' && (
                            <>
                                <div className="pt-4">
                                    <h4 className="font-semibold mb-2">Detalhes da Avaria</h4>
                                    <div className="border-t border-border/50">
                                        <SummaryItem label="Descrição" value={problemDescription || 'N/A'} />
                                    </div>
                                    <div className="flex justify-between items-start py-3">
                                        <span className="text-sm text-muted-foreground">Fotografia</span>
                                        {photoPreview ? <img src={photoPreview} alt="Problema" className="ml-4 h-24 w-24 rounded-md object-cover border" /> : 'Nenhuma'}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2 px-4 sm:px-8 pb-8">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(-1)} disabled={isSubmitting}>Voltar</Button>
                    <Button className="w-full sm:flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            A Submeter...
                        </>
                        ) : "Submeter Registo"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </motion.div>
    </>
  );
};

export default FleetUsageSummaryPage;