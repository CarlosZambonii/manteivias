import { supabase } from '@/lib/customSupabaseClient';

// Constants
const STORAGE_PREFIX = 'mv_ios_';
const QUEUE_KEY = 'mv_ios_sync_queue';
const META_KEY = 'mv_ios_meta';
const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024; // ~4.5MB safe limit for localStorage

// Helper to check quota
const checkQuota = () => {
    let total = 0;
    for (let x in localStorage) {
        if (localStorage.hasOwnProperty(x)) {
            total += ((localStorage[x].length + x.length) * 2);
        }
    }
    return {
        used: total,
        percent: (total / (5 * 1024 * 1024)) * 100,
        remaining: (5 * 1024 * 1024) - total
    };
};

// Compression helper (simple LZ-string style or just removing nulls/redundancy for now to keep it simple without extra deps)
const compressData = (data) => {
    // Basic optimization: remove null values and short keys if possible
    // For now, we rely on JSON.stringify. A real compressor like lz-string would be better but requires a dep.
    return JSON.stringify(data);
};

export const iOSOfflineManager = {
    // 1. Storage Management
    async saveData(key, data) {
        try {
            const storageKey = `${STORAGE_PREFIX}${key}`;
            const serialized = compressData(data);
            
            // Check if we have space BEFORE setting
            const size = serialized.length * 2;
            const quota = checkQuota();
            
            if (quota.used + size > MAX_STORAGE_SIZE) {
                // Trigger cleanup
                this.cleanupOldData();
            }

            localStorage.setItem(storageKey, serialized);
            this.updateMeta(key);
            return true;
        } catch (e) {
            console.error("iOS Storage Quota Exceeded or Error:", e);
            return false;
        }
    },

    getData(key) {
        try {
            const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error("Error reading iOS storage:", e);
            return null;
        }
    },

    // 2. Queue Management
    async addToSyncQueue(operation) {
        try {
            const queue = this.getData(QUEUE_KEY) || [];
            queue.push({
                ...operation,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                status: 'pending'
            });
            return this.saveData(QUEUE_KEY, queue);
        } catch (e) {
            console.error("Failed to add to iOS sync queue", e);
            return false;
        }
    },

    getSyncQueue() {
        return this.getData(QUEUE_KEY) || [];
    },

    async removeFromQueue(id) {
        const queue = this.getSyncQueue();
        const newQueue = queue.filter(item => item.id !== id);
        return this.saveData(QUEUE_KEY, newQueue);
    },

    // 3. Metadata & Cleanup
    updateMeta(key) {
        const meta = this.getData(META_KEY) || {};
        meta[key] = Date.now();
        localStorage.setItem(`${STORAGE_PREFIX}${META_KEY}`, JSON.stringify(meta));
    },

    cleanupOldData() {
        console.log("Cleaning up old iOS data...");
        // Strategy: clear tables that are easily re-fetched, keep user data
        // Priority: Keep queue, Keep user profile.
        // Delete: Old logs, maybe older cached tables
        // For now, simple implementation:
        const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
        // Sort by some logic if we had access times, but we'll just clear 'equipamentos' or 'utilizacao_frota' first if huge
        // This is a placeholder for more complex LRU logic
    },
    
    // 4. Export/Backup
    exportData() {
        const dump = {};
        Object.keys(localStorage).forEach(key => {
            if(key.startsWith(STORAGE_PREFIX)) {
                dump[key] = localStorage.getItem(key);
            }
        });
        return dump;
    },

    getStorageUsage() {
        return checkQuota();
    }
};