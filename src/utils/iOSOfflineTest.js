import { iOSOfflineManager } from '@/services/iOSOfflineManager';

// Expose testing utilities to window object for console access
if (typeof window !== 'undefined') {
    window.mvTest = {
        simulateOffline: () => {
            console.log("Simulating offline mode... (Note: this only affects app logic, not actual network)");
            window.dispatchEvent(new Event('offline'));
        },
        simulateOnline: () => {
            console.log("Simulating online mode...");
            window.dispatchEvent(new Event('online'));
        },
        checkStorage: () => {
            const usage = iOSOfflineManager.getStorageUsage();
            console.table(usage);
            
            console.log("--- Stored Keys ---");
            Object.keys(localStorage).forEach(key => {
                if(key.includes('mv_ios')) {
                     const size = localStorage.getItem(key).length;
                     console.log(`${key}: ${(size/1024).toFixed(2)} KB`);
                }
            });
        },
        clearStorage: () => {
            if(confirm("Are you sure? This will wipe all iOS local data.")) {
                Object.keys(localStorage).forEach(key => {
                    if(key.includes('mv_ios')) {
                        localStorage.removeItem(key);
                    }
                });
                console.log("Storage cleared.");
            }
        },
        testQueue: async () => {
            console.log("Adding test item to queue...");
            await iOSOfflineManager.addToSyncQueue({
                table: 'test_table',
                action: 'INSERT',
                data: { test: true, timestamp: Date.now() }
            });
            console.log("Queue:", iOSOfflineManager.getSyncQueue());
        }
    };
    
    console.log("🛠️ iOS Offline Test Utilities Loaded. Use window.mvTest to access.");
}