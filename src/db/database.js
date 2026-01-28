// BalanceBooks Trucking - IndexedDB Database Module
// Matches BalanceBooks Pro v1.8.0 configuration

const DB_NAME = 'BalanceBooksTrucking';
const DB_VERSION = 1;

let dbInstance = null;

// Store definitions for BBT data
const STORES = {
  loads: { keyPath: 'id' },
  fuel: { keyPath: 'id' },
  ifta: { keyPath: 'id' },
  expenses: { keyPath: 'id' },
  perdiem: { keyPath: 'id' },
  settings: { keyPath: 'key' }
};

// Initialize the database
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('[IndexedDB] Database opened successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('[IndexedDB] Upgrading database schema...');

      // Create all stores
      Object.entries(STORES).forEach(([name, config]) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, config);
          console.log(`[IndexedDB] Created store: ${name}`);
        }
      });
    };
  });
};

// Generic store operations factory
const createStoreOperations = (storeName) => ({
  async getAll() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async get(key) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(item) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(key) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async replaceAll(items) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      // Clear existing data first
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add all new items
        let completed = 0;
        const total = items.length;
        
        if (total === 0) {
          resolve();
          return;
        }

        items.forEach(item => {
          const putRequest = store.put(item);
          putRequest.onsuccess = () => {
            completed++;
            if (completed === total) resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        });
      };
      
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }
});

// Settings store with key-value interface
const createSettingsOperations = () => ({
  async get(key, defaultValue = null) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result !== undefined ? result.value : defaultValue);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async set(key, value) {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAll() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.getAll();
      request.onsuccess = () => {
        const settings = {};
        request.result.forEach(item => {
          settings[item.key] = item.value;
        });
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  },

  async clear() {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
});

// Export store operations
export const db = { initDB };
export const loadsDB = createStoreOperations('loads');
export const fuelDB = createStoreOperations('fuel');
export const iftaDB = createStoreOperations('ifta');
export const expensesDB = createStoreOperations('expenses');
export const perdiemDB = createStoreOperations('perdiem');
export const settingsDB = createSettingsOperations();

// Export all data for backup
export const exportAllData = async () => {
  try {
    const [loads, fuel, ifta, expenses, perdiem, settings] = await Promise.all([
      loadsDB.getAll(),
      fuelDB.getAll(),
      iftaDB.getAll(),
      expensesDB.getAll(),
      perdiemDB.getAll(),
      settingsDB.getAll()
    ]);

    return {
      loads,
      fuelEntries: fuel,
      iftaData: ifta,
      expenses,
      perDiemDays: perdiem,
      settings
    };
  } catch (error) {
    console.error('[IndexedDB] Export failed:', error);
    throw error;
  }
};

// Import all data from backup
export const importAllData = async (data) => {
  try {
    const promises = [];

    if (data.loads) {
      promises.push(loadsDB.replaceAll(data.loads));
    }
    if (data.fuelEntries) {
      promises.push(fuelDB.replaceAll(data.fuelEntries));
    }
    if (data.iftaData) {
      promises.push(iftaDB.replaceAll(data.iftaData));
    }
    if (data.expenses) {
      promises.push(expensesDB.replaceAll(data.expenses));
    }
    if (data.perDiemDays) {
      promises.push(perdiemDB.replaceAll(data.perDiemDays));
    }
    
    // Handle settings
    if (data.settings) {
      await settingsDB.clear();
      for (const [key, value] of Object.entries(data.settings)) {
        promises.push(settingsDB.set(key, value));
      }
    }

    await Promise.all(promises);
    console.log('[IndexedDB] Import completed successfully');
    return { success: true };
  } catch (error) {
    console.error('[IndexedDB] Import failed:', error);
    return { success: false, error: error.message };
  }
};

// Clear all data
export const clearAllData = async () => {
  try {
    await Promise.all([
      loadsDB.clear(),
      fuelDB.clear(),
      iftaDB.clear(),
      expensesDB.clear(),
      perdiemDB.clear(),
      settingsDB.clear()
    ]);
    console.log('[IndexedDB] All data cleared');
    return { success: true };
  } catch (error) {
    console.error('[IndexedDB] Clear failed:', error);
    return { success: false, error: error.message };
  }
};
