import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NotificationTestPanel from '@/components/admin/NotificationTestPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Helmet } from 'react-helmet';

const TestPanelPage = () => {
  const navigate = useNavigate();
  const { isAdminStar, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  if (!isAuthenticated || !isAdminStar) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <Helmet>
          <title>Acesso Negado</title>
        </Helmet>
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground mb-4">
          Você não tem permissão para aceder a esta página.
        </p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar à Página Inicial
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Painel de Notificações</title>
        <meta name="description" content="Painel para testar notificações." />
      </Helmet>
      <div className="container mx-auto py-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <NotificationTestPanel />
      </div>
    </div>
  );
};

export default TestPanelPage;