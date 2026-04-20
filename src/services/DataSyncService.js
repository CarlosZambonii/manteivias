import { supabase } from '@/lib/customSupabaseClient';
import { OfflineStorageService } from './OfflineStorageService';

export const DataSyncService = {
  async fetchAndCacheTable(tableName) {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sync timeout')), 15000)
    );

    const fetchPromise = async () => {
        try {
            const { data, error } = await supabase.from(tableName).select('*');
            
            if (error) {
                // Just warn, don't throw to stop other syncs
                console.warn(`Supabase sync error for ${tableName}:`, error.message);
                return { success: false, error };
            }
            
            if (data) {
                await OfflineStorageService.clearTable(tableName);
                await OfflineStorageService.saveData(tableName, data);
                await OfflineStorageService.updateLastSyncTime(tableName);
                return { success: true, count: data.length };
            }
            return { success: true, count: 0 };
        } catch (error) {
            console.error(`Error syncing table ${tableName}:`, error);
            return { success: false, error };
        }
    };

    try {
        return await Promise.race([fetchPromise(), timeoutPromise]);
    } catch (e) {
        console.warn(`Sync timed out or failed for ${tableName}`, e);
        return { success: false, error: e };
    }
  },

  async syncAllTables() {
    const tables = [
      'usuarios',
      'obras',
      'registros_ponto',
      'justificação',
      'correcoes_ponto',
      'tipos_justificação',
      'feriados',
    ];

    console.log('Starting background sync...');
    // Process in parallel, but handle rejections gracefully
    const results = await Promise.allSettled(tables.map(table => this.fetchAndCacheTable(table)));
    
    // Quick summary log
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    console.log(`Background sync finished: ${successCount}/${tables.length} tables updated.`);
    
    return results;
  },

  async syncPendingChanges() {
    try {
      const queue = await OfflineStorageService.getSyncQueue();
      if (!queue || queue.length === 0) return;

      console.log(`Syncing ${queue.length} pending changes...`);

      for (const op of queue) {
        try {
          const { table, action, data, id } = op;
          let result;
          
          // Simple optimistic concurrency check or conflict resolution could go here
          // For now, Last Write Wins (LWW) is implied by just pushing the update

          if (action === 'INSERT') {
            result = await supabase.from(table).insert(data);
          } else if (action === 'UPDATE') {
            result = await supabase.from(table).update(data).eq('id', data.id);
          } else if (action === 'DELETE') {
            result = await supabase.from(table).delete().eq('id', data.id);
          }

          if (result.error) throw result.error;

          // If successful, remove from queue
          await OfflineStorageService.removeFromSyncQueue(id);
        } catch (error) {
          console.error('Failed to sync operation:', op, error);
          // TODO: Add retry count logic here in future
        }
      }
    } catch (error) {
      console.error("Error during pending changes sync:", error);
    }
  }
};