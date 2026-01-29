/**
 * BalanceBooks Trucking - IndexedDB Database Module v2.0
 * Enhanced with Driver, Truck, and Pay Statement support
 */

const DB_NAME = 'BalanceBooksTrucking';
const DB_VERSION = 3;

const STORES = {
  LOADS: 'loads',
  FUEL: 'fuel',
  IFTA: 'ifta',
  EXPENSES: 'expenses',
  PERDIEM: 'perdiem',
  SETTINGS: 'settings',
  DRIVERS: 'drivers',
  TRUCKS: 'trucks',
  PAYSTATEMENTS: 'paystatements',
  INVOICES: 'invoices'
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

      const storesToCreate = [
        { name: STORES.LOADS, keyPath: 'id' },
        { name: STORES.FUEL, keyPath: 'id' },
        { name: STORES.IFTA, keyPath: 'id' },
        { name: STORES.EXPENSES, keyPath: 'id' },
        { name: STORES.PERDIEM, keyPath: 'id' },
        { name: STORES.SETTINGS, keyPath: 'key' },
        { name: STORES.DRIVERS, keyPath: 'id' },
        { name: STORES.TRUCKS, keyPath: 'id' },
        { name: STORES.PAYSTATEMENTS, keyPath: 'id' },
        { name: STORES.INVOICES, keyPath: 'id' }
      ];

      storesToCreate.forEach(store => {
        if (!db.objectStoreNames.contains(store.name)) {
          db.createObjectStore(store.name, { keyPath: store.keyPath });
          console.log('[DB] Created store:', store.name);
        }
      });
    };
  });
}

// Alias for backward compatibility with migration.js
export const initDB = initDatabase;

export function getDB() {
  return dbInstance;
}

// ============ HELPER FUNCTIONS ============

async function getAll(storeName) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) { reject(new Error('Database not initialized')); return; }
    const tx = dbInstance.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function getById(storeName, id) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) { reject(new Error('Database not initialized')); return; }
    const tx = dbInstance.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveItem(storeName, item) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) { reject(new Error('Database not initialized')); return; }
    const tx = dbInstance.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveAll(storeName, items) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) { reject(new Error('Database not initialized')); return; }
    const tx = dbInstance.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    (items || []).forEach(item => store.put(item));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function replaceAll(storeName, items) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) { reject(new Error('Database not initialized')); return; }
    const tx = dbInstance.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    (items || []).forEach(item => store.put(item));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteItem(storeName, id) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) { reject(new Error('Database not initialized')); return; }
    const tx = dbInstance.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    if (!dbInstance) { reject(new Error('Database not initialized')); return; }
    const tx = dbInstance.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// ============ DATABASE EXPORTS ============

// LOADS
export const loadsDB = {
  getAll: () => getAll(STORES.LOADS),
  getById: (id) => getById(STORES.LOADS, id),
  save: (load) => saveItem(STORES.LOADS, load),
  saveAll: (loads) => saveAll(STORES.LOADS, loads),
  replaceAll: (loads) => replaceAll(STORES.LOADS, loads),
  delete: (id) => deleteItem(STORES.LOADS, id),
  clear: () => clearStore(STORES.LOADS)
};

// FUEL
export const fuelDB = {
  getAll: () => getAll(STORES.FUEL),
  getById: (id) => getById(STORES.FUEL, id),
  save: (entry) => saveItem(STORES.FUEL, entry),
  saveAll: (entries) => saveAll(STORES.FUEL, entries),
  replaceAll: (entries) => replaceAll(STORES.FUEL, entries),
  delete: (id) => deleteItem(STORES.FUEL, id),
  clear: () => clearStore(STORES.FUEL)
};

// IFTA
export const iftaDB = {
  getAll: () => getAll(STORES.IFTA),
  getById: (id) => getById(STORES.IFTA, id),
  save: (entry) => saveItem(STORES.IFTA, entry),
  replaceAll: (data) => replaceAll(STORES.IFTA, data),
  delete: (id) => deleteItem(STORES.IFTA, id),
  clear: () => clearStore(STORES.IFTA)
};

// EXPENSES
export const expensesDB = {
  getAll: () => getAll(STORES.EXPENSES),
  getById: (id) => getById(STORES.EXPENSES, id),
  save: (expense) => saveItem(STORES.EXPENSES, expense),
  replaceAll: (expenses) => replaceAll(STORES.EXPENSES, expenses),
  delete: (id) => deleteItem(STORES.EXPENSES, id),
  clear: () => clearStore(STORES.EXPENSES)
};

