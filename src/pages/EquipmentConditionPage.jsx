import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Camera, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const EquipmentConditionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { equipment, worksite, date } = location.state || {};

  const [condition, setCondition] = useState(location.state?.condition || null);
  const [isOperational, setIsOperational] = useState(null); // New state for operational check
  const [problemDescription, setProblemDescription] = useState(location.state?.problemDescription || '');
  const [problemPhoto, setProblemPhoto] = useState(location.state?.problemPhoto || null);
  const [photoPreview, setPhotoPreview] = useState(location.state?.photoPreview || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProblemPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const isContinueDisabled = () => {
    if (condition === 'yes') return false;
    if (condition === 'no') {
      // If condition is bad, we need description, photo AND operational status
      if (!problemDescription || !problemPhoto || isOperational === null) return true;
      return false;
    }
    return true; // if condition is null
  };

  // Handles the "Not Operational" submission directly here
  const submitMaintenance = async () => {
    if (!user) {
        toast({ title: "Erro", description: "Utilizador não autenticado.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
      let photoUrl = null;

      // 1. Upload Photo if exists
      if (problemPhoto) {
        const fileExt = problemPhoto.name.split('.').pop();
        const fileName = `incident_${Date.now()}.${fileExt}`;
        const filePath = `incidents/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('anexos') // Assuming 'anexos' is the bucket based on codebase
          .upload(filePath, problemPhoto);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('anexos')
          .getPublicUrl(filePath);
        
        photoUrl = publicUrl;
      }

      // 2. Create Usage Record marking it as Maintenance/Inoperative
      const { error: usageError } = await supabase
        .from('utilizacao_frota')
        .insert({
          equipamento_id: parseInt(equipment),
          obra_id: parseInt(worksite),
          funcionario_id: user.id,
          data: date,
          estado: 'Manutenção', // Critical status
          observacoes: `[INOPERACIONAL] ${problemDescription} ${photoUrl ? `| Ver foto anexa` : ''}`,
          horas_km_registadas: 0 // No usage
        });

      if (usageError) throw usageError;

      // 3. Update Equipment Status to Maintenance
      const { error: equipError } = await supabase
        .from('equipamentos')
        .update({ 
            status: 'Manutenção',
            status_manutencao: 'Manutenção',
            updated_at: new Date() 
        })
        .eq('id', parseInt(equipment));

      if (equipError) throw equipError;

      toast({
        title: "Equipamento em Manutenção",
        description: "O equipamento foi marcado como inoperacional e enviado para manutenção.",
        variant: "default", // Or success style
        duration: 5000
      });

      // Redirect to fleet dashboard/home
      navigate('/admin/frotas');

    } catch (error) {
      console.error("Erro ao registar manutenção:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registar a manutenção. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (condition === 'no' && isOperational === 'no') {
      // If not operational, submit maintenance immediately
      submitMaintenance();
    } else {
      // If operational (good or bad condition but working), proceed to next step
      const conditionState = {
        condition: condition,
        isOperational: isOperational, // Pass this state along
        problemDescription: condition === 'no' ? problemDescription : null,
        problemPhoto: condition === 'no' ? problemPhoto : null,
        photoPreview: condition === 'no' ? photoPreview : null,
      };

      navigate('/admin/frotas/horas', { state: { ...location.state, ...conditionState } });
    }
  };

  // Determine button text based on state
  const getButtonText = () => {
    if (isSubmitting) return "A registar...";
    if (condition === 'no' && isOperational === 'no') return "Registar Manutenção";
    return "Continuar";
  };

  return (
    <>
      <Helmet>
        <title>Condições do Equipamento</title>
        <meta name="description" content="Verificação das condições do equipamento antes da utilização." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-4 md:p-6"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4" disabled={isSubmitting}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Condições do Equipamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 text-center">
                <Label className="text-base">O equipamento está em boas condições de utilização?</Label>
                <div className="flex justify-center gap-4 pt-2">
                  <Button
                    onClick={() => {
                        setCondition('yes');
                        setIsOperational(null); // Reset secondary q
                    }}
                    variant={condition === 'yes' ? 'success' : 'outline'}
                    className="w-24"
                    disabled={isSubmitting}
                  >
                    <Check className="mr-2 h-4 w-4" /> Sim
                  </Button>
                  <Button
                    onClick={() => setCondition('no')}
                    variant={condition === 'no' ? 'destructive' : 'outline'}
                    className="w-24"
                    disabled={isSubmitting}
                  >
                    <X className="mr-2 h-4 w-4" /> Não
                  </Button>
                </div>
              </div>

              {condition === 'no' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 pt-4 border-t"
                >
                  {/* Problem Description */}
                  <div className="space-y-2">
                    <Label htmlFor="problem-description">Descreva o problema <span className="text-red-500">*</span></Label>
                    <Textarea
                      id="problem-description"
                      placeholder="Ex: Pneu furado, motor com barulho estranho..."
                      value={problemDescription}
                      onChange={(e) => setProblemDescription(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <Label>Fotografia do Problema <span className="text-red-500">*</span></Label>
                     {photoPreview ? (
                      <div className="relative">
                        <img src={photoPreview} alt="Pré-visualização" className="w-full h-auto max-h-60 object-contain rounded-md border" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => {
                            setProblemPhoto(null);
                            setPhotoPreview(null);
                          }}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <Label
                          htmlFor="problem-photo-input"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Camera className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Clique para carregar</span> ou arraste
                            </p>
                          </div>
                           <Input 
                              id="problem-photo-input" 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handlePhotoChange}
                              disabled={isSubmitting} 
                           />
                        </Label>
                      </div>
                    )}
                  </div>

                  {/* Is Operational Question */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-base flex items-center gap-2">
                        O equipamento ainda está operacional? <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Se responder "Não", o equipamento ficará indisponível para utilização.
                    </p>
                    <div className="flex gap-4 pt-2">
                        <Button
                            onClick={() => setIsOperational('yes')}
                            variant={isOperational === 'yes' ? 'default' : 'outline'}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Sim, ainda trabalha
                        </Button>
                        <Button
                            onClick={() => setIsOperational('no')}
                            variant={isOperational === 'no' ? 'destructive' : 'outline'}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Não, parou
                        </Button>
                    </div>
                  </div>

                  {/* Warning for Non-Operational */}
                  {isOperational === 'no' && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Atenção</AlertTitle>
                        <AlertDescription>
                          Ao confirmar, este equipamento será marcado como <strong>Manutenção</strong> e não poderá ser utilizado até ser reparado.
                        </AlertDescription>
                      </Alert>
                  )}

                </motion.div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
                Voltar
              </Button>
              <Button 
                onClick={handleContinue} 
                disabled={isContinueDisabled() || isSubmitting}
                variant={condition === 'no' && isOperational === 'no' ? "destructive" : "default"}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {getButtonText()}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default EquipmentConditionPage;