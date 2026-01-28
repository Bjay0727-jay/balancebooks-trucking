import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  db, 
  loadsDB, 
  fuelDB, 
  iftaDB, 
  expensesDB, 
  perdiemDB, 
  settingsDB,
  exportAllData,
  importAllData,
  clearAllData
} from './db/database';
import { migrateFromLocalStorage, loadFromIndexedDB, needsMigration } from './db/migration';

// ============ CONSTANTS ============
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.0';
const CACHE_VERSION = '2.0.0';

// Force refresh on new version
const forceRefreshOnNewVersion = () => {
  const storedVersion = localStorage.getItem('bbt_app_version');
  if (storedVersion && storedVersion !== CACHE_VERSION) {
    console.log(`Version changed from ${storedVersion} to ${CACHE_VERSION}, clearing cache...`);
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
    }
    localStorage.setItem('bbt_app_version', CACHE_VERSION);
    window.location.reload(true);
    return true;
  }
  localStorage.setItem('bbt_app_version', CACHE_VERSION);
  return false;
};

if (typeof window !== 'undefined') {
  forceRefreshOnNewVersion();
}

// Tools integration storage key
const BB_TOOLS_STORAGE_KEY = 'bb_tools_export';

// ============ COLORS (Enhanced with more contrast) ============
const colors = {
  navy: '#1e3a5f',
  navyDark: '#0f172a',
  orange: '#f97316',
  orangeLight: '#fb923c',
  teal: '#14b8a6',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  white: '#ffffff',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
};

// ============ PAY TYPES ============
const PAY_TYPES = {
  PER_MILE: 'per_mile',
  PERCENTAGE: 'percentage',
  FLAT_RATE: 'flat_rate'
};

// ============ STATE ABBREVIATIONS ============
const STATES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

// ============ UTILITY FUNCTIONS ============
const uid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);
const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
const formatNumber = (n, decimals = 0) => new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n || 0);

// Format pay rate for display
const formatPayRate = (payType, payRate) => {
  const rate = parseFloat(payRate) || 0;
  switch (payType) {
    case PAY_TYPES.PER_MILE: return `$${rate.toFixed(2)}/mi`;
    case PAY_TYPES.PERCENTAGE: return `${rate}%`;
    case PAY_TYPES.FLAT_RATE: return `$${rate.toFixed(2)}/load`;
    default: return rate.toString();
  }
};

// Calculate driver pay for a load
const calculateLoadPay = (load, driver) => {
  if (!load || !driver) return 0;
  const { paymentType, payRate } = driver;
  const loadedMiles = parseFloat(load.loadedMiles) || 0;
  const deadheadMiles = parseFloat(load.deadheadMiles) || 0;
  const totalMiles = loadedMiles + deadheadMiles;
  const grossRevenue = parseFloat(load.rate) || 0;

  switch (paymentType) {
    case PAY_TYPES.PER_MILE: return totalMiles * parseFloat(payRate);
    case PAY_TYPES.PERCENTAGE: return grossRevenue * (parseFloat(payRate) / 100);
    case PAY_TYPES.FLAT_RATE: return parseFloat(payRate);
    default: return 0;
  }
};

// ============ MULTI-SELECT HOOK ============
const useMultiSelect = (items = []) => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const allSelected = useMemo(() => {
    if (items.length === 0) return false;
    return items.every(item => selectedIds.has(item.id));
  }, [items, selectedIds]);

  const someSelected = useMemo(() => {
    if (items.length === 0) return false;
    const selectedCount = items.filter(item => selectedIds.has(item.id)).length;
    return selectedCount > 0 && selectedCount < items.length;
  }, [items, selectedIds]);

  const toggleItem = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        items.forEach(item => next.delete(item.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        items.forEach(item => next.add(item.id));
        return next;
      });
    }
  }, [items, allSelected]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  return {
    selectedIds, selectedCount: selectedIds.size, allSelected, someSelected,
    isSelected, toggleItem, toggleAll, clearSelection, setSelectedIds
  };
};

