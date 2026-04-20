import React from 'react';
import { Helmet } from 'react-helmet';
import Notifications from '@/components/Notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BellRing } from 'lucide-react';

const AlertsPage = () => {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl animate-in fade-in duration-500">
      <Helmet>
        <title>Alertas e Notificações | Manteivias</title>
        <meta name="description" content="Página de alertas e notificações do sistema." />
      </Helmet>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-full">
          <BellRing className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Alertas</h1>
      </div>

      <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">As suas Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          {/* O componente Notifications assume a gestão da lista de alertas */}
          <Notifications />
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsPage;