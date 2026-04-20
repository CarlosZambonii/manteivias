import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RecordsHistoryTab from '@/components/history/admin/RecordsHistoryTab';
import CorrectionsHistoryTab from '@/components/history/admin/CorrectionsHistoryTab';
import JustificationsHistoryTab from '@/components/history/admin/JustificationsHistoryTab';
import MonthlyHistoryTab from '@/components/history/admin/MonthlyHistoryTab';
import MyMonthlyHistoryTab from '@/components/history/admin/MyMonthlyHistoryTab';
import { useAuth } from '@/contexts/AuthContext';


const AdminHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user.tipo_usuario === 'admin' || user.tipo_usuario === 'admin_star';

  return (
    <>
      <Helmet>
        <title>Histórico</title>
        <meta name="description" content="Visualize o histórico de registos, correções, justificações e registos mensais de todos os colaboradores." />
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto p-4 sm:p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-6">Histórico</h1>
        
        <Tabs defaultValue="records" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="records">Registos Diários (Equipa)</TabsTrigger>
            <TabsTrigger value="corrections">Correções (Equipa)</TabsTrigger>
            <TabsTrigger value="justifications">Justificações (Equipa)</TabsTrigger>
            <TabsTrigger value="monthly">Registos Mensais (Equipa)</TabsTrigger>
            <TabsTrigger value="my-monthly">Meus Registos Mensais</TabsTrigger>
          </TabsList>
          <TabsContent value="records">
            <div className="bg-card border p-4 sm:p-6 rounded-2xl shadow-lg mt-4">
              <RecordsHistoryTab />
            </div>
          </TabsContent>
          <TabsContent value="corrections">
            <div className="bg-card border p-4 sm:p-6 rounded-2xl shadow-lg mt-4">
              <CorrectionsHistoryTab />
            </div>
          </TabsContent>
          <TabsContent value="justifications">
            <div className="bg-card border p-4 sm:p-6 rounded-2xl shadow-lg mt-4">
              <JustificationsHistoryTab />
            </div>
          </TabsContent>
           <TabsContent value="monthly">
            <div className="bg-card border p-4 sm:p-6 rounded-2xl shadow-lg mt-4">
              <MonthlyHistoryTab />
            </div>
          </TabsContent>
           <TabsContent value="my-monthly">
            <div className="bg-card border p-4 sm:p-6 rounded-2xl shadow-lg mt-4">
              <MyMonthlyHistoryTab />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  );
};

export default AdminHistoryPage;