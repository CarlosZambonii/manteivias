import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isIOS } from '@/utils/iosDetector';
import { NotificationService } from '@/services/NotificationService';

const STORAGE_KEY = 'ios_notif_prompt_dismissed';

const isStandalone = () =>
  window.navigator.standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

const IOSNotificationPrompt = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIOS()) return;
    if (!isStandalone()) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    setVisible(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const handleEnable = async () => {
    const permission = await NotificationService.requestPermission();
    if (permission === 'granted' || permission === 'denied') {
      handleDismiss();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Ativar notificações push</p>
            <p className="text-xs text-zinc-400">Receba alertas de aprovações em tempo real.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/90" onClick={handleEnable}>
              Ativar
            </Button>
            <button onClick={handleDismiss} className="text-zinc-500 hover:text-zinc-300 transition-colors" aria-label="Fechar">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IOSNotificationPrompt;
