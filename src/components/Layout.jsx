import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { useTime } from '@/contexts/TimeContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

const Layout = ({ children }) => {
  const { isClockedIn } = useTime();
  const { toast, dismiss } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    let activeToast;
    if (isClockedIn) {
      const { id } = toast({
        title: t('clock.activeToastTitle'),
        description: t('clock.activeToastDesc'),
        duration: Infinity,
        action: (
          <Button variant="secondary" size="sm" onClick={() => navigate('/registar-ponto')}>
            {t('clock.viewRecord')}
          </Button>
        ),
      });
      activeToast = id;
    } else {
      dismiss();
    }

    return () => {
      if (activeToast) {
        dismiss(activeToast);
      }
    };
  }, [isClockedIn, toast, dismiss, navigate, t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Header />
      <main className="container mx-auto px-4"> 
        {children}
      </main>
    </div>
  );
};

export default Layout;