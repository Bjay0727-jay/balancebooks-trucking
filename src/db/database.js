/**
 * BalanceBooks Trucking - IndexedDB Database Module v2.0
 * Enhanced with Driver, Truck, and Pay Statement support
 */

const DB_NAME = 'BalanceBooksTrucking';
const DB_VERSION = 2; // Upgraded from v1

// All data stores
const STORES = {
  LOADS: 'loads',
  FUEL: 'fuel',
  IFTA: 'ifta',
  EXPENSES: 'expenses',
  PERDIEM: 'perdiem',
  SETTINGS: 'settings',
  DRIVERS: 'drivers',      // NEW
  TRUCKS: 'trucks',        // NEW
  PAYSTATEMENTS: 'paystatements'  // NEW
};

let dbInstance = null;

/**
 * Initialize the database
 */
export async function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[DB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('[DB] Database opened successfully, version:', dbInstance.version);
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      console.log('[DB] Upgrading from version', oldVersion, 'to', DB_VERSION);

      // Create stores if they don't exist
      const storesToCreate = [
        { name: STORES.LOADS, keyPath: 'id' },
        { name: STORES.FUEL, keyPath: 'id' },
        { name: STORES.IFTA, keyPath: 'id' },
        { name: STORES.EXPENSES, keyPath: 'id' },
        { name: STORES.PERDIEM, keyPath: 'id' },
        { name: STORES.SETTINGS, keyPath: 'key' },
        { name: STORES.DRIVERS, keyPath: 'id' },
        { name: STORES.TRUCKS, keyPath: 'id' },
        { name: STORES.PAYSTATEMENTS, keyPath: 'id' }
      ];

      storesToCreate.forEach(store => {
        if (!db.objectStoreNames.contains(store.name)) {
          const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
          console.log('[DB] Created store:', store.name);
          
          // Add indexes for new stores
          if (store.name === STORES.DRIVERS) {
            objectStore.createIndex('status', 'status', { unique: false });
            objectStore.createIndex('assignedTruckId', 'assignedTruckId', { unique: false });
          }
          if (store.name === STORES.TRUCKS) {
            objectStore.createIndex('status', 'status', { unique: false });
            objectStore.createIndex('unitNumber', 'unitNumber', { unique: true });
          }
          if (store.name === STORES.PAYSTATEMENTS) {
            objectStore.createIndex('driverId', 'driverId', { unique: false });
            objectStore.createIndex('status', 'status', { unique: false });
            objectStore.createIndex('periodEnd', 'periodEnd', { unique: false });
          }
        }
      });

      // Add indexes to existing stores if upgrading
      if (oldVersion < 2) {
        // Add driver/truck references to loads
        if (db.objectStoreNames.contains(STORES.LOADS)) {
          const loadsStore = event.target.transaction.objectStore(STORES.LOADS);
          if (!loadsStore.indexNames.contains('driverId')) {
            loadsStore.createIndex('driverId', 'driverId', { unique: false });
          }
          if (!loadsStore.indexNames.contains('truckId')) {
            loadsStore.createIndex('truckId', 'truckId', { unique: false });
          }
        }
        // Add driver/truck references to fuel
        if (db.objectStoreNames.contains(STORES.FUEL)) {
          const fuelStore = event.target.transaction.objectStore(STORES.FUEL);
          if (!fuelStore.indexNames.contains('driverId')) {
            fuelStore.createIndex('driverId', 'driverId', { unique: false });
          }
          if (!fuelStore.indexNames.contains('truckId')) {
            fuelStore.createIndex('truckId', 'truckId', { unique: false });
          }
        }
      }
    };
  });
}

/**
 * Get database instance
 */
export function getDB() {
  return dbInstance;
}

/**
 * Generic CRUD operations
 */

// Get all items from a store
export async function getAll(storeName) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error('Database not initialized'));
      return;
    }
    const tx = dbInstance.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Get single item by ID
export async function getById(storeName, id) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error('Database not initialized'));
      return;
    }
    const tx = dbInstance.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get items by index