// ============ EXPORT UTILITIES ============
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportToCSV = (data, columns, filename) => {
  if (!data || data.length === 0) return;
  const headers = columns.map(col => col.label);
  const rows = data.map(item => 
    columns.map(col => {
      let value = col.format ? col.format(item[col.key], item) : item[col.key];
      if (value === null || value === undefined) value = '';
      value = String(value).replace(/"/g, '""');
      if (value.includes(',') || value.includes('\n') || value.includes('"')) value = `"${value}"`;
      return value;
    }).join(',')
  );
  const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
};

// ============ STYLES (Enhanced with more white space) ============
const styles = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${colors.gray900} 0%, ${colors.navyDark} 100%)`,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  sidebar: (collapsed) => ({
    width: collapsed ? 80 : 280,
    background: `linear-gradient(180deg, ${colors.navyDark} 0%, ${colors.navy} 100%)`,
    borderRight: `1px solid rgba(255,255,255,0.08)`,
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  }),
  logoContainer: {
    padding: '36px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 800,
    color: colors.white,
    letterSpacing: '-0.5px',
  },
  logoSubtext: {
    fontSize: 13,
    color: colors.orange,
    fontWeight: 600,
    letterSpacing: '0.5px',
    marginTop: 2,
  },
  nav: {
    listStyle: 'none',
    padding: '28px 16px',
    margin: 0,
    flex: 1,
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '18px 22px',
    marginBottom: 10,
    borderRadius: 14,
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 500,
    color: active ? colors.white : colors.gray400,
    background: active ? `linear-gradient(135deg, ${colors.orange} 0%, ${colors.orangeLight} 100%)` : 'transparent',
    transition: 'all 0.2s ease',
    boxShadow: active ? '0 4px 20px rgba(249, 115, 22, 0.3)' : 'none',
  }),
  main: (collapsed) => ({
    flex: 1,
    marginLeft: collapsed ? 80 : 280,
    padding: '48px 56px',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease',
  }),
  header: {
    marginBottom: 48,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: 800,
    color: colors.white,
    marginBottom: 12,
    letterSpacing: '-1px',
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.gray400,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 32,
    marginBottom: 48,
  },
  statCard: (color, clickable = false, selected = false) => ({
    background: selected 
      ? `linear-gradient(135deg, ${color}30 0%, ${color}20 100%)` 
      : `linear-gradient(135deg, ${colors.gray800} 0%, ${colors.gray900} 100%)`,
    borderRadius: 20,
    padding: '36px',
    border: selected ? `2px solid ${color}` : `1px solid ${color}33`,
    cursor: clickable ? 'pointer' : 'default',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  }),
  statIcon: {
    fontSize: 32,
    marginBottom: 24,
  },
  statValue: (color) => ({
    fontSize: 36,
    fontWeight: 800,
    color: color,
    marginBottom: 10,
    letterSpacing: '-1px',
  }),
  statLabel: {
    fontSize: 14,
    color: colors.gray400,
    fontWeight: 500,
  },
  card: {
    background: `linear-gradient(135deg, ${colors.gray800} 0%, ${colors.gray900} 100%)`,
    borderRadius: 20,
    padding: '40px',
    marginBottom: 36,
    border: `1px solid rgba(255,255,255,0.06)`,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 14px',
  },
  th: {
    textAlign: 'left',
    padding: '18px 24px',
    color: colors.gray400,
    fontWeight: 600,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: `1px solid ${colors.gray700}`,
  },
  td: {
    padding: '24px',
    color: colors.white,
    background: colors.gray800,
    fontSize: 15,
  },
  tdFirst: {
    padding: '24px',
    color: colors.white,
    background: colors.gray800,
    fontSize: 15,
    borderRadius: '12px 0 0 12px',
  },
  tdLast: {
    padding: '24px',
    color: colors.white,
    background: colors.gray800,
    fontSize: 15,
    borderRadius: '0 12px 12px 0',
  },
  input: {
    width: '100%',
    padding: '18px 22px',
    background: colors.gray800,
    border: `2px solid ${colors.gray700}`,
    borderRadius: 14,
    color: colors.white,
    fontSize: 16,
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  select: {
    width: '100%',
    padding: '18px 22px',
    background: colors.gray800,
    border: `2px solid ${colors.gray700}`,
    borderRadius: 14,
    color: colors.white,
    fontSize: 16,
    outline: 'none',
    cursor: 'pointer',
  },
  btn: (variant = 'primary') => ({
    padding: '16px 32px',
    borderRadius: 12,
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    ...(variant === 'primary' && {
      background: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.orangeLight} 100%)`,
      color: colors.white,
      boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)',
    }),
    ...(variant === 'secondary' && {
      background: colors.gray700,
      color: colors.white,
    }),
    ...(variant === 'danger' && {
      background: colors.red,
      color: colors.white,
    }),
    ...(variant === 'success' && {
      background: colors.green,
      color: colors.white,
    }),
    ...(variant === 'outline' && {
      background: 'transparent',
      color: colors.orange,
      border: `2px solid ${colors.orange}`,
    }),
  }),
  btnSmall: (variant = 'secondary') => ({
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    ...(variant === 'primary' && {
      background: colors.orange,
      color: colors.white,
    }),
    ...(variant === 'secondary' && {
      background: colors.gray700,
      color: colors.white,
    }),
    ...(variant === 'danger' && {
      background: colors.red,
      color: colors.white,
    }),
    ...(variant === 'success' && {
      background: colors.green,
      color: colors.white,
    }),
  }),
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 24,
  },
  modalContent: {
    background: `linear-gradient(135deg, ${colors.gray800} 0%, ${colors.gray900} 100%)`,
    borderRadius: 24,
    padding: '52px',
    maxWidth: 720,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: `1px solid ${colors.gray700}`,
  },
  formGroup: {
    marginBottom: 32,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 24,
    marginBottom: 32,
  },
  label: {
    display: 'block',
    marginBottom: 14,
    color: colors.gray300,
    fontWeight: 600,
    fontSize: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    accentColor: colors.orange,
    cursor: 'pointer',
  },
  badge: (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    background: `${color}20`,
    color: color,
  }),
  emptyState: {
    textAlign: 'center',
    padding: '80px 40px',
    color: colors.gray400,
  },
  bulkActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 24px',
    background: `linear-gradient(135deg, ${colors.orange}20 0%, ${colors.orange}10 100%)`,
    borderRadius: 14,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  selectionBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 18px',
    background: colors.orange,
    borderRadius: 20,
    color: colors.white,
    fontWeight: 700,
    fontSize: 14,
  },
};

// ============ MAIN APP COMPONENT ============
export default function App() {
  // ============ STATE ============
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  
  // Data state
  const [loads, setLoads] = useState([]);
  const [fuelEntries, setFuelEntries] = useState([]);
  const [iftaData, setIftaData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [perDiemDays, setPerDiemDays] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  
  // Modal state
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showTruckModal, setShowTruckModal] = useState(false);
  
  // Editing state
  const [editingLoad, setEditingLoad] = useState(null);
  const [editingFuel, setEditingFuel] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editingTruck, setEditingTruck] = useState(null);
  
  // Settings
  const [autoBackup, setAutoBackup] = useState(true);
  const [notifications, setNotifications] = useState(true);
  
  // Multi-select hooks
  const loadsSelect = useMultiSelect(loads);
  const fuelSelect = useMultiSelect(fuelEntries);
  const expensesSelect = useMultiSelect(expenses);
  const driversSelect = useMultiSelect(drivers);
  const trucksSelect = useMultiSelect(trucks);

  // ============ DATABASE INITIALIZATION ============
  useEffect(() => {
    const initApp = async () => {
      try {
        // Check for migration from localStorage
        if (needsMigration()) {
          console.log('[App] Migrating from localStorage...');
          await migrateFromLocalStorage();
        }
        
        // Load data from IndexedDB
        const data = await loadFromIndexedDB();
        setLoads(data.loads || []);
        setFuelEntries(data.fuel || []);
        setIftaData(data.ifta || []);
        setExpenses(data.expenses || []);
        setPerDiemDays(data.perdiem || []);
        setDrivers(data.drivers || []);
        setTrucks(data.trucks || []);
        
        // Load settings
        const savedAutoBackup = await settingsDB.get('autoBackup');
        const savedNotifications = await settingsDB.get('notifications');
        if (savedAutoBackup !== undefined) setAutoBackup(savedAutoBackup);
        if (savedNotifications !== undefined) setNotifications(savedNotifications);
        
        setDbReady(true);
        setIsLoading(false);
        console.log('[App] Data loaded successfully');
      } catch (error) {
        console.error('[App] Failed to initialize:', error);
        setIsLoading(false);
      }
    };
    
    initApp();
  }, []);

  // ============ AUTO-SAVE ============
  useEffect(() => {
    if (!dbReady) return;
    const saveData = async () => {
      try {
        await loadsDB.saveAll(loads);
        await fuelDB.saveAll(fuelEntries);
        await iftaDB.saveAll(iftaData);
        await expensesDB.saveAll(expenses);
        await perdiemDB.saveAll(perDiemDays);
        // Save drivers and trucks to IndexedDB (add these functions)
        console.log('[App] Auto-saved');
      } catch (error) {
        console.error('[App] Auto-save failed:', error);
      }
    };
    const timer = setTimeout(saveData, 1000);
    return () => clearTimeout(timer);
  }, [loads, fuelEntries, iftaData, expenses, perDiemDays, drivers, trucks, dbReady]);

  // ============ COMPUTED VALUES ============
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const thisMonth = loads.filter(l => {
      const d = new Date(l.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    
    const totalRevenue = thisMonth.reduce((sum, l) => sum + (parseFloat(l.rate) || 0), 0);
    const totalMiles = thisMonth.reduce((sum, l) => 
      sum + (parseFloat(l.loadedMiles) || 0) + (parseFloat(l.deadheadMiles) || 0), 0);
    const totalFuel = fuelEntries.filter(f => {
      const d = new Date(f.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, f) => sum + (parseFloat(f.totalAmount) || (parseFloat(f.gallons) * parseFloat(f.pricePerGallon)) || 0), 0);
    
    return {
      loads: thisMonth.length,
      revenue: totalRevenue,
      miles: totalMiles,
      fuelCost: totalFuel,
      rpm: totalMiles > 0 ? totalRevenue / totalMiles : 0,
      activeDrivers: drivers.filter(d => d.status === 'active').length,
      activeTrucks: trucks.filter(t => t.status === 'active').length,
    };
  }, [loads, fuelEntries, drivers, trucks]);

  // ============ NAV ITEMS ============
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'loads', label: 'Loads', icon: '🚛' },
    { id: 'fuel', label: 'Fuel Log', icon: '⛽' },
    { id: 'drivers', label: 'Drivers', icon: '👤' },
    { id: 'trucks', label: 'Trucks', icon: '🚚' },
    { id: 'ifta', label: 'IFTA', icon: '📋' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'perdiem', label: 'Per Diem', icon: '📅' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // ============ CRUD FUNCTIONS ============
  
  // Drivers
  const saveDriver = (driver) => {
    if (editingDriver) {
      setDrivers(prev => prev.map(d => d.id === driver.id ? driver : d));
    } else {
      setDrivers(prev => [...prev, { ...driver, id: uid(), createdAt: new Date().toISOString() }]);
    }
    setShowDriverModal(false);
    setEditingDriver(null);
  };
  
  const deleteDriver = (id) => {
    if (confirm('Delete this driver?')) {
      setDrivers(prev => prev.filter(d => d.id !== id));
    }
  };
  
  const deleteSelectedDrivers = () => {
    if (confirm(`Delete ${driversSelect.selectedCount} drivers?`)) {
      setDrivers(prev => prev.filter(d => !driversSelect.selectedIds.has(d.id)));
      driversSelect.clearSelection();
    }
  };

  // Trucks
  const saveTruck = (truck) => {
    if (editingTruck) {
      setTrucks(prev => prev.map(t => t.id === truck.id ? truck : t));
    } else {
      setTrucks(prev => [...prev, { ...truck, id: uid(), createdAt: new Date().toISOString() }]);
    }
    setShowTruckModal(false);
    setEditingTruck(null);
  };
  
  const deleteTruck = (id) => {
    if (confirm('Delete this truck?')) {
      setTrucks(prev => prev.filter(t => t.id !== id));
    }
  };
  
  const deleteSelectedTrucks = () => {
    if (confirm(`Delete ${trucksSelect.selectedCount} trucks?`)) {
      setTrucks(prev => prev.filter(t => !trucksSelect.selectedIds.has(t.id)));
      trucksSelect.clearSelection();
    }
  };

  // Loads
  const saveLoad = (load) => {
    if (editingLoad) {
      setLoads(prev => prev.map(l => l.id === load.id ? load : l));
    } else {
      setLoads(prev => [...prev, { ...load, id: uid() }]);
    }
    setShowLoadModal(false);
    setEditingLoad(null);
  };
  
  const deleteLoad = (id) => {
    if (confirm('Delete this load?')) {
      setLoads(prev => prev.filter(l => l.id !== id));
    }
  };
  
  const deleteSelectedLoads = () => {
    if (confirm(`Delete ${loadsSelect.selectedCount} loads?`)) {
      setLoads(prev => prev.filter(l => !loadsSelect.selectedIds.has(l.id)));
      loadsSelect.clearSelection();
    }
  };

  // Fuel
  const saveFuel = (entry) => {
    if (editingFuel) {
      setFuelEntries(prev => prev.map(f => f.id === entry.id ? entry : f));
    } else {
      setFuelEntries(prev => [...prev, { ...entry, id: uid() }]);
    }
    setShowFuelModal(false);
    setEditingFuel(null);
  };
  
  const deleteFuel = (id) => {
    if (confirm('Delete this fuel entry?')) {
      setFuelEntries(prev => prev.filter(f => f.id !== id));
    }
  };
  
  const deleteSelectedFuel = () => {
    if (confirm(`Delete ${fuelSelect.selectedCount} fuel entries?`)) {
      setFuelEntries(prev => prev.filter(f => !fuelSelect.selectedIds.has(f.id)));
      fuelSelect.clearSelection();
    }
  };

  // Expenses
  const saveExpense = (expense) => {
    if (editingExpense) {
      setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    } else {
      setExpenses(prev => [...prev, { ...expense, id: uid() }]);
    }
    setShowExpenseModal(false);
    setEditingExpense(null);
  };
  
  const deleteExpense = (id) => {
    if (confirm('Delete this expense?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };
  
  const deleteSelectedExpenses = () => {
    if (confirm(`Delete ${expensesSelect.selectedCount} expenses?`)) {
      setExpenses(prev => prev.filter(e => !expensesSelect.selectedIds.has(e.id)));
      expensesSelect.clearSelection();
    }
  };

  // ============ EXPORT FUNCTIONS ============
  const exportFuel = () => {
    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'location', label: 'Location' },
      { key: 'state', label: 'State' },
      { key: 'gallons', label: 'Gallons', format: v => parseFloat(v).toFixed(2) },
      { key: 'pricePerGallon', label: 'Price/Gal', format: v => parseFloat(v).toFixed(3) },
      { key: 'totalAmount', label: 'Total', format: (v, row) => (v || (parseFloat(row.gallons) * parseFloat(row.pricePerGallon))).toFixed(2) },
    ];
    const data = fuelSelect.selectedCount > 0 
      ? fuelEntries.filter(f => fuelSelect.selectedIds.has(f.id))
      : fuelEntries;
    exportToCSV(data, columns, 'BalanceBooks-Fuel-Log.csv');
  };

  const exportLoads = () => {
    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'loadNumber', label: 'Load #' },
      { key: 'rate', label: 'Rate', format: v => parseFloat(v).toFixed(2) },
      { key: 'loadedMiles', label: 'Loaded Miles' },
      { key: 'deadheadMiles', label: 'Deadhead Miles' },
      { key: 'status', label: 'Status' },
    ];
    const data = loadsSelect.selectedCount > 0 
      ? loads.filter(l => loadsSelect.selectedIds.has(l.id))
      : loads;
    exportToCSV(data, columns, 'BalanceBooks-Loads.csv');
  };

  const exportDrivers = () => {
    const columns = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'paymentType', label: 'Pay Type' },
      { key: 'payRate', label: 'Pay Rate' },
      { key: 'status', label: 'Status' },
    ];
    exportToCSV(drivers, columns, 'BalanceBooks-Drivers.csv');
  };

  // ============ DRIVER MODAL ============
  const DriverModal = () => {
    const [form, setForm] = useState(editingDriver || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      licenseState: '',
      licenseExpiry: '',
      hireDate: new Date().toISOString().split('T')[0],
      status: 'active',
      paymentType: PAY_TYPES.PER_MILE,
      payRate: '',
      fuelAdvanceRate: '',
      insuranceDeduction: '',
      assignedTruckId: '',
      notes: '',
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      saveDriver(form);
    };

    return (
      <div style={styles.modal} onClick={() => { setShowDriverModal(false); setEditingDriver(null); }}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 32, fontSize: 28 }}>
            {editingDriver ? '✏️ Edit Driver' : '👤 Add Driver'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name *</label>
                <input
                  style={styles.input}
                  value={form.firstName}
                  onChange={e => setForm({...form, firstName: e.target.value})}
                  required
                  placeholder="John"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name *</label>
                <input
                  style={styles.input}
                  value={form.lastName}
                  onChange={e => setForm({...form, lastName: e.target.value})}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input
                  style={styles.input}
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="driver@email.com"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>CDL Number</label>
                <input
                  style={styles.input}
                  value={form.licenseNumber}
                  onChange={e => setForm({...form, licenseNumber: e.target.value})}
                  placeholder="License #"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>CDL State</label>
                <select
                  style={styles.select}
                  value={form.licenseState}
                  onChange={e => setForm({...form, licenseState: e.target.value})}
                >
                  <option value="">Select State</option>
                  {Object.entries(STATES).map(([abbr, name]) => (
                    <option key={abbr} value={abbr}>{abbr} - {name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>CDL Expiry</label>
                <input
                  style={styles.input}
                  type="date"
                  value={form.licenseExpiry}
                  onChange={e => setForm({...form, licenseExpiry: e.target.value})}
                />
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${colors.gray700}`, margin: '32px 0', paddingTop: 32 }}>
              <h3 style={{ color: colors.orange, marginBottom: 24, fontSize: 18 }}>💰 Pay Configuration</h3>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Type *</label>
                  <select
                    style={styles.select}
                    value={form.paymentType}
                    onChange={e => setForm({...form, paymentType: e.target.value})}
                  >
                    <option value={PAY_TYPES.PER_MILE}>Per Mile</option>
                    <option value={PAY_TYPES.PERCENTAGE}>Percentage</option>
                    <option value={PAY_TYPES.FLAT_RATE}>Flat Rate per Load</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>
                    Pay Rate * {form.paymentType === PAY_TYPES.PER_MILE && '($/mile)'}
                    {form.paymentType === PAY_TYPES.PERCENTAGE && '(%)'}
                    {form.paymentType === PAY_TYPES.FLAT_RATE && '($/load)'}
                  </label>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.01"
                    value={form.payRate}
                    onChange={e => setForm({...form, payRate: e.target.value})}
                    placeholder={form.paymentType === PAY_TYPES.PER_MILE ? '0.55' : form.paymentType === PAY_TYPES.PERCENTAGE ? '28' : '500'}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fuel Advance Rate (%)</label>
                  <input
                    style={styles.input}
                    type="number"
                    step="1"
                    value={form.fuelAdvanceRate}
                    onChange={e => setForm({...form, fuelAdvanceRate: e.target.value})}
                    placeholder="0 (no deduction)"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Weekly Insurance Deduction ($)</label>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.01"
                    value={form.insuranceDeduction}
                    onChange={e => setForm({...form, insuranceDeduction: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assigned Truck</label>
                <select
                  style={styles.select}
                  value={form.assignedTruckId}
                  onChange={e => setForm({...form, assignedTruckId: e.target.value})}
                >
                  <option value="">No Truck Assigned</option>
                  {trucks.filter(t => t.status === 'active').map(truck => (
                    <option key={truck.id} value={truck.id}>
                      {truck.unitNumber} - {truck.year} {truck.make} {truck.model}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea
                style={{ ...styles.input, minHeight: 100, resize: 'vertical' }}
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Additional notes..."
              />
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 32 }}>
              <button type="button" style={styles.btn('secondary')} onClick={() => { setShowDriverModal(false); setEditingDriver(null); }}>
                Cancel
              </button>
              <button type="submit" style={styles.btn('primary')}>
                {editingDriver ? '💾 Update Driver' : '➕ Add Driver'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ TRUCK MODAL ============
  const TruckModal = () => {
    const [form, setForm] = useState(editingTruck || {
      unitNumber: '',
      vin: '',
      year: '',
      make: '',
      model: '',
      licensePlate: '',
      licensePlateState: '',
      status: 'active',
      fuelCapacity: '',
      targetMPG: '',
      ownershipType: 'owned',
      monthlyPayment: '',
      notes: '',
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      saveTruck(form);
    };

    return (
      <div style={styles.modal} onClick={() => { setShowTruckModal(false); setEditingTruck(null); }}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 32, fontSize: 28 }}>
            {editingTruck ? '✏️ Edit Truck' : '🚚 Add Truck'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Unit Number *</label>
                <input
                  style={styles.input}
                  value={form.unitNumber}
                  onChange={e => setForm({...form, unitNumber: e.target.value})}
                  required
                  placeholder="Unit 101"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>VIN</label>
                <input
                  style={styles.input}
                  value={form.vin}
                  onChange={e => setForm({...form, vin: e.target.value})}
                  placeholder="17-character VIN"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Year</label>
                <input
                  style={styles.input}
                  type="number"
                  value={form.year}
                  onChange={e => setForm({...form, year: e.target.value})}
                  placeholder="2024"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Make</label>
                <select
                  style={styles.select}
                  value={form.make}
                  onChange={e => setForm({...form, make: e.target.value})}
                >
                  <option value="">Select Make</option>
                  <option value="Freightliner">Freightliner</option>
                  <option value="Kenworth">Kenworth</option>
                  <option value="Peterbilt">Peterbilt</option>
                  <option value="Volvo">Volvo</option>
                  <option value="International">International</option>
                  <option value="Mack">Mack</option>
                  <option value="Western Star">Western Star</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Model</label>
                <input
                  style={styles.input}
                  value={form.model}
                  onChange={e => setForm({...form, model: e.target.value})}
                  placeholder="Cascadia"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>License Plate</label>
                <input
                  style={styles.input}
                  value={form.licensePlate}
                  onChange={e => setForm({...form, licensePlate: e.target.value})}
                  placeholder="ABC-1234"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Plate State</label>
                <select
                  style={styles.select}
                  value={form.licensePlateState}
                  onChange={e => setForm({...form, licensePlateState: e.target.value})}
                >
                  <option value="">Select State</option>
                  {Object.entries(STATES).map(([abbr, name]) => (
                    <option key={abbr} value={abbr}>{abbr} - {name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  style={styles.select}
                  value={form.status}
                  onChange={e => setForm({...form, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${colors.gray700}`, margin: '32px 0', paddingTop: 32 }}>
              <h3 style={{ color: colors.teal, marginBottom: 24, fontSize: 18 }}>⛽ Specifications</h3>
              
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fuel Capacity (gallons)</label>
                  <input
                    style={styles.input}
                    type="number"
                    value={form.fuelCapacity}
                    onChange={e => setForm({...form, fuelCapacity: e.target.value})}
                    placeholder="300"
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Target MPG</label>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.1"
                    value={form.targetMPG}
                    onChange={e => setForm({...form, targetMPG: e.target.value})}
                    placeholder="7.5"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Ownership Type</label>
                  <select
                    style={styles.select}
                    value={form.ownershipType}
                    onChange={e => setForm({...form, ownershipType: e.target.value})}
                  >
                    <option value="owned">Owned</option>
                    <option value="leased">Leased</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Monthly Payment ($)</label>
                  <input
                    style={styles.input}
                    type="number"
                    step="0.01"
                    value={form.monthlyPayment}
                    onChange={e => setForm({...form, monthlyPayment: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea
                style={{ ...styles.input, minHeight: 100, resize: 'vertical' }}
                value={form.notes}
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Maintenance notes, etc..."
              />
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 32 }}>
              <button type="button" style={styles.btn('secondary')} onClick={() => { setShowTruckModal(false); setEditingTruck(null); }}>
                Cancel
              </button>
              <button type="submit" style={styles.btn('primary')}>
                {editingTruck ? '💾 Update Truck' : '➕ Add Truck'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ BULK ACTIONS BAR COMPONENT ============
  const BulkActionsBar = ({ selectedCount, onDelete, onExport, onClear, showPayActions, onMarkPaid }) => {
    if (selectedCount === 0) return null;
    return (
      <div style={styles.bulkActions}>
        <div style={styles.selectionBadge}>
          <span>✓</span>
          <span>{selectedCount} selected</span>
        </div>
        <div style={{ width: 1, height: 24, background: colors.orange + '40', margin: '0 8px' }} />
        {showPayActions && onMarkPaid && (
          <button style={styles.btnSmall('success')} onClick={onMarkPaid}>✓ Mark Paid</button>
        )}
        {onExport && (
          <button style={styles.btnSmall('secondary')} onClick={onExport}>📤 Export</button>
        )}
        {onDelete && (
          <button style={styles.btnSmall('danger')} onClick={onDelete}>🗑️ Delete</button>
        )}
        <button 
          style={{ ...styles.btnSmall('secondary'), background: 'transparent', border: `1px solid ${colors.orange}40`, color: colors.orange }}
          onClick={onClear}
        >
          ✕ Clear
        </button>
      </div>
    );
  };

  // ============ RENDER DRIVERS ============
  const renderDrivers = () => {
    const getDriverTruck = (driverId) => {
      const driver = drivers.find(d => d.id === driverId);
      if (!driver?.assignedTruckId) return null;
      return trucks.find(t => t.id === driver.assignedTruckId);
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return colors.green;
        case 'inactive': return colors.yellow;
        case 'terminated': return colors.red;
        default: return colors.gray400;
      }
    };

    return (
      <>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>👤 Drivers</h1>
          <p style={styles.pageSubtitle}>Manage your drivers, pay rates, and assignments</p>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard(colors.green)}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statValue(colors.green)}>{drivers.filter(d => d.status === 'active').length}</div>
            <div style={styles.statLabel}>Active Drivers</div>
          </div>
          <div style={styles.statCard(colors.orange)}>
            <div style={styles.statIcon}>👥</div>
            <div style={styles.statValue(colors.orange)}>{drivers.length}</div>
            <div style={styles.statLabel}>Total Drivers</div>
          </div>
          <div style={styles.statCard(colors.teal)}>
            <div style={styles.statIcon}>🚛</div>
            <div style={styles.statValue(colors.teal)}>{drivers.filter(d => d.assignedTruckId).length}</div>
            <div style={styles.statLabel}>Assigned to Trucks</div>
          </div>
        </div>

        {/* Drivers Table */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>👤 Driver Roster</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={styles.btn('secondary')} onClick={exportDrivers}>
                📤 Export
              </button>
              <button style={styles.btn('primary')} onClick={() => setShowDriverModal(true)}>
                ➕ Add Driver
              </button>
            </div>
          </div>

          <BulkActionsBar
            selectedCount={driversSelect.selectedCount}
            onDelete={deleteSelectedDrivers}
            onClear={driversSelect.clearSelection}
          />

          {drivers.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 64, marginBottom: 24 }}>👤</div>
              <h3 style={{ color: colors.white, marginBottom: 12 }}>No Drivers Yet</h3>
              <p style={{ marginBottom: 24 }}>Add your first driver to get started</p>
              <button style={styles.btn('primary')} onClick={() => setShowDriverModal(true)}>
                ➕ Add Driver
              </button>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: 50 }}>
                    <input
                      type="checkbox"
                      checked={driversSelect.allSelected}
                      ref={el => { if (el) el.indeterminate = driversSelect.someSelected && !driversSelect.allSelected; }}
                      onChange={driversSelect.toggleAll}
                      style={styles.checkbox}
                    />
                  </th>
                  <th style={styles.th}>Driver</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Pay Rate</th>
                  <th style={styles.th}>Assigned Truck</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => {
                  const truck = getDriverTruck(driver.id);
                  return (
                    <tr 
                      key={driver.id}
                      style={{ 
                        background: driversSelect.isSelected(driver.id) ? `${colors.orange}15` : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => driversSelect.toggleItem(driver.id)}
                    >
                      <td style={styles.tdFirst}>
                        <input
                          type="checkbox"
                          checked={driversSelect.isSelected(driver.id)}
                          onChange={() => driversSelect.toggleItem(driver.id)}
                          onClick={e => e.stopPropagation()}
                          style={styles.checkbox}
                        />
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600 }}>{driver.firstName} {driver.lastName}</div>
                        <div style={{ fontSize: 13, color: colors.gray400 }}>
                          {driver.licenseNumber && `CDL: ${driver.licenseNumber}`}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div>{driver.phone || '-'}</div>
                        <div style={{ fontSize: 13, color: colors.gray400 }}>{driver.email || '-'}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badge(colors.orange)}>
                          {formatPayRate(driver.paymentType, driver.payRate)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {truck ? (
                          <span style={styles.badge(colors.teal)}>
                            🚛 {truck.unitNumber}
                          </span>
                        ) : (
                          <span style={{ color: colors.gray500 }}>Not assigned</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badge(getStatusColor(driver.status))}>
                          {driver.status}
                        </span>
                      </td>
                      <td style={styles.tdLast}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            style={styles.btnSmall('secondary')}
                            onClick={(e) => { e.stopPropagation(); setEditingDriver(driver); setShowDriverModal(true); }}
                          >
                            ✏️
                          </button>
                          <button
                            style={styles.btnSmall('danger')}
                            onClick={(e) => { e.stopPropagation(); deleteDriver(driver.id); }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };

  // ============ RENDER TRUCKS ============
  const renderTrucks = () => {
    const getAssignedDriver = (truckId) => {
      return drivers.find(d => d.assignedTruckId === truckId);
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return colors.green;
        case 'inactive': return colors.yellow;
        case 'maintenance': return colors.orange;
        case 'sold': return colors.red;
        default: return colors.gray400;
      }
    };

    // Calculate truck stats
    const getTruckStats = (truckId) => {
      const truckFuel = fuelEntries.filter(f => f.truckId === truckId);
      const truckLoads = loads.filter(l => l.truckId === truckId);
      const totalMiles = truckLoads.reduce((sum, l) => 
        sum + (parseFloat(l.loadedMiles) || 0) + (parseFloat(l.deadheadMiles) || 0), 0);
      const totalGallons = truckFuel.reduce((sum, f) => sum + (parseFloat(f.gallons) || 0), 0);
      const mpg = totalGallons > 0 ? totalMiles / totalGallons : 0;
      return { miles: totalMiles, gallons: totalGallons, mpg };
    };

    return (
      <>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>🚚 Trucks</h1>
          <p style={styles.pageSubtitle}>Manage your fleet inventory and assignments</p>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard(colors.green)}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statValue(colors.green)}>{trucks.filter(t => t.status === 'active').length}</div>
            <div style={styles.statLabel}>Active Trucks</div>
          </div>
          <div style={styles.statCard(colors.teal)}>
            <div style={styles.statIcon}>🚚</div>
            <div style={styles.statValue(colors.teal)}>{trucks.length}</div>
            <div style={styles.statLabel}>Total Fleet</div>
          </div>
          <div style={styles.statCard(colors.orange)}>
            <div style={styles.statIcon}>🔧</div>
            <div style={styles.statValue(colors.orange)}>{trucks.filter(t => t.status === 'maintenance').length}</div>
            <div style={styles.statLabel}>In Maintenance</div>
          </div>
        </div>

        {/* Trucks Table */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>🚚 Fleet Inventory</span>
            <button style={styles.btn('primary')} onClick={() => setShowTruckModal(true)}>
              ➕ Add Truck
            </button>
          </div>

          <BulkActionsBar
            selectedCount={trucksSelect.selectedCount}
            onDelete={deleteSelectedTrucks}
            onClear={trucksSelect.clearSelection}
          />

          {trucks.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 64, marginBottom: 24 }}>🚚</div>
              <h3 style={{ color: colors.white, marginBottom: 12 }}>No Trucks Yet</h3>
              <p style={{ marginBottom: 24 }}>Add your first truck to start tracking</p>
              <button style={styles.btn('primary')} onClick={() => setShowTruckModal(true)}>
                ➕ Add Truck
              </button>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: 50 }}>
                    <input
                      type="checkbox"
                      checked={trucksSelect.allSelected}
                      ref={el => { if (el) el.indeterminate = trucksSelect.someSelected && !trucksSelect.allSelected; }}
                      onChange={trucksSelect.toggleAll}
                      style={styles.checkbox}
                    />
                  </th>
                  <th style={styles.th}>Unit</th>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Assigned Driver</th>
                  <th style={styles.th}>MPG</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trucks.map(truck => {
                  const driver = getAssignedDriver(truck.id);
                  const stats = getTruckStats(truck.id);
                  return (
                    <tr 
                      key={truck.id}
                      style={{ 
                        background: trucksSelect.isSelected(truck.id) ? `${colors.orange}15` : 'transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => trucksSelect.toggleItem(truck.id)}
                    >
                      <td style={styles.tdFirst}>
                        <input
                          type="checkbox"
                          checked={trucksSelect.isSelected(truck.id)}
                          onChange={() => trucksSelect.toggleItem(truck.id)}
                          onClick={e => e.stopPropagation()}
                          style={styles.checkbox}
                        />
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{truck.unitNumber}</div>
                        <div style={{ fontSize: 13, color: colors.gray400 }}>{truck.licensePlate}</div>
                      </td>
                      <td style={styles.td}>
                        <div>{truck.year} {truck.make}</div>
                        <div style={{ fontSize: 13, color: colors.gray400 }}>{truck.model}</div>
                      </td>
                      <td style={styles.td}>
                        {driver ? (
                          <span style={styles.badge(colors.blue)}>
                            👤 {driver.firstName} {driver.lastName}
                          </span>
                        ) : (
                          <span style={{ color: colors.gray500 }}>Unassigned</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600, color: stats.mpg >= (truck.targetMPG || 6) ? colors.green : colors.yellow }}>
                          {stats.mpg > 0 ? stats.mpg.toFixed(1) : '-'} MPG
                        </div>
                        <div style={{ fontSize: 13, color: colors.gray400 }}>
                          Target: {truck.targetMPG || '-'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.badge(getStatusColor(truck.status))}>
                          {truck.status}
                        </span>
                      </td>
                      <td style={styles.tdLast}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            style={styles.btnSmall('secondary')}
                            onClick={(e) => { e.stopPropagation(); setEditingTruck(truck); setShowTruckModal(true); }}
                          >
                            ✏️
                          </button>
                          <button
                            style={styles.btnSmall('danger')}
                            onClick={(e) => { e.stopPropagation(); deleteTruck(truck.id); }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };

  // ============ RENDER DASHBOARD ============
  const renderDashboard = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>📊 Dashboard</h1>
        <p style={styles.pageSubtitle}>Overview of your trucking business this month</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard(colors.green, true)} onClick={() => setActiveTab('loads')}>
          <div style={styles.statIcon}>🚛</div>
          <div style={styles.statValue(colors.green)}>{dashboardStats.loads}</div>
          <div style={styles.statLabel}>Loads This Month</div>
        </div>
        <div style={styles.statCard(colors.orange, true)} onClick={() => setActiveTab('loads')}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statValue(colors.orange)}>{formatCurrency(dashboardStats.revenue)}</div>
          <div style={styles.statLabel}>Revenue</div>
        </div>
        <div style={styles.statCard(colors.teal, true)} onClick={() => setActiveTab('fuel')}>
          <div style={styles.statIcon}>⛽</div>
          <div style={styles.statValue(colors.teal)}>{formatCurrency(dashboardStats.fuelCost)}</div>
          <div style={styles.statLabel}>Fuel Cost</div>
        </div>
        <div style={styles.statCard(colors.blue, true)} onClick={() => setActiveTab('drivers')}>
          <div style={styles.statIcon}>👤</div>
          <div style={styles.statValue(colors.blue)}>{dashboardStats.activeDrivers}</div>
          <div style={styles.statLabel}>Active Drivers</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>📈 Performance</div>
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${colors.gray700}` }}>
              <span style={{ color: colors.gray400 }}>Total Miles</span>
              <span style={{ color: colors.white, fontWeight: 600 }}>{formatNumber(dashboardStats.miles)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${colors.gray700}` }}>
              <span style={{ color: colors.gray400 }}>Revenue/Mile</span>
              <span style={{ color: colors.green, fontWeight: 600 }}>{formatCurrency(dashboardStats.rpm)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0' }}>
              <span style={{ color: colors.gray400 }}>Active Trucks</span>
              <span style={{ color: colors.teal, fontWeight: 600 }}>{dashboardStats.activeTrucks}</span>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>🚀 Quick Actions</div>
          <div style={{ display: 'grid', gap: 16 }}>
            <button style={styles.btn('primary')} onClick={() => { setActiveTab('loads'); setShowLoadModal(true); }}>
              ➕ Add Load
            </button>
            <button style={styles.btn('secondary')} onClick={() => { setActiveTab('fuel'); setShowFuelModal(true); }}>
              ⛽ Log Fuel
            </button>
            <button style={styles.btn('secondary')} onClick={() => { setActiveTab('drivers'); setShowDriverModal(true); }}>
              👤 Add Driver
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ============ RENDER FUEL (with multi-select) ============
  const renderFuel = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>⛽ Fuel Purchases</h1>
        <p style={styles.pageSubtitle}>Track fuel purchases for IFTA and expense reporting</p>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>⛽ Fuel Log</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={styles.btn('secondary')} onClick={exportFuel}>
              📤 Export {fuelSelect.selectedCount > 0 ? `(${fuelSelect.selectedCount})` : 'All'}
            </button>
            <button style={styles.btn('primary')} onClick={() => setShowFuelModal(true)}>
              ➕ Add Fuel
            </button>
          </div>
        </div>

        <BulkActionsBar
          selectedCount={fuelSelect.selectedCount}
          onDelete={deleteSelectedFuel}
          onExport={exportFuel}
          onClear={fuelSelect.clearSelection}
        />

        {fuelEntries.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>⛽</div>
            <h3 style={{ color: colors.white, marginBottom: 12 }}>No Fuel Entries Yet</h3>
            <p style={{ marginBottom: 24 }}>Start tracking your fuel purchases</p>
            <button style={styles.btn('primary')} onClick={() => setShowFuelModal(true)}>
              ➕ Add Fuel Entry
            </button>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 50 }}>
                  <input
                    type="checkbox"
                    checked={fuelSelect.allSelected}
                    ref={el => { if (el) el.indeterminate = fuelSelect.someSelected && !fuelSelect.allSelected; }}
                    onChange={fuelSelect.toggleAll}
                    style={styles.checkbox}
                  />
                </th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>State</th>
                <th style={styles.th}>Gallons</th>
                <th style={styles.th}>Price/Gal</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fuelEntries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => (
                <tr 
                  key={entry.id}
                  style={{ 
                    background: fuelSelect.isSelected(entry.id) ? `${colors.orange}15` : 'transparent',
                    cursor: 'pointer'
                  }}
                  onClick={() => fuelSelect.toggleItem(entry.id)}
                >
                  <td style={styles.tdFirst}>
                    <input
                      type="checkbox"
                      checked={fuelSelect.isSelected(entry.id)}
                      onChange={() => fuelSelect.toggleItem(entry.id)}
                      onClick={e => e.stopPropagation()}
                      style={styles.checkbox}
                    />
                  </td>
                  <td style={styles.td}>{entry.date}</td>
                  <td style={styles.td}>{entry.location || '-'}</td>
                  <td style={styles.td}><span style={styles.badge(colors.blue)}>{entry.state}</span></td>
                  <td style={styles.td}>{parseFloat(entry.gallons).toFixed(2)}</td>
                  <td style={styles.td}>{formatCurrency(entry.pricePerGallon)}</td>
                  <td style={styles.td} style={{ fontWeight: 600, color: colors.orange }}>
                    {formatCurrency(entry.totalAmount || (parseFloat(entry.gallons) * parseFloat(entry.pricePerGallon)))}
                  </td>
                  <td style={styles.tdLast}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        style={styles.btnSmall('secondary')}
                        onClick={(e) => { e.stopPropagation(); setEditingFuel(entry); setShowFuelModal(true); }}
                      >
                        ✏️
                      </button>
                      <button
                        style={styles.btnSmall('danger')}
                        onClick={(e) => { e.stopPropagation(); deleteFuel(entry.id); }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  // ============ RENDER LOADS (with multi-select) ============
  const renderLoads = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>🚛 Loads</h1>
        <p style={styles.pageSubtitle}>Manage your loads and track revenue</p>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>🚛 Load Board</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={styles.btn('secondary')} onClick={exportLoads}>
              📤 Export {loadsSelect.selectedCount > 0 ? `(${loadsSelect.selectedCount})` : 'All'}
            </button>
            <button style={styles.btn('primary')} onClick={() => setShowLoadModal(true)}>
              ➕ Add Load
            </button>
          </div>
        </div>

        <BulkActionsBar
          selectedCount={loadsSelect.selectedCount}
          onDelete={deleteSelectedLoads}
          onExport={exportLoads}
          onClear={loadsSelect.clearSelection}
          showPayActions
          onMarkPaid={() => {
            setLoads(prev => prev.map(l => 
              loadsSelect.selectedIds.has(l.id) ? { ...l, status: 'paid' } : l
            ));
            loadsSelect.clearSelection();
          }}
        />

        {loads.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🚛</div>
            <h3 style={{ color: colors.white, marginBottom: 12 }}>No Loads Yet</h3>
            <p style={{ marginBottom: 24 }}>Add your first load to start tracking</p>
            <button style={styles.btn('primary')} onClick={() => setShowLoadModal(true)}>
              ➕ Add Load
            </button>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 50 }}>
                  <input
                    type="checkbox"
                    checked={loadsSelect.allSelected}
                    ref={el => { if (el) el.indeterminate = loadsSelect.someSelected && !loadsSelect.allSelected; }}
                    onChange={loadsSelect.toggleAll}
                    style={styles.checkbox}
                  />
                </th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Load #</th>
                <th style={styles.th}>Route</th>
                <th style={styles.th}>Miles</th>
                <th style={styles.th}>Rate</th>
                <th style={styles.th}>$/Mile</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loads.sort((a, b) => new Date(b.date) - new Date(a.date)).map(load => {
                const totalMiles = (parseFloat(load.loadedMiles) || 0) + (parseFloat(load.deadheadMiles) || 0);
                const rpm = totalMiles > 0 ? parseFloat(load.rate) / totalMiles : 0;
                return (
                  <tr 
                    key={load.id}
                    style={{ 
                      background: loadsSelect.isSelected(load.id) ? `${colors.orange}15` : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => loadsSelect.toggleItem(load.id)}
                  >
                    <td style={styles.tdFirst}>
                      <input
                        type="checkbox"
                        checked={loadsSelect.isSelected(load.id)}
                        onChange={() => loadsSelect.toggleItem(load.id)}
                        onClick={e => e.stopPropagation()}
                        style={styles.checkbox}
                      />
                    </td>
                    <td style={styles.td}>{load.date}</td>
                    <td style={styles.td}>{load.loadNumber || '-'}</td>
                    <td style={styles.td}>
                      <div style={{ fontSize: 13 }}>
                        {load.stops?.[0]?.location || 'Origin'} →<br/>
                        {load.stops?.[load.stops?.length - 1]?.location || 'Destination'}
                      </div>
                    </td>
                    <td style={styles.td}>{formatNumber(totalMiles)}</td>
                    <td style={styles.td} style={{ fontWeight: 600, color: colors.green }}>
                      {formatCurrency(load.rate)}
                    </td>
                    <td style={styles.td} style={{ color: rpm >= 2 ? colors.green : colors.yellow }}>
                      {formatCurrency(rpm)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.badge(load.status === 'paid' ? colors.green : colors.yellow)}>
                        {load.status || 'pending'}
                      </span>
                    </td>
                    <td style={styles.tdLast}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          style={styles.btnSmall('secondary')}
                          onClick={(e) => { e.stopPropagation(); setEditingLoad(load); setShowLoadModal(true); }}
                        >
                          ✏️
                        </button>
                        <button
                          style={styles.btnSmall('danger')}
                          onClick={(e) => { e.stopPropagation(); deleteLoad(load.id); }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  // ============ PLACEHOLDER RENDERS ============
  const renderIFTA = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>📋 IFTA Reports</h1>
        <p style={styles.pageSubtitle}>Generate quarterly IFTA reports from your fuel and mileage data</p>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>IFTA Summary</div>
        <p style={{ color: colors.gray400 }}>IFTA calculations will be generated from your fuel and load data.</p>
      </div>
    </>
  );

  const renderExpenses = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>💰 Expenses</h1>
        <p style={styles.pageSubtitle}>Track business expenses and deductions</p>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>💰 Expense Tracker</span>
          <button style={styles.btn('primary')} onClick={() => setShowExpenseModal(true)}>
            ➕ Add Expense
          </button>
        </div>
        {expenses.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>💰</div>
            <h3 style={{ color: colors.white, marginBottom: 12 }}>No Expenses Yet</h3>
            <p style={{ marginBottom: 24 }}>Start tracking your business expenses</p>
          </div>
        ) : (
          <p style={{ color: colors.gray400 }}>{expenses.length} expenses recorded</p>
        )}
      </div>
    </>
  );

  const renderPerDiem = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>📅 Per Diem</h1>
        <p style={styles.pageSubtitle}>Track per diem days for tax deductions</p>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>Per Diem Tracker</div>
        <p style={{ color: colors.gray400 }}>Track your nights away from home for tax deductions.</p>
      </div>
    </>
  );

  const renderSettings = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>⚙️ Settings</h1>
        <p style={styles.pageSubtitle}>Configure your app preferences</p>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>App Settings</div>
        <div style={{ display: 'grid', gap: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: colors.white, fontWeight: 600, marginBottom: 4 }}>Auto Backup</div>
              <div style={{ color: colors.gray400, fontSize: 14 }}>Automatically save data</div>
            </div>
            <input
              type="checkbox"
              checked={autoBackup}
              onChange={e => setAutoBackup(e.target.checked)}
              style={{ ...styles.checkbox, width: 24, height: 24 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: colors.white, fontWeight: 600, marginBottom: 4 }}>Notifications</div>
              <div style={{ color: colors.gray400, fontSize: 14 }}>Enable app notifications</div>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={e => setNotifications(e.target.checked)}
              style={{ ...styles.checkbox, width: 24, height: 24 }}
            />
          </div>
        </div>
      </div>
      
      {/* Clear Data Section */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>🧹 Data Management</div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: colors.gray300, fontWeight: 600, marginBottom: 16 }}>Clear Individual Data</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            <button style={styles.btnSmall('secondary')} onClick={() => {
              if (confirm('Clear all fuel data?')) { setFuelEntries([]); }
            }}>⛽ Fuel</button>
            <button style={styles.btnSmall('secondary')} onClick={() => {
              if (confirm('Clear all loads?')) { setLoads([]); }
            }}>🚛 Loads</button>
            <button style={styles.btnSmall('secondary')} onClick={() => {
              if (confirm('Clear all drivers?')) { setDrivers([]); }
            }}>👤 Drivers</button>
            <button style={styles.btnSmall('secondary')} onClick={() => {
              if (confirm('Clear all trucks?')) { setTrucks([]); }
            }}>🚚 Trucks</button>
            <button style={styles.btnSmall('secondary')} onClick={() => {
              if (confirm('Clear all expenses?')) { setExpenses([]); }
            }}>💰 Expenses</button>
          </div>
        </div>
        <div style={{ background: `${colors.red}20`, border: `1px solid ${colors.red}40`, borderRadius: 14, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: colors.red, fontWeight: 700, marginBottom: 4 }}>⚠️ Clear All Data</div>
            <div style={{ color: colors.gray400, fontSize: 14 }}>Permanently delete all your data</div>
          </div>
          <button style={styles.btn('danger')} onClick={async () => {
            if (confirm('Are you sure? This will delete ALL data!')) {
              await clearAllData();
              setLoads([]); setFuelEntries([]); setIftaData([]); 
              setExpenses([]); setPerDiemDays([]); setDrivers([]); setTrucks([]);
              alert('All data cleared.');
            }
          }}>
            🗑️ Clear All
          </button>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: 40, color: colors.gray500 }}>
        BalanceBooks Trucking v{APP_VERSION}
      </div>
    </>
  );

  // ============ LOADING STATE ============
  if (isLoading) {
    return (
      <div style={{
        ...styles.app,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 24
      }}>
        <div style={{ fontSize: 64 }}>🚛</div>
        <div style={{ color: colors.white, fontSize: 24, fontWeight: 700 }}>BalanceBooks Trucking</div>
        <div style={{ color: colors.gray400 }}>Loading...</div>
      </div>
    );
  }

  // ============ MAIN RENDER ============
  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={styles.sidebar(sidebarCollapsed)}>
        <div style={styles.logoContainer}>
          <div style={{ fontSize: 32 }}>🚛</div>
          {!sidebarCollapsed && (
            <div>
              <div style={styles.logoText}>BalanceBooks</div>
              <div style={styles.logoSubtext}>TRUCKING</div>
            </div>
          )}
        </div>

        <ul style={styles.nav}>
          {navItems.map(item => (
            <li
              key={item.id}
              style={styles.navItem(activeTab === item.id)}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </li>
          ))}
        </ul>

        <div style={{ padding: 16, borderTop: `1px solid rgba(255,255,255,0.08)` }}>
          <button
            style={{
              width: '100%',
              padding: 14,
              background: colors.gray700,
              border: 'none',
              borderRadius: 12,
              color: colors.white,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14
            }}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'} {!sidebarCollapsed && 'Collapse'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main(sidebarCollapsed)}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'loads' && renderLoads()}
        {activeTab === 'fuel' && renderFuel()}
        {activeTab === 'drivers' && renderDrivers()}
        {activeTab === 'trucks' && renderTrucks()}
        {activeTab === 'ifta' && renderIFTA()}
        {activeTab === 'expenses' && renderExpenses()}
        {activeTab === 'perdiem' && renderPerDiem()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Modals */}
      {showDriverModal && <DriverModal />}
      {showTruckModal && <TruckModal />}
    </div>
  );
}
