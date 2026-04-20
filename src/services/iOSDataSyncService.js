import { supabase } from '@/lib/customSupabaseClient';
import { iOSOfflineManager } from './iOSOfflineManager';

const TABLES_TO_SYNC = [
    'usuarios',
    'obras',
    'registros_ponto',
    'justificação',
    'correcoes_ponto',
    'tipos_justificação',
    'feriados'
];

export const iOSDataSyncService = {
    async syncAllFromSupabase() {
        console.log("Starting iOS-optimized sync...");
        const results = [];
        
        for (const table of TABLES_TO_SYNC) {
            try {
                // Fetch only what's needed. Maybe filter by user ID/company if possible to save space
                // For now, we fetch all but limit columns if needed in future
                const { data, error } = await supabase.from(table).select('*');
                
                if (error) throw error;
                
                if (data) {
                    const saved = await iOSOfflineManager.saveData(table, data);
                    results.push({ table, success: saved, count: data.length });
                }
            } catch (e) {
                console.error(`iOS Sync failed for table ${table}`, e);
                results.push({ table, success: false, error: e.message });
            }
        }
        return results;
    },

    async processQueue() {
        if (!navigator.onLine) return;
        
        const queue = iOSOfflineManager.getSyncQueue();
        if (queue.length === 0) return;

        console.log(`Processing ${queue.length} iOS offline operations...`);

        for (const op of queue) {
            try {
                const { table, action, data, id } = op;
                let result;

                // Simple exponential backoff could be implemented here with a 'retryCount' in the op object
                
                if (action === 'INSERT') {
                    result = await supabase.from(table).insert(data);
                } else if (action === 'UPDATE') {
                    result = await supabase.from(table).update(data).eq('id', data.id);
                } else if (action === 'DELETE') {
                    result = await supabase.from(table).delete().eq('id', data.id);
                }

                if (result.error) throw result.error;

                await iOSOfflineManager.removeFromQueue(id);
                
            } catch (e) {
                console.error("Failed to process iOS queue item", e);
                // Mark for retry or alert user
            }
        }
    }
};