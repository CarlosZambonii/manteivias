import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, BellRing, UserCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationTestService } from '@/services/NotificationTestService';
import { useToast } from '@/components/ui/use-toast';

const NotificationTestPanel = () => {
  const { user } = useAuth();
  const { isSubscribed, subscribe, permission } = useNotifications();
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [userStatus, setUserStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserStatus = useCallback(async () => {
    if (!user) return;
    setStatusLoading(true);
    const statusResult = await NotificationTestService.getUserTodayStatus(user.id);
    setUserStatus(statusResult);
    setStatusLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUserStatus();
  }, [fetchUserStatus]);

  const handleTest = async (testName, testFn) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    setResults(prev => ({ ...prev, [testName]: null }));

    const result = await testFn();
    
    setResults(prev => ({ ...prev, [testName]: result }));
    setLoading(prev => ({ ...prev, [testName]: false }));

    toast({
      title: `Teste '${testName}' Concluído`,
      description: result.success ? 'A função foi executada com sucesso.' : `Ocorreu um erro: ${result.error}`,
      variant: result.success ? 'default' : 'destructive',
    });

    // Refresh user status after a test that might change it
    setTimeout(fetchUserStatus, 2000);
  };

  const TestButton = ({ name, description, onClick }) => (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0">
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={onClick} disabled={loading[name]}>
        {loading[name] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
        Testar
      </Button>
    </div>
  );

  const ResultBadge = ({ result }) => {
    if (!result) return null;
    if (result.success) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"><CheckCircle className="mr-2 h-4 w-4" />Sucesso: {JSON.stringify(result.data)}</Badge>;
    }
    return <Badge variant="destructive"><AlertCircle className="mr-2 h-4 w-4" />Erro: {result.error}</Badge>;
  };

  const tests = [
    { name: 'Manhã (8h)', description: 'Notifica utilizadores sem registo matinal.', fn: () => NotificationTestService.triggerScheduledCheck('check-morning-records') },
    { name: 'Meio-dia (12h)', description: 'Fecha registos da manhã e notifica.', fn: () => NotificationTestService.triggerScheduledCheck('check-noon-records') },
    { name: 'Tarde (13h)', description: 'Notifica utilizadores sem registo da tarde.', fn: () => NotificationTestService.triggerScheduledCheck('check-afternoon-records') },
    { name: 'Fim de Dia (17h)', description: 'Fecha todos os registos abertos.', fn: () => NotificationTestService.triggerScheduledCheck('check-end-of-day') },
    { name: 'Notificação Direta (Admin)', description: 'Envia notificação de teste para si mesmo.', fn: () => NotificationTestService.sendCustomTestNotification({ userId: user.id, title: 'Teste Direto', message: 'Isto é uma notificação de teste do painel.' }) },
  ];
  
  // FIX: Use permission status from context to reliably show push status
  const hasPushPermission = permission === 'granted';

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Estado do Utilizador</CardTitle>
          <CardDescription>Verifique o seu estado atual de registos e subscrição de notificações.</CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>A verificar estado...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                {/* FIX: Handle null/error states gracefully */}
                <span>{userStatus?.error ? `Erro: ${userStatus.error}` : userStatus?.status || "Sem registos ativos"}</span>
              </div>
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                 {/* FIX: Use both subscription status from DB and permission from browser */}
                <Badge variant={hasPushPermission || userStatus?.hasPushSubscription ? "secondary" : "destructive"}>
                  Subscrição Push: {hasPushPermission || userStatus?.hasPushSubscription ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              {!hasPushPermission && permission !== 'denied' && (
                <Button onClick={subscribe} size="sm">Ativar Notificações no Browser</Button>
              )}
               {permission === 'denied' && (
                 <p className="text-sm text-destructive">As notificações estão bloqueadas nas definições do seu browser.</p>
               )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Painel de Teste de Notificações</CardTitle>
          <CardDescription>Simule a execução das tarefas agendadas para testar o envio de notificações push.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {tests.map(test => (
            <div key={test.name}>
              <TestButton
                name={test.name}
                description={test.description}
                onClick={() => handleTest(test.name, test.fn)}
              />
              <div className="px-4 pb-4">
                <ResultBadge result={results[test.name]} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTestPanel;