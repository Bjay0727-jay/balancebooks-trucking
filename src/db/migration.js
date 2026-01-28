// BalanceBooks Trucking - Migration Module
// Handles migration from localStorage to IndexedDB

import {
  db,
  loadsDB,
  fuelDB,
  iftaDB,
  expensesDB,
  perdiemDB,
  settingsDB,
  initDB
} from './database';

const MIGRATION_FLAG = 'bbt_migrated_to_indexeddb';
const OLD_PREFIX = 'bbt_';

// Check if migration from localStorage is needed
export const needsMigration = () => {
  // Already migrated
  if (localStorage.getItem(MIGRATION_FLAG)) {
    return false;
  }
  
  // Check if there's any old data to migrate
  const hasOldData = [
    'loads',
    'fuel',
    'ifta',
    'expenses',
    'perdiem'
  ].some(key => localStorage.getItem(OLD_PREFIX + key));
  
  return hasOldData;
};

// Load data from localStorage (old format)
const loadFromLocalStorage = (key, defaultValue = []) => {
  try {
    const saved = localStorage.getItem(OLD_PREFIX + key);
    if (saved) {
      return JSON.parse(saved);
    }
    return defaultValue;
  } catch (e) {
    console.error(`[Migration] Failed to load ${key} from localStorage:`, e);
    return defaultValue;
  }
};

// Migrate from localStorage to IndexedDB
export const migrateFromLocalStorage = async () => {
  try {
    // Skip if already migrated
    if (localStorage.getItem(MIGRATION_FLAG)) {
      console.log('[Migration] Already migrated, skipping...');
      return { success: true, skipped: true };
    }

    console.log('[Migration] Starting migration from localStorage to IndexedDB...');

    // Initialize database
    await initDB();

    // Load all data from localStorage
    const loads = loadFromLocalStorage('loads', []);
    const fuelEntries = loadFromLocalStorage('fuel', []);
    const iftaData = loadFromLocalStorage('ifta', []);
    const expenses = loadFromLocalStorage('expenses', []);
    const perDiemDays = loadFromLocalStorage('perdiem', []);

    console.log(`[Migration] Found: ${loads.length} loads, ${fuelEntries.length} fuel entries, ${iftaData.length} IFTA records, ${expenses.length} expenses, ${perDiemDays.length} per diem days`);

    // Migrate to IndexedDB
    const promises = [];

    if (loads.length > 0) {
      promises.push(loadsDB.replaceAll(loads));
    }
    if (fuelEntries.length > 0) {
      promises.push(fuelDB.replaceAll(fuelEntries));
    }
    if (iftaData.length > 0) {
      promises.push(iftaDB.replaceAll(iftaData));
    }
    if (expenses.length > 0) {
      promises.push(expensesDB.replaceAll(expenses));
    }
    if (perDiemDays.length > 0) {
      promises.push(perdiemDB.replaceAll(perDiemDays));
    }

    await Promise.all(promises);

    // Mark migration as complete
    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());

    // Optionally clear old localStorage data (commented out for safety)
    // ['loads', 'fuel', 'ifta', 'expenses', 'perdiem'].forEach(key => {
    //   localStorage.removeItem(OLD_PREFIX + key);
    // });

    console.log('[Migration] Migration completed successfully!');
    return { success: true, skipped: false };
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    return { success: false, skipped: false, error: error.message };
  }
};

// Load all data from IndexedDB
export const loadFromIndexedDB = async () => {
  try {
    await initDB();

    const [loads, fuelEntries, iftaData, expenses, perDiemDays, settings] = await Promise.all([
      loadsDB.getAll(),
      fuelDB.getAll(),
      iftaDB.getAll(),
      expensesDB.getAll(),
      perdiemDB.getAll(),
      settingsDB.getAll()
    ]);

    return {
      loads: loads || [],
      fuelEntries: fuelEntries || [],
      iftaData: iftaData || [],
      expenses: expenses || [],
      perDiemDays: perDiemDays || [],
      autoBackup: settings.autoBackup ?? false,
      lastBackup: settings.lastBackup ?? null,
      notifications: settings.notifications ?? false,
      defaultMPG: settings.defaultMPG ?? 6.5,
      perDiemRate: settings.perDiemRate ?? 69 // 2024 IRS rate
    };
  } catch (error) {
    console.error('[IndexedDB] Failed to load data:', error);
    throw error;
  }
};

// Export for use in data management
export { initDB };
