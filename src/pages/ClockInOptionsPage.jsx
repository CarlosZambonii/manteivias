import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Loader2, ChevronLeft, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';

const ClockInOptionsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(true);

  const syncUser = useCallback(async () => {
    setIsSyncing(true);
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error || !data) {
          toast({
            variant: 'destructive',
            title: 'Erro de sessão',
            description: 'A sua sessão expirou ou é inválida. Por favor, faça login novamente.',
          });
          logout();
          return;
        }
        
        if (data) {
          updateUser(data);
        }
      } catch (e) {
         toast({
            variant: 'destructive',
            title: 'Erro de sessão',
            description: 'Ocorreu um problema ao verificar a sua sessão. Por favor, faça login novamente.',
          });
         logout();
      } finally {
        setIsSyncing(false);
      }
    } else {
       setIsSyncing(false);
    }
  }, [user?.id, updateUser, toast, logout]);

  useEffect(() => {
    syncUser();
  }, [syncUser]);

  const handleNavigation = (path) => {
    if (isSyncing) return;
    navigate(path);
  };

  const userRecordType = user?.tipo_registo?.toLowerCase();

  if (isSyncing) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground">
        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
        <p className="mt-4 text-lg">A sincronizar dados...</p>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Registar Ponto | Manteivias</title>
        <meta name="description" content="Escolha o tipo de registo de ponto que deseja fazer." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-full p-4"
      >
        <div className="w-full max-w-md mb-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Registar Ponto</CardTitle>
            <CardDescription>Selecione o seu tipo de registo para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userRecordType === 'diario' && (
              <Button
                className="w-full h-24 text-lg flex-col gap-2"
                onClick={() => handleNavigation('/registar-ponto/diario')}
                disabled={isSyncing}
              >
                <Clock className="h-8 w-8" />
                Registo Diário
              </Button>
            )}
            {userRecordType === 'mensal' && (
              <Button
                className="w-full h-24 text-lg flex-col gap-2"
                onClick={() => handleNavigation('/registar-ponto/mensal')}
                disabled={isSyncing}
              >
                <Calendar className="h-8 w-8" />
                Registo Mensal
              </Button>
            )}
            {!userRecordType && !isSyncing && (
                 <div className="text-center py-10 px-4 bg-muted/50 rounded-lg">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <h3 className="mt-4 text-lg font-medium">Tipo de Registo não Definido</h3>
                    <p className="mt-1 text-sm text-muted-foreground">O seu perfil não tem um tipo de registo configurado. Contacte um administrador.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
};

export default ClockInOptionsPage;