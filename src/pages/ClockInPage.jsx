import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTime } from '@/contexts/TimeContext';
import { Helmet } from 'react-helmet';
import ClockInForm from '@/components/clock/ClockInForm';
import ClockOutForm from '@/components/clock/ClockOutForm';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useActiveRecordNotificationManager } from '@/hooks/ActiveRecordNotificationManager';
import { useAutoCloseNotificationManager } from '@/hooks/AutoCloseNotificationManager';

const ClockInPage = () => {
  const navigate = useNavigate();
  const { isClockedIn, isLoadingTime } = useTime();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Initialize notification managers
  useActiveRecordNotificationManager(user?.id);
  useAutoCloseNotificationManager(user?.id);

  return (
    <>
      <Helmet>
        <title>{isClockedIn ? t('clock.activeToastTitle') : t('clock.title')}</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl mx-auto"
      >
        {!isClockedIn && (
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        )}
        
        {isLoadingTime ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isClockedIn ? <ClockOutForm /> : <ClockInForm />}
        
      </motion.div>
    </>
  );
};

export default ClockInPage;