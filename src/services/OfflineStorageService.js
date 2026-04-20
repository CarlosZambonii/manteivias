import { openDB } from 'idb';

const DB_NAME = 'manteivias_db';
const DB_VERSION = 1;

const STORES = [
  'usuarios',
  'obras',
  'registros_ponto',
  'justificação',
  'correcoes_ponto',
  'tipos_justificação',
  'equipamentos',
  'utilizacao_frota',
  'feriados',
  'sync_queue', // For pending changes
  'meta' // For sync timestamps
];

// Helper to safely get DB without blocking forever
const getDB = async () => {
    try {
        return await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
              STORES.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                  const store = db.createObjectStore(storeName, { 
                    keyPath: storeName === 'sync_queue' || storeName === 'meta' ? 'id' : 'id',
                    autoIncrement: storeName === 'sync_queue' 
                  });
                  
                  // Indexes
                  if (storeName === 'registros_ponto') {
                    if (!store.indexNames.contains('usuario_id')) store.createIndex('usuario_id', 'usuario_id', { unique: false });
                    if (!store.indexNames.contains('hora_inicio_real')) store.createIndex('hora_inicio_real', 'hora_inicio_real', { unique: false });
                  }
                  if (storeName === 'justificação') {
                    if (!store.indexNames.contains('usuario_id')) store.createIndex('usuario_id', 'usuario_id', { unique: false });
                  }
                  if (storeName === 'correcoes_ponto') {
                    if (!store.indexNames.contains('usuario_id')) store.createIndex('usuario_id', 'usuario_id', { unique: false });
                  }
                }
              });
            },
            blocking() {
                // If another tab has an older version open, this might block.
                console.warn("Database is blocking close");
            },
            terminated() {
                console.error("Database connection terminated unexpectedly");
            }
        });
    } catch (e) {
        console.error("FATAL: Could not open IndexedDB", e);
        throw e;
    }
}

export const OfflineStorageService = {
  // Expose for initialization check if needed
  async checkConnection() {
      try {
          const db = await getDB();
          return !!db;
      } catch {
          return false;
      }
  },

  async saveData(tableName, data) {
    try {
      const db = await getDB();
      const tx = db.transaction(tableName, 'readwrite');
      const store = tx.objectStore(tableName);
      
      if (Array.isArray(data)) {
        await Promise.all(data.map(item => store.put(item)));
      } else {
        await store.put(data);
      }
      await tx.done;
    } catch (error) {
      console.error(`Failed to save data to ${tableName}:`, error);
    }
  },

  async getData(tableName) {
    try {
      const db = await getDB();
      return await db.getAll(tableName);
    } catch (error) {
      console.error(`Failed to get data from ${tableName}:`, error);
      return [];
    }
  },

  async clearTable(tableName) {
    try {
      const db = await getDB();
      await db.clear(tableName);
    } catch (error) {
      console.error(`Failed to clear table ${tableName}:`, error);
    }
  },

  async getLastSyncTime(tableName) {
    try {
      const db = await getDB();
      const meta = await db.get('meta', tableName);
      return meta ? meta.timestamp : null;
    } catch (error) {
      return null;
    }
  },

  async updateLastSyncTime(tableName) {
    try {
      const db = await getDB();
      await db.put('meta', { id: tableName, timestamp: Date.now() });
    } catch (error) {
      console.error(`Failed to update sync time for ${tableName}:`, error);
    }
  },

  async addToSyncQueue(operation) {
    try {
      const db = await getDB();
      await db.add('sync_queue', {
        ...operation,
        timestamp: Date.now(),
        status: 'pending'
      });
    } catch (error) {
      console.error("Failed to add to sync queue:", error);
    }
  },

  async getSyncQueue() {
    try {
      const db = await getDB();
      return await db.getAll('sync_queue');
    } catch (error) {
      return [];
    }
  },

  async removeFromSyncQueue(id) {
    try {
      const db = await getDB();
      await db.delete('sync_queue', id);
    } catch (error) {
      console.error(`Failed to remove item ${id} from sync queue:`, error);
    }
  }
};