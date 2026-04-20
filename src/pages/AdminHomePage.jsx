import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const AdminHomePage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Página Não Encontrada</title>
        <meta name="description" content="A página que você está procurando não existe." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 text-center"
      >
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-2xl text-foreground mb-8">Página Não Encontrada</p>
        <Button onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </motion.div>
    </>
  );
};

export default AdminHomePage;