import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from "@/components/ui/use-toast";

const FleetUsageGuidePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isChecked, setIsChecked] = useState(false);
  const [manualText, setManualText] = useState(null);
  const [loadingManual, setLoadingManual] = useState(true);

  // Preserve the state from the previous page
  const { equipment, worksite, date } = location.state || {};

  useEffect(() => {
    const fetchManual = async () => {
      if (!equipment) return;

      setLoadingManual(true);
      const { data, error } = await supabase
        .from('equipamentos')
        .select('manual_utilizacao')
        .eq('id', equipment)
        .single();

      if (error) {
        console.error('Error fetching manual:', error);
        toast({
          title: "Erro ao carregar manual",
          description: "Não foi possível carregar as instruções do equipamento.",
          variant: "destructive",
        });
      } else {
        setManualText(data?.manual_utilizacao);
      }
      setLoadingManual(false);
    };

    fetchManual();
  }, [equipment, toast]);

  const handleContinue = () => {
    // Navigate to the new page, passing the state along
    navigate('/admin/frotas/condicoes', { state: { equipment, worksite, date } });
  };
  
  const handleBack = () => {
    navigate(-1);
  }

  // Default manual text if none is provided in database
  const defaultManual = [
    "1. Verifique o estado geral do equipamento antes de cada utilização (níveis de óleo, combustível, pneus, etc.).",
    "2. Utilize sempre o Equipamento de Proteção Individual (EPI) adequado.",
    "3. Opere o equipamento apenas se estiver devidamente habilitado e autorizado.",
    "4. Não exceda a capacidade de carga ou os limites de operação do equipamento.",
    "5. Em caso de anomalia, pare imediatamente o equipamento e reporte ao seu superior.",
    "6. No final da utilização, limpe e estacione o equipamento em local seguro e designado."
  ];

  return (
    <>
      <Helmet>
        <title>Guia de Utilização de Equipamento</title>
        <meta name="description" content="Guia e confirmação de leitura para a utilização de equipamentos da frota." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-4 md:p-6"
      >
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Guia de Utilização e Segurança</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-background/50 max-h-96 overflow-y-auto space-y-2 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground mb-2">Instruções de Utilização:</p>
                
                {loadingManual ? (
                  <p className="italic">A carregar instruções...</p>
                ) : manualText ? (
                  <div className="whitespace-pre-wrap">{manualText}</div>
                ) : (
                   // Fallback to default list if manual_utilizacao is empty
                   defaultManual.map((instruction, index) => (
                     <p key={index}>{instruction}</p>
                   ))
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={isChecked} onCheckedChange={setIsChecked} />
                <Label htmlFor="terms" className="cursor-pointer">
                  Confirmo que li e compreendi a guia de utilização e segurança.
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button onClick={handleContinue} disabled={!isChecked}>
                Continuar
              </Button>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default FleetUsageGuidePage;