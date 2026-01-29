/**
 * BalanceBooks Trucking - Migration Module v2.0
 * Handles migration from localStorage to IndexedDB
 */

import { initDatabase } from './database';

const DB_NAME = 'BalanceBooksTrucking';
const DB_VERSION = 3;
const MIGRATION_KEY = 'balancebooks_migrated_v2';

let dbInstance = null;

/**
 * Initialize the database connection
 */
async function initDB() {
  // Use database.js's initDatabase to ensure dbInstance is set there too
  try {
    await initDatabase();
  } catch (e) {
    console.log('[Migration] database.js init skipped:', e.message);
  }
  
  // Also maintain our own connection for migration operations
  if (dbInstance) return dbInstance;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      const stores = ['loads', 'fuel', 'ifta', 'expenses', 'perdiem', 'drivers', 'trucks', 'paystatements', 'invoices'];
      stores.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      });
      
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Get all items from a store
 */
async function getAll(storeName) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

/**
 * Replace all items in a store
 */
async function replaceAll(storeName, items) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      (items || []).forEach(item => store.put(item));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Get a setting value
 */
async function getSetting(key) {
  const db = await initDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Set a setting value
 */
async function setSetting(key, value) {
  const db = await initDB();
  return new Promise((resolve) => {
    try {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key, value });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (e) {
      resolve(false);
    }
  });
}

/**
 * Check if migration from localStorage is needed
 */
export function needsMigration() {
  if (localStorage.getItem(MIGRATION_KEY)) {
    return false;
  }
  const oldKeys = ['loads', 'fuelEntries', 'iftaData', 'expenses', 'perDiemDays'];
  return oldKeys.some(key => localStorage.getItem(key));
}

/**
 * Migrate data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage() {
  try {
    if (localStorage.getItem(MIGRATION_KEY)) {
      return { success: true, skipped: true };
    }
    
    console.log('[Migration] Starting migration from localStorage...');
    
    // Migrate each data type
    const loads = JSON.parse(localStorage.getItem('loads') || '[]');
    if (loads.length > 0) await replaceAll('loads', loads);
    
    const fuelEntries = JSON.parse(localStorage.getItem('fuelEntries') || '[]');
    if (fuelEntries.length > 0) await replaceAll('fuel', fuelEntries);
    
    const iftaData = JSON.parse(localStorage.getItem('iftaData') || '[]');
    if (iftaData.length > 0) await replaceAll('ifta', iftaData);
    
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    if (expenses.length > 0) await replaceAll('expenses', expenses);
    
    const perDiemDays = JSON.parse(localStorage.getItem('perDiemDays') || '[]');
    if (perDiemDays.length > 0) await replaceAll('perdiem', perDiemDays);
    
    // Migrate settings
    const autoBackup = localStorage.getItem('autoBackup');
    if (autoBackup) await setSetting('autoBackup', autoBackup === 'true');
    
    const lastBackup = localStorage.getItem('lastBackup');
    if (lastBackup) await setSetting('lastBackup', lastBackup);
    
    const notifications = localStorage.getItem('notifications');
    if (notifications) await setSetting('notifications', notifications === 'true');
    
    localStorage.setItem(MIGRATION_KEY, new Date().toISOString());
    console.log('[Migration] Migration complete!');
    return { success: true };
    
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Load all data from IndexedDB
 */
export async function loadFromIndexedDB() {
  try {
    await initDB();
    
    const loads = await getAll('loads');
    const fuelEntries = await getAll('fuel');
    const iftaData = await getAll('ifta');
    const expenses = await getAll('expenses');
    const perDiemDays = await getAll('perdiem');
    const drivers = await getAll('drivers');
    const trucks = await getAll('trucks');
    const invoices = await getAll('invoices');
    
    const autoBackup = await getSetting('autoBackup');
    const lastBackup = await getSetting('lastBackup');
    const notifications = await getSetting('notifications');
    
    return {
      loads: loads || [],
      fuelEntries: fuelEntries || [],
      iftaData: iftaData || [],
      expenses: expenses || [],
      perDiemDays: perDiemDays || [],
      drivers: drivers || [],
      trucks: trucks || [],
      invoices: invoices || [],
      autoBackup: autoBackup ?? false,
      lastBackup: lastBackup ?? null,
      notifications: notifications ?? false
    };
    
  } catch (error) {
    console.error('[IndexedDB] Failed to load data:', error);
    return {
      loads: [],
      fuelEntries: [],
      iftaData: [],
      expenses: [],
      perDiemDays: [],
      drivers: [],
      trucks: [],
      invoices: [],
      autoBackup: false,
      lastBackup: null,
      notifications: false
    };
  }
}

// Re-export initDB for compatibility
export { initDB };
