import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineManager } from '@/contexts/OfflineManager';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export const OfflineIndicator = () => {
  const { isOnline, lastSyncTime } = useOfflineManager();

  return (
    <div className="flex items-center gap-2 text-sm">
      {isOnline ? (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
          <Wifi className="w-3 h-3 mr-1" />
          Online
        </Badge>
      ) : (
        <Badge variant="destructive">
          <WifiOff className="w-3 h-3 mr-1" />
          Offline
        </Badge>
      )}
      {lastSyncTime && isOnline && (
        <span className="text-xs text-muted-foreground hidden sm:inline-block">
          Sinc.: {format(lastSyncTime, 'HH:mm', { locale: pt })}
        </span>
      )}
    </div>
  );
};

export const OfflineBanner = () => {
  const { isOnline, isSyncing } = useOfflineManager();

  if (isOnline && !isSyncing) return null;

  return (
    <AnimatePresence>
      {(!isOnline || isSyncing) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={`${isSyncing ? 'bg-blue-500' : 'bg-amber-500'} text-white text-center text-xs py-1 px-4 font-medium flex justify-center items-center gap-2`}
        >
           {isSyncing ? (
             <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                A sincronizar dados...
             </>
           ) : (
             <>
                <WifiOff className="w-3 h-3" />
                Modo Offline - As alterações serão guardadas quando estiver online.
             </>
           )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const SyncStatus = () => {
    const { syncAll, isSyncing } = useOfflineManager();
    
    return (
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={syncAll} 
            disabled={isSyncing || !navigator.onLine}
            className="h-8 px-2"
        >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Sincronizar Agora</span>
        </Button>
    )
}