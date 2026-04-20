import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTime } from '@/contexts/TimeContext';
import { Helmet } from 'react-helmet';
import ClockInForm from '@/components/clock/ClockInForm';
import ClockOutForm from '@/components/clock/ClockOutForm';
import { useAutoCloseRecords } from '@/hooks/useAutoCloseRecords';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLanguage } from '@/hooks/useLanguage';
import { useActiveRecordNotificationManager } from '@/hooks/ActiveRecordNotificationManager';
import { useAutoCloseNotificationManager } from '@/hooks/AutoCloseNotificationManager';

const ClockInPage = () => {
  const navigate = useNavigate();
  const { isClockedIn, clockOut } = useTime();
  const { user } = useAuth();
  const { checkAndAutoClose, error: autoCloseError } = useAutoCloseRecords();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Initialize notification managers
  useActiveRecordNotificationManager(user?.id);
  useAutoCloseNotificationManager(user?.id);

  useEffect(() => {
    let mounted = true;
    
    const runAutoClose = async () => {
        if (user?.id) {
            try {
                const { closedCount } = await checkAndAutoClose(user.id);
                if (mounted && closedCount > 0) {
                    toast({
                        title: t('history.updated'),
                        description: `${closedCount} ${t('history.updatedDesc')}`,
                        duration: 4000
                    });
                    
                    if (isClockedIn) {
                       clockOut();
                    }
                }
            } catch (err) {
                console.error("Auto close check failed in page:", err);
            }
        }
    };
    
    runAutoClose();
    
    return () => {
        mounted = false;
    };
  }, [user?.id, checkAndAutoClose, toast, isClockedIn, clockOut, t]);

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
        
        {autoCloseError && (
             <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('common.error')}</AlertTitle>
                <AlertDescription>
                    {t('common.error')} auto-close.
                </AlertDescription>
            </Alert>
        )}

        {isClockedIn ? <ClockOutForm /> : <ClockInForm />}
        
      </motion.div>
    </>
  );
};

export default ClockInPage;