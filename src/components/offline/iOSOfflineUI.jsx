import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Smartphone, Database } from 'lucide-react';
import { useOfflineManager } from '@/contexts/OfflineManager';
import { iOSOfflineManager } from '@/services/iOSOfflineManager';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';

export const IOSOfflineBanner = () => {
  const { isOnline, isSyncing, lastSyncTime } = useOfflineManager();
  const [storageUsage, setStorageUsage] = useState({ percent: 0, used: 0 });

  useEffect(() => {
    // Check storage usage occasionally
    const check = () => {
        const usage = iOSOfflineManager.getStorageUsage();
        setStorageUsage(usage);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [isSyncing]); // Update when sync status changes

  if (isOnline && !isSyncing && storageUsage.percent < 80) return null;

  return (
    <div className="bg-slate-50 border-b border-slate-200 p-2 text-xs">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                {isOnline ? (
                   <span className="text-green-600 font-bold flex items-center"><Wifi className="w-3 h-3 mr-1"/> Online</span> 
                ) : (
                   <span className="text-red-600 font-bold flex items-center"><WifiOff className="w-3 h-3 mr-1"/> Offline (iOS Mode)</span>
                )}
                
                {lastSyncTime && (
                    <span className="text-slate-500">
                        Última Sinc.: {format(lastSyncTime, 'HH:mm')}
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-1">
                 <Database className="w-3 h-3 text-slate-400"/>
                 <span className="text-slate-500">{storageUsage.percent.toFixed(0)}% Cheio</span>
            </div>
        </div>

        {/* Warning if storage is getting full */}
        {storageUsage.percent > 80 && (
             <Alert variant="destructive" className="py-2 h-auto text-xs mb-2">
                <Smartphone className="h-4 w-4" />
                <AlertTitle>Armazenamento iOS Quase Cheio</AlertTitle>
                <AlertDescription>
                    O espaço local está a acabar. A aplicação pode ficar lenta ou não guardar novos dados.
                </AlertDescription>
            </Alert>
        )}
        
        {/* Progress Bar for Storage */}
        <Progress value={storageUsage.percent} className="h-1 w-full" indicatorClassName={storageUsage.percent > 90 ? 'bg-red-500' : 'bg-blue-500'} />
    </div>
  );
};