export async function getByIndex(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error('Database not initialized'));
      return;
    }
    const tx = dbInstance.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Save item (add or update)
export async function saveItem(storeName, item) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error('Database not initialized'));
      return;
    }
    const tx = dbInstance.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save multiple items
export async function saveAll(storeName, items) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error('Database not initialized'));
      return;
    }
    const tx = dbInstance.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    items.forEach(item => store.put(item));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// Delete item by ID
export async function deleteItem(storeName, id) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error('Database not initialized'));
      return;
    }
    const tx = dbInstance.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Delete multiple items
export async function deleteMultiple(storeName, ids) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error('Database not initialized'));
      return;
    }
    const tx = dbInstance.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    ids.forEach(id => store.delete(id));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// Clear all items in a store
export async function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) {
      reject(new Error('Database not initialized'));
      return;
    }
    const tx = dbInstance.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Specialized functions for each data type
 */

// DRIVERS
export const driversDB = {
  getAll: () => getAll(STORES.DRIVERS),
  getById: (id) => getById(STORES.DRIVERS, id),
  getActive: () => getByIndex(STORES.DRIVERS, 'status', 'active'),
  getByTruck: (truckId) => getByIndex(STORES.DRIVERS, 'assignedTruckId', truckId),
  save: (driver) => saveItem(STORES.DRIVERS, { ...driver, updatedAt: new Date().toISOString() }),
  delete: (id) => deleteItem(STORES.DRIVERS, id),
  clear: () => clearStore(STORES.DRIVERS)
};

// TRUCKS
export const trucksDB = {
  getAll: () => getAll(STORES.TRUCKS),
  getById: (id) => getById(STORES.TRUCKS, id),
  getActive: () => getByIndex(STORES.TRUCKS, 'status', 'active'),
  save: (truck) => saveItem(STORES.TRUCKS, { ...truck, updatedAt: new Date().toISOString() }),
  delete: (id) => deleteItem(STORES.TRUCKS, id),
  clear: () => clearStore(STORES.TRUCKS)
};

// PAY STATEMENTS
export const payStatementsDB = {
  getAll: () => getAll(STORES.PAYSTATEMENTS),
  getById: (id) => getById(STORES.PAYSTATEMENTS, id),
  getByDriver: (driverId) => getByIndex(STORES.PAYSTATEMENTS, 'driverId', driverId),
  getByStatus: (status) => getByIndex(STORES.PAYSTATEMENTS, 'status', status),
  save: (statement) => saveItem(STORES.PAYSTATEMENTS, { ...statement, updatedAt: new Date().toISOString() }),
  delete: (id) => deleteItem(STORES.PAYSTATEMENTS, id),
  clear: () => clearStore(STORES.PAYSTATEMENTS)
};

// LOADS (enhanced)
export const loadsDB = {
  getAll: () => getAll(STORES.LOADS),
  getById: (id) => getById(STORES.LOADS, id),
  getByDriver: (driverId) => getByIndex(STORES.LOADS, 'driverId', driverId),
  getByTruck: (truckId) => getByIndex(STORES.LOADS, 'truckId', truckId),
  save: (load) => saveItem(STORES.LOADS, load),
  saveAll: (loads) => saveAll(STORES.LOADS, loads),
  delete: (id) => deleteItem(STORES.LOADS, id),
  deleteMultiple: (ids) => deleteMultiple(STORES.LOADS, ids),
  clear: () => clearStore(STORES.LOADS)
};

// FUEL (enhanced)
export const fuelDB = {
  getAll: () => getAll(STORES.FUEL),
  getById: (id) => getById(STORES.FUEL, id),
  getByDriver: (driverId) => getByIndex(STORES.FUEL, 'driverId', driverId),
  getByTruck: (truckId) => getByIndex(STORES.FUEL, 'truckId', truckId),
  save: (entry) => saveItem(STORES.FUEL, entry),
  saveAll: (entries) => saveAll(STORES.FUEL, entries),
  delete: (id) => deleteItem(STORES.FUEL, id),
  deleteMultiple: (ids) => deleteMultiple(STORES.FUEL, ids),
  clear: () => clearStore(STORES.FUEL)
};

