import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineSyncIndicator = ({ isOnline, syncStatus, pendingCount, onRetry }) => {
  // Don't show anything if online, idle, and no pending items
  if (isOnline && syncStatus === 'idle' && pendingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full shadow-lg px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors duration-300",
          !isOnline ? "bg-slate-900 text-white" : 
          syncStatus === 'syncing' ? "bg-blue-600 text-white" :
          syncStatus === 'error' ? "bg-red-600 text-white" :
          "bg-green-600 text-white"
        )}
      >
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Modo Offline</span>
            {pendingCount > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                {pendingCount} pendentes
              </span>
            )}
          </>
        ) : syncStatus === 'syncing' ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Sincronizando...</span>
          </>
        ) : syncStatus === 'error' ? (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>Erro na Sincronização</span>
            <button 
              onClick={onRetry}
              className="ml-2 underline underline-offset-2 hover:text-white/80"
            >
              Tentar
            </button>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Sincronizado</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineSyncIndicator;