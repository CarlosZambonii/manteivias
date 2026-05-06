import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DataSyncService } from '@/services/DataSyncService';
import { OfflineStorageService } from '@/services/OfflineStorageService';
import { useToast } from '@/components/ui/use-toast';
import { isIOSSafari } from '@/utils/iosDetector';
import { iOSOfflineManager } from '@/services/iOSOfflineManager';
import { iOSDataSyncService } from '@/services/iOSDataSyncService';
import { IOSOfflineBanner } from '@/components/offline/iOSOfflineUI';
import { OfflineBanner } from '@/components/offline/OfflineUI';

const OfflineContext = createContext(null);

export const OfflineManagerProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const { toast } = useToast();
  
  // Detect iOS environment
  const isIOS = isIOSSafari();
  
  const initialSyncRef = useRef(false);
  // Debounce offline events: screen lock/unlock fires rapid offline+online pairs.
  // We wait 2 s before committing to "offline" — if online fires first, cancel silently.
  const offlineTimerRef = useRef(null);
  const committedOfflineRef = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = setTimeout(() => {
        if (!navigator.onLine) {
          committedOfflineRef.current = true;
          setIsOnline(false);
          toast({
            title: "Offline",
            description: "Você está offline. As alterações serão salvas localmente.",
            variant: "destructive",
            duration: 5000
          });
        }
      }, 2000);
    };

    const handleOnline = () => {
      clearTimeout(offlineTimerRef.current);
      setIsOnline(true);
      if (committedOfflineRef.current) {
        committedOfflineRef.current = false;
        toast({
          title: "Online",
          description: "A conexão foi restaurada.",
          variant: "success",
          duration: 3000
        });
        syncAll();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearTimeout(offlineTimerRef.current);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Initial Sync Logic
  useEffect(() => {
    if (navigator.onLine && !initialSyncRef.current) {
        initialSyncRef.current = true;
        setTimeout(() => {
            syncAll().catch(e => console.warn("Background initial sync warning:", e));
        }, 2000); 
    }
  }, []);

  const syncAll = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    
    setIsSyncing(true);
    try {
      if (isIOS) {
          // iOS Specific Sync Flow
          await iOSDataSyncService.processQueue();
          await iOSDataSyncService.syncAllFromSupabase();
      } else {
          // Standard / Android Sync Flow (IndexedDB)
          await Promise.allSettled([
              DataSyncService.syncPendingChanges(),
              DataSyncService.syncAllTables()
          ]);
      }
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isIOS]);

  const getOfflineData = useCallback(async (tableName) => {
    try {
        if (isIOS) {
            return iOSOfflineManager.getData(tableName) || [];
        } else {
            return await OfflineStorageService.getData(tableName);
        }
    } catch (e) {
        console.error(`Error getting offline data for ${tableName}`, e);
        return [];
    }
  }, [isIOS]);

  const addToQueue = useCallback(async (operation) => {
      if (isIOS) {
          return await iOSOfflineManager.addToSyncQueue(operation);
      } else {
          return await OfflineStorageService.addToSyncQueue(operation);
      }
  }, [isIOS]);

  return (
    <OfflineContext.Provider value={{ 
      isOnline, 
      isSyncing, 
      lastSyncTime, 
      syncAll, 
      getOfflineData,
      addToQueue,
      isIOS // Expose this so UI can adapt
    }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOfflineManager = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    return {
        isOnline: navigator.onLine,
        isSyncing: false,
        lastSyncTime: null,
        syncAll: async () => {},
        getOfflineData: async () => [],
        addToQueue: async () => {},
        isIOS: false
    };
  }
  return context;
};

// Inner component to access context
const OfflineUIWrapper = ({ children }) => {
    const { isIOS } = useOfflineManager();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <>{children}</>;

    return (
        <div className="flex flex-col min-h-screen">
            {isIOS ? <IOSOfflineBanner /> : <OfflineBanner />}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
};

// Main export component
export const OfflineDataProvider = ({ children }) => {
  return (
    <OfflineManagerProvider>
        <OfflineUIWrapper>
            {children}
        </OfflineUIWrapper>
    </OfflineManagerProvider>
  );
};