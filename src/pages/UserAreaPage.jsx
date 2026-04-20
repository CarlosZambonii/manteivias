import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Clock, FileText, Wrench, History, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

const UserAreaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  const buttonClass = "w-full h-28 text-xl bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-600 transition-all duration-300 transform hover:scale-105 flex flex-col gap-2 shadow-lg";

  const handleClockInClick = () => {
    const userRecordType = user?.tipo_registo?.toLowerCase();

    if (userRecordType === 'diario') {
      navigate('/registar-ponto/diario');
    } else if (userRecordType === 'mensal') {
      navigate('/registar-ponto/mensal');
    } else {
      if (!userRecordType) {
          toast({
              variant: "destructive",
              title: t('userArea.configError'),
              description: t('userArea.configErrorDesc')
          });
      } else {
          navigate('/registar-ponto/diario'); 
          toast({
              title: t('userArea.unknownType'),
              description: t('userArea.unknownTypeDesc'),
          });
      }
    }
  };

  return (
    <>
    <Helmet>
        <title>{t('userArea.title')}</title>
        <meta name="description" content={t('userArea.title')} />
    </Helmet>
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="flex flex-col items-center justify-center h-full"
    >
        <div className="w-full max-w-md mb-6">
             <Button variant="ghost" onClick={() => navigate('/admin/management')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('userArea.backToManagement')}
            </Button>
        </div>

      <div className="w-full max-w-md grid grid-cols-2 gap-4">
        <motion.div variants={cardVariants}>
          <Button
            onClick={handleClockInClick}
            className={buttonClass}
          >
            <Clock className="h-8 w-8" />
            <span>{t('userArea.clockIn')}</span>
          </Button>
        </motion.div>

        {/* Temporarily hidden features for testing */}
        {/* 
        <motion.div variants={cardVariants}>
          <Button
            onClick={() => navigate('/justificacoes')}
            className={buttonClass}
          >
            <FileText className="h-8 w-8" />
            <span>{t('userArea.justifications')}</span>
          </Button>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Button
            onClick={() => navigate('/ajustes')}
            className={buttonClass}
          >
            <Wrench className="h-8 w-8" />
            <span>{t('userArea.correction')}</span>
          </Button>
        </motion.div> 
        */}

        <motion.div variants={cardVariants}>
          <Button
            onClick={() => navigate('/historico')}
            className={buttonClass}
          >
            <History className="h-8 w-8" />
            <span>{t('userArea.history')}</span>
          </Button>
        </motion.div>
      </div>
    </motion.div>
    </>
  );
};

export default UserAreaPage;