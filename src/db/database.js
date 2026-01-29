// ============ INDEXEDDB DATABASE ============
const DB_NAME = 'BalanceBooksTrucking';
const DB_VERSION = 2;

const STORES = {
  LOADS: 'loads',
  FUEL: 'fuel',
  IFTA: 'ifta',
  EXPENSES: 'expenses',
  PERDIEM: 'perdiem',
  SETTINGS: 'settings',
  DRIVERS: 'drivers',
  TRUCKS: 'trucks'
};

let dbInstance = null;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('[DB] Database opened successfully, version:', dbInstance.version);
      resolve(dbInstance);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      
      console.log(`[DB] Upgrading from version ${oldVersion} to ${DB_VERSION}`);
      
      const storeConfigs = [
        { name: STORES.LOADS, keyPath: 'id' },
        { name: STORES.FUEL, keyPath: 'id' },
        { name: STORES.IFTA, keyPath: 'id' },
        { name: STORES.EXPENSES, keyPath: 'id' },
        { name: STORES.PERDIEM, keyPath: 'id' },
        { name: STORES.SETTINGS, keyPath: 'key' },
        { name: STORES.DRIVERS, keyPath: 'id' },
        { name: STORES.TRUCKS, keyPath: 'id' }
      ];
      
      storeConfigs.forEach(config => {
        if (!db.objectStoreNames.contains(config.name)) {
          db.createObjectStore(config.name, { keyPath: config.keyPath });
          console.log(`[DB] Created store: ${config.name}`);
        }
      });
    };
  });
};

const getAll = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

const getById = async (storeName, id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveItem = async (storeName, item) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteItem = async (storeName, id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clearStore = async (storeName) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const replaceAll = async (storeName, items) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    items.forEach(item => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Store-specific exports
export const db = { open: openDB };

export const loadsDB = {
  getAll: () => getAll(STORES.LOADS),
  getById: (id) => getById(STORES.LOADS, id),
  save: (load) => saveItem(STORES.LOADS, load),
  replaceAll: (loads) => replaceAll(STORES.LOADS, loads),
  delete: (id) => deleteItem(STORES.LOADS, id),
  clear: () => clearStore(STORES.LOADS)
};

export const fuelDB = {
  getAll: () => getAll(STORES.FUEL),
  getById: (id) => getById(STORES.FUEL, id),
  save: (entry) => saveItem(STORES.FUEL, entry),
  replaceAll: (entries) => replaceAll(STORES.FUEL, entries),
  delete: (id) => deleteItem(STORES.FUEL, id),
  clear: () => clearStore(STORES.FUEL)
};

export const iftaDB = {
  getAll: () => getAll(STORES.IFTA),
  getById: (id) => getById(STORES.IFTA, id),
  save: (entry) => saveItem(STORES.IFTA, entry),
  replaceAll: (entries) => replaceAll(STORES.IFTA, entries),
  delete: (id) => deleteItem(STORES.IFTA, id),
  clear: () => clearStore(STORES.IFTA)
};

export const expensesDB = {
  getAll: () => getAll(STORES.EXPENSES),
  getById: (id) => getById(STORES.EXPENSES, id),
  save: (expense) => saveItem(STORES.EXPENSES, expense),
  replaceAll: (expenses) => replaceAll(STORES.EXPENSES, expenses),
  delete: (id) => deleteItem(STORES.EXPENSES, id),
  clear: () => clearStore(STORES.EXPENSES)
};

export const perdiemDB = {
  getAll: () => getAll(STORES.PERDIEM),
  getById: (id) => getById(STORES.PERDIEM, id),
  save: (entry) => saveItem(STORES.PERDIEM, entry),
  replaceAll: (entries) => replaceAll(STORES.PERDIEM, entries),
  delete: (id) => deleteItem(STORES.PERDIEM, id),
  clear: () => clearStore(STORES.PERDIEM)
};

export const settingsDB = {
  get: (key) => getById(STORES.SETTINGS, key),
  set: (key, value) => saveItem(STORES.SETTINGS, { key, value, updatedAt: new Date().toISOString() }),
  getAll: () => getAll(STORES.SETTINGS),
  delete: (key) => deleteItem(STORES.SETTINGS, key),
  clear: () => clearStore(STORES.SETTINGS)
};

export const driversDB = {
  getAll: () => getAll(STORES.DRIVERS),
  getById: (id) => getById(STORES.DRIVERS, id),
  save: (driver) => saveItem(STORES.DRIVERS, { ...driver, updatedAt: new Date().toISOString() }),
  replaceAll: (drivers) => replaceAll(STORES.DRIVERS, drivers),
  delete: (id) => deleteItem(STORES.DRIVERS, id),
  clear: () => clearStore(STORES.DRIVERS)
};

export const trucksDB = {
  getAll: () => getAll(STORES.TRUCKS),
  getById: (id) => getById(STORES.TRUCKS, id),
  save: (truck) => saveItem(STORES.TRUCKS, { ...truck, updatedAt: new Date().toISOString() }),
  replaceAll: (trucks) => replaceAll(STORES.TRUCKS, trucks),
  delete: (id) => deleteItem(STORES.TRUCKS, id),
  clear: () => clearStore(STORES.TRUCKS)
};

// Export/Import all data
export const exportAllData = async () => {
  const [loads, fuel, ifta, expenses, perdiem, settings, drivers, trucks] = await Promise.all([
    loadsDB.getAll(),
    fuelDB.getAll(),
    iftaDB.getAll(),
    expensesDB.getAll(),
    perdiemDB.getAll(),
    settingsDB.getAll(),
    driversDB.getAll(),
    trucksDB.getAll()
  ]);
  return { loads, fuelEntries: fuel, iftaEntries: ifta, expenses, perDiemDays: perdiem, settings, drivers, trucks };
};

export const importAllData = async (data) => {
  await Promise.all([
    data.loads && loadsDB.replaceAll(data.loads),
    data.fuelEntries && fuelDB.replaceAll(data.fuelEntries),
    data.iftaEntries && iftaDB.replaceAll(data.iftaEntries),
    data.expenses && expensesDB.replaceAll(data.expenses),
    data.perDiemDays && perdiemDB.replaceAll(data.perDiemDays),
    data.drivers && driversDB.replaceAll(data.drivers),
    data.trucks && trucksDB.replaceAll(data.trucks)
  ]);
};

export const clearAllData = async () => {
  await Promise.all([
    loadsDB.clear(),
    fuelDB.clear(),
    iftaDB.clear(),
    expensesDB.clear(),
    perdiemDB.clear(),
    settingsDB.clear(),
    driversDB.clear(),
    trucksDB.clear()
  ]);
};

// Initialize database (called by migration)
export const initDatabase = async () => {
  await openDB();
  return true;
};
