import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft } from 'lucide-react';

import RecordsValidationTab from '@/components/validation/RecordsValidationTab';
import JustificationsValidationTab from '@/components/validation/JustificationsValidationTab';
import CorrectionsValidationTab from '@/components/validation/CorrectionsValidationTab';
import MonthlyValidationTab from '@/components/validation/MonthlyValidationTab';


const AdminRecordsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Central de Validações</title>
        <meta name="description" content="Página para validar registos, justificações e correções." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-4 md:p-6"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Central de Validações</h1>
          <p className="text-muted-foreground text-lg mt-1">Aprove ou rejeite as pendências dos colaboradores.</p>
        </div>

        <div className="bg-card border p-4 sm:p-6 rounded-2xl shadow-lg">
          <Tabs defaultValue="records" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="records">Registos Diários</TabsTrigger>
              <TabsTrigger value="monthly">Registos Mensais</TabsTrigger>
              <TabsTrigger value="justifications">Justificações</TabsTrigger>
              <TabsTrigger value="corrections">Correções</TabsTrigger>
            </TabsList>
            <TabsContent value="records" className="mt-6">
              <RecordsValidationTab />
            </TabsContent>
            <TabsContent value="monthly" className="mt-6">
              <MonthlyValidationTab />
            </TabsContent>
            <TabsContent value="justifications" className="mt-6">
              <JustificationsValidationTab />
            </TabsContent>
            <TabsContent value="corrections" className="mt-6">
              <CorrectionsValidationTab />
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </>
  );
};

export default AdminRecordsPage;