// IFTA
export const iftaDB = {
  getAll: () => getAll(STORES.IFTA),
  save: (entry) => saveItem(STORES.IFTA, entry),
  saveAll: (entries) => saveAll(STORES.IFTA, entries),
  delete: (id) => deleteItem(STORES.IFTA, id),
  deleteMultiple: (ids) => deleteMultiple(STORES.IFTA, ids),
  clear: () => clearStore(STORES.IFTA)
};

// EXPENSES
export const expensesDB = {
  getAll: () => getAll(STORES.EXPENSES),
  save: (expense) => saveItem(STORES.EXPENSES, expense),
  saveAll: (expenses) => saveAll(STORES.EXPENSES, expenses),
  delete: (id) => deleteItem(STORES.EXPENSES, id),
  deleteMultiple: (ids) => deleteMultiple(STORES.EXPENSES, ids),
  clear: () => clearStore(STORES.EXPENSES)
};

// PER DIEM
export const perDiemDB = {
  getAll: () => getAll(STORES.PERDIEM),
  save: (entry) => saveItem(STORES.PERDIEM, entry),
  saveAll: (entries) => saveAll(STORES.PERDIEM, entries),
  delete: (id) => deleteItem(STORES.PERDIEM, id),
  deleteMultiple: (ids) => deleteMultiple(STORES.PERDIEM, ids),
  clear: () => clearStore(STORES.PERDIEM)
};

// SETTINGS
export const settingsDB = {
  get: async (key) => {
    const result = await getById(STORES.SETTINGS, key);
    return result?.value;
  },
  set: (key, value) => saveItem(STORES.SETTINGS, { key, value }),
  getAll: () => getAll(STORES.SETTINGS),
  clear: () => clearStore(STORES.SETTINGS)
};

/**
 * Export all data (for backup)
 */
export async function exportAllData() {
  const data = {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    loads: await loadsDB.getAll(),
    fuel: await fuelDB.getAll(),
    ifta: await iftaDB.getAll(),
    expenses: await expensesDB.getAll(),
    perdiem: await perDiemDB.getAll(),
    drivers: await driversDB.getAll(),
    trucks: await trucksDB.getAll(),
    paystatements: await payStatementsDB.getAll(),
    settings: await settingsDB.getAll()
  };
  return data;
}

/**
 * Import data (from backup)
 */
export async function importAllData(data) {
  try {
    if (data.loads) await saveAll(STORES.LOADS, data.loads);
    if (data.fuel) await saveAll(STORES.FUEL, data.fuel);
    if (data.ifta) await saveAll(STORES.IFTA, data.ifta);
    if (data.expenses) await saveAll(STORES.EXPENSES, data.expenses);
    if (data.perdiem) await saveAll(STORES.PERDIEM, data.perdiem);
    if (data.drivers) await saveAll(STORES.DRIVERS, data.drivers);
    if (data.trucks) await saveAll(STORES.TRUCKS, data.trucks);
    if (data.paystatements) await saveAll(STORES.PAYSTATEMENTS, data.paystatements);
    if (data.settings) {
      for (const setting of data.settings) {
        await saveItem(STORES.SETTINGS, setting);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Clear all data
 */
export async function clearAllData() {
  try {
    await Promise.all([
      clearStore(STORES.LOADS),
      clearStore(STORES.FUEL),
      clearStore(STORES.IFTA),
      clearStore(STORES.EXPENSES),
      clearStore(STORES.PERDIEM),
      clearStore(STORES.DRIVERS),
      clearStore(STORES.TRUCKS),
      clearStore(STORES.PAYSTATEMENTS),
      clearStore(STORES.SETTINGS)
    ]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export { STORES };
export default {
  init: initDatabase,
  getDB,
  loadsDB,
  fuelDB,
  iftaDB,
  expensesDB,
  perDiemDB,
  settingsDB,
  driversDB,
  trucksDB,
  payStatementsDB,
  exportAllData,
  importAllData,
  clearAllData,
  STORES
};