// PER DIEM
export const perdiemDB = {
  getAll: () => getAll(STORES.PERDIEM),
  getById: (id) => getById(STORES.PERDIEM, id),
  save: (day) => saveItem(STORES.PERDIEM, day),
  replaceAll: (days) => replaceAll(STORES.PERDIEM, days),
  delete: (id) => deleteItem(STORES.PERDIEM, id),
  clear: () => clearStore(STORES.PERDIEM)
};

// DRIVERS
export const driversDB = {
  getAll: () => getAll(STORES.DRIVERS),
  getById: (id) => getById(STORES.DRIVERS, id),
  save: (driver) => saveItem(STORES.DRIVERS, { ...driver, updatedAt: new Date().toISOString() }),
  saveAll: (drivers) => saveAll(STORES.DRIVERS, drivers),
  replaceAll: (drivers) => replaceAll(STORES.DRIVERS, drivers),
  delete: (id) => deleteItem(STORES.DRIVERS, id),
  clear: () => clearStore(STORES.DRIVERS)
};

// TRUCKS
export const trucksDB = {
  getAll: () => getAll(STORES.TRUCKS),
  getById: (id) => getById(STORES.TRUCKS, id),
  save: (truck) => saveItem(STORES.TRUCKS, { ...truck, updatedAt: new Date().toISOString() }),
  saveAll: (trucks) => saveAll(STORES.TRUCKS, trucks),
  replaceAll: (trucks) => replaceAll(STORES.TRUCKS, trucks),
  delete: (id) => deleteItem(STORES.TRUCKS, id),
  clear: () => clearStore(STORES.TRUCKS)
};

// PAY STATEMENTS
export const payStatementsDB = {
  getAll: () => getAll(STORES.PAYSTATEMENTS),
  getById: (id) => getById(STORES.PAYSTATEMENTS, id),
  save: (statement) => saveItem(STORES.PAYSTATEMENTS, { ...statement, updatedAt: new Date().toISOString() }),
  replaceAll: (statements) => replaceAll(STORES.PAYSTATEMENTS, statements),
  delete: (id) => deleteItem(STORES.PAYSTATEMENTS, id),
  clear: () => clearStore(STORES.PAYSTATEMENTS)
};

// INVOICES
export const invoicesDB = {
  getAll: () => getAll(STORES.INVOICES),
  getById: (id) => getById(STORES.INVOICES, id),
  save: (invoice) => saveItem(STORES.INVOICES, { ...invoice, updatedAt: new Date().toISOString() }),
  replaceAll: (invoices) => replaceAll(STORES.INVOICES, invoices),
  delete: (id) => deleteItem(STORES.INVOICES, id),
  clear: () => clearStore(STORES.INVOICES)
};

// SETTINGS
export const settingsDB = {
  get: async (key) => {
    const result = await getById(STORES.SETTINGS, key);
    return result?.value;
  },
  set: async (key, value) => {
    return saveItem(STORES.SETTINGS, { key, value });
  },
  delete: (key) => deleteItem(STORES.SETTINGS, key),
  clear: () => clearStore(STORES.SETTINGS)
};

// ============ BULK OPERATIONS ============

export async function exportAllData() {
  return {
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    loads: await loadsDB.getAll(),
    fuelEntries: await fuelDB.getAll(),
    iftaData: await iftaDB.getAll(),
    expenses: await expensesDB.getAll(),
    perDiemDays: await perdiemDB.getAll(),
    drivers: await driversDB.getAll(),
    trucks: await trucksDB.getAll(),
    invoices: await invoicesDB.getAll()
  };
}

export async function importAllData(data) {
  if (data.loads) await loadsDB.replaceAll(data.loads);
  if (data.fuelEntries) await fuelDB.replaceAll(data.fuelEntries);
  if (data.iftaData) await iftaDB.replaceAll(data.iftaData);
  if (data.expenses) await expensesDB.replaceAll(data.expenses);
  if (data.perDiemDays) await perdiemDB.replaceAll(data.perDiemDays);
  if (data.drivers) await driversDB.replaceAll(data.drivers);
  if (data.trucks) await trucksDB.replaceAll(data.trucks);
  if (data.invoices) await invoicesDB.replaceAll(data.invoices);
  if (data.autoBackup !== undefined) await settingsDB.set('autoBackup', data.autoBackup);
  if (data.lastBackup) await settingsDB.set('lastBackup', data.lastBackup);
  if (data.notifications !== undefined) await settingsDB.set('notifications', data.notifications);
  return true;
}

export async function clearAllData() {
  await loadsDB.clear();
  await fuelDB.clear();
  await iftaDB.clear();
  await expensesDB.clear();
  await perdiemDB.clear();
  await driversDB.clear();
  await trucksDB.clear();
  await payStatementsDB.clear();
  await invoicesDB.clear();
  await settingsDB.clear();
  return true;
}

// Default export for convenience
export const db = dbInstance;
