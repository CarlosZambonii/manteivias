import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Building } from 'lucide-react';
import SubcontractorHistory from '@/components/history/SubcontractorHistory';

const AdminSubcontractorHistoryPage = () => {
  return (
    <>
      <Helmet>
        <title>Histórico de Subempreiteiros - Manteivias</title>
        <meta name="description" content="Consulte o histórico de registos de ponto dos trabalhadores subempreiteiros." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Histórico de Subempreiteiros</h1>
          </div>
        </div>
        <SubcontractorHistory />
      </motion.div>
    </>
  );
};

export default AdminSubcontractorHistoryPage;