import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const powerBiUrl = "https://app.powerbi.com/view?r=eyJrIjoiNTE2N2RjMTctNjUyOS00ZTI1LWFmNzYtMGI4M2M3ZDQyNjJhIiwidCI6ImM0NWE1ZGM4LTJhYTMtNGEzZS05NzliLTc2YjhiZmVjMzUxNyIsImMiOjl9";

  return (
    <>
      <Helmet>
        <title>Analisar Dados</title>
        <meta name="description" content="Dashboard interativo com dados da aplicação." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full flex flex-col h-[calc(100vh-100px)]"
      >
        <div className="flex-shrink-0">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>

        <div className="flex-grow bg-card border rounded-lg shadow-lg overflow-hidden">
          <iframe
            title="Relatório Power BI"
            width="100%"
            height="100%"
            src={powerBiUrl}
            frameBorder="0"
            allowFullScreen={true}
            className="border-none"
          ></iframe>
        </div>
      </motion.div>
    </>
  );
};

export default AdminDashboardPage;