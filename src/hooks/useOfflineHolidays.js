import { useState, useEffect, useCallback } from 'react';
import { OfflineStorageService } from '@/services/OfflineStorageService';
import { useOfflineManager } from '@/contexts/OfflineManager';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export const useOfflineHolidays = () => {
  const { isOnline, isIOS } = useOfflineManager();
  const [offlineData, setOfflineData] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error
  const { toast } = useToast();

  // Load offline data on mount
  useEffect(() => {
    loadOfflineData();
  }, []);

  const loadOfflineData = async () => {
    try {
      const data = await OfflineStorageService.getData('justificação');
      const queue = await OfflineStorageService.getSyncQueue();
      
      // Filter queue for holiday related actions
      const holidayActions = queue.filter(item => 
        item.type === 'UPDATE_HOLIDAY_STATUS' || item.table === 'justificação'
      );
      
      setOfflineData(data);
      setPendingActions(holidayActions);
    } catch (error) {
      console.error('Error loading offline holiday data:', error);
    }
  };

  const saveHolidaysOffline = async (data) => {
    await OfflineStorageService.saveData('justificação', data);
    setOfflineData(data);
  };

  const addPendingAction = async (action) => {
    const queueItem = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      status: 'pending',
      table: 'justificação'
    };
    
    await OfflineStorageService.addToSyncQueue(queueItem);
    setPendingActions(prev => [...prev, queueItem]);
    
    // Update local optimistic state if needed
    // This requires the UI to merge offlineData with pendingActions logic
    // which is handled in the main component usually
  };

  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return;

    setSyncStatus('syncing');
    let successCount = 0;
    let failCount = 0;

    for (const action of pendingActions) {
      try {
        if (action.type === 'UPDATE_HOLIDAY_STATUS') {
          const { error } = await supabase
            .from('justificação')
            .update(action.payload)
            .eq('id', action.recordId);

          if (error) throw error;
        }

        // Remove from queue on success
        await OfflineStorageService.removeFromSyncQueue(action.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        failCount++;
      }
    }

    // Refresh pending actions list
    const remainingQueue = await OfflineStorageService.getSyncQueue();
    const remainingHolidays = remainingQueue.filter(item => 
        item.type === 'UPDATE_HOLIDAY_STATUS' || item.table === 'justificação'
    );
    setPendingActions(remainingHolidays);

    if (failCount > 0) {
      setSyncStatus('error');
      toast({
        variant: 'destructive',
        title: 'Erro na Sincronização',
        description: `Falha ao sincronizar ${failCount} ações. Tentaremos novamente mais tarde.`
      });
    } else if (successCount > 0) {
      setSyncStatus('synced');
      toast({
        variant: 'success',
        title: 'Sincronização Concluída',
        description: `${successCount} ações pendentes foram enviadas com sucesso.`
      });
      setTimeout(() => setSyncStatus('idle'), 3000);
    } else {
      setSyncStatus('idle');
    }
  }, [isOnline, pendingActions, toast]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPendingActions();
    }
  }, [isOnline, pendingActions.length, syncPendingActions]);

  return {
    offlineData,
    pendingActions,
    syncStatus,
    saveHolidaysOffline,
    addPendingAction,
    syncPendingActions,
    getHolidaysOffline: () => offlineData,
    isOnline
  };
};