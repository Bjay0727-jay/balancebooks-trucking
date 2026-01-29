import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  db, 
  loadsDB, 
  fuelDB, 
  iftaDB, 
  expensesDB, 
  perdiemDB, 
  settingsDB,
  driversDB,
  trucksDB,
  exportAllData,
  importAllData,
  clearAllData
} from './db/database';
import { migrateFromLocalStorage, loadFromIndexedDB, needsMigration } from './db/migration';

// ============ CONSTANTS ============
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.0.0';

// Cache version for force refresh (matches BalanceBooks Pro pattern)
const CACHE_VERSION = '2.0.0';
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
const calculateDriverPay = (load, driver) => {
  if (!load || !driver) return 0;
  const { paymentType, payRate } = driver;
  const loadedMiles = parseFloat(load.loadedMiles) || 0;
  const deadheadMiles = parseFloat(load.deadheadMiles) || 0;
  const totalMiles = loadedMiles + deadheadMiles;
  const grossRevenue = parseFloat(load.rate) || 0;
  const rate = parseFloat(payRate) || 0;

  switch (paymentType) {
    case PAY_TYPES.PER_MILE: return totalMiles * rate;
    case PAY_TYPES.PERCENTAGE: return grossRevenue * (rate / 100);
    case PAY_TYPES.FLAT_RATE: return rate;
    default: return 0;
  }
};

// Major US Cities and Truck Stops for Autocomplete
const US_LOCATIONS = [
  // Major Cities
  { city: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388 },
  { city: 'Austin', state: 'TX', lat: 30.267, lng: -97.743 },
  { city: 'Baltimore', state: 'MD', lat: 39.290, lng: -76.612 },
  { city: 'Birmingham', state: 'AL', lat: 33.520, lng: -86.802 },
  { city: 'Boston', state: 'MA', lat: 42.360, lng: -71.059 },
  { city: 'Buffalo', state: 'NY', lat: 42.886, lng: -78.878 },
  { city: 'Charlotte', state: 'NC', lat: 35.227, lng: -80.843 },
  { city: 'Chicago', state: 'IL', lat: 41.878, lng: -87.630 },
  { city: 'Cincinnati', state: 'OH', lat: 39.103, lng: -84.512 },
  { city: 'Cleveland', state: 'OH', lat: 41.499, lng: -81.694 },
  { city: 'Columbus', state: 'OH', lat: 39.961, lng: -82.999 },
  { city: 'Dallas', state: 'TX', lat: 32.777, lng: -96.797 },
  { city: 'Denver', state: 'CO', lat: 39.739, lng: -104.990 },
  { city: 'Detroit', state: 'MI', lat: 42.331, lng: -83.046 },
  { city: 'El Paso', state: 'TX', lat: 31.761, lng: -106.485 },
  { city: 'Fort Worth', state: 'TX', lat: 32.755, lng: -97.331 },
  { city: 'Fresno', state: 'CA', lat: 36.738, lng: -119.785 },
  { city: 'Houston', state: 'TX', lat: 29.760, lng: -95.370 },
  { city: 'Indianapolis', state: 'IN', lat: 39.768, lng: -86.158 },
  { city: 'Jacksonville', state: 'FL', lat: 30.332, lng: -81.656 },
  { city: 'Kansas City', state: 'MO', lat: 39.100, lng: -94.579 },
  { city: 'Las Vegas', state: 'NV', lat: 36.169, lng: -115.140 },
  { city: 'Little Rock', state: 'AR', lat: 34.746, lng: -92.290 },
  { city: 'Los Angeles', state: 'CA', lat: 34.052, lng: -118.244 },
  { city: 'Louisville', state: 'KY', lat: 38.253, lng: -85.759 },
  { city: 'Memphis', state: 'TN', lat: 35.150, lng: -90.049 },
  { city: 'Miami', state: 'FL', lat: 25.762, lng: -80.192 },
  { city: 'Milwaukee', state: 'WI', lat: 43.039, lng: -87.907 },
  { city: 'Minneapolis', state: 'MN', lat: 44.978, lng: -93.265 },
  { city: 'Nashville', state: 'TN', lat: 36.163, lng: -86.782 },
  { city: 'New Orleans', state: 'LA', lat: 29.951, lng: -90.072 },
  { city: 'New York', state: 'NY', lat: 40.713, lng: -74.006 },
  { city: 'Newark', state: 'NJ', lat: 40.736, lng: -74.172 },
  { city: 'Oklahoma City', state: 'OK', lat: 35.468, lng: -97.516 },
  { city: 'Omaha', state: 'NE', lat: 41.259, lng: -95.938 },
  { city: 'Orlando', state: 'FL', lat: 28.538, lng: -81.379 },
  { city: 'Philadelphia', state: 'PA', lat: 39.952, lng: -75.164 },
  { city: 'Phoenix', state: 'AZ', lat: 33.449, lng: -112.074 },
  { city: 'Pittsburgh', state: 'PA', lat: 40.441, lng: -79.990 },
  { city: 'Portland', state: 'OR', lat: 45.505, lng: -122.675 },
  { city: 'Raleigh', state: 'NC', lat: 35.780, lng: -78.639 },
  { city: 'Richmond', state: 'VA', lat: 37.541, lng: -77.434 },
  { city: 'Sacramento', state: 'CA', lat: 38.582, lng: -121.494 },
  { city: 'Salt Lake City', state: 'UT', lat: 40.761, lng: -111.891 },
  { city: 'San Antonio', state: 'TX', lat: 29.425, lng: -98.495 },
  { city: 'San Diego', state: 'CA', lat: 32.716, lng: -117.161 },
  { city: 'San Francisco', state: 'CA', lat: 37.775, lng: -122.418 },
  { city: 'San Jose', state: 'CA', lat: 37.339, lng: -121.895 },
  { city: 'Seattle', state: 'WA', lat: 47.606, lng: -122.332 },
  { city: 'St. Louis', state: 'MO', lat: 38.627, lng: -90.199 },
  { city: 'Tampa', state: 'FL', lat: 27.951, lng: -82.458 },
  { city: 'Tucson', state: 'AZ', lat: 32.222, lng: -110.975 },
  { city: 'Tulsa', state: 'OK', lat: 36.154, lng: -95.993 },
  { city: 'Washington', state: 'DC', lat: 38.907, lng: -77.037 },
  // Major Truck Stops / Distribution Hubs
  { city: 'Laredo', state: 'TX', lat: 27.506, lng: -99.507 },
  { city: 'Ontario', state: 'CA', lat: 34.063, lng: -117.651 },
  { city: 'Savannah', state: 'GA', lat: 32.081, lng: -81.091 },
  { city: 'Long Beach', state: 'CA', lat: 33.770, lng: -118.194 },
  { city: 'Norfolk', state: 'VA', lat: 36.851, lng: -76.286 },
  { city: 'Charleston', state: 'SC', lat: 32.784, lng: -79.932 },
  { city: 'Albuquerque', state: 'NM', lat: 35.084, lng: -106.651 },
  { city: 'Amarillo', state: 'TX', lat: 35.222, lng: -101.831 },
  { city: 'Boise', state: 'ID', lat: 43.615, lng: -116.202 },
  { city: 'Spokane', state: 'WA', lat: 47.659, lng: -117.426 },
  { city: 'Cheyenne', state: 'WY', lat: 41.140, lng: -104.820 },
  { city: 'Reno', state: 'NV', lat: 39.530, lng: -119.814 },
  { city: 'Billings', state: 'MT', lat: 45.783, lng: -108.501 },
  { city: 'Fargo', state: 'ND', lat: 46.877, lng: -96.790 },
  { city: 'Sioux Falls', state: 'SD', lat: 43.545, lng: -96.731 },
  { city: 'Des Moines', state: 'IA', lat: 41.586, lng: -93.625 },
  { city: 'Wichita', state: 'KS', lat: 37.687, lng: -97.330 },
  { city: 'Shreveport', state: 'LA', lat: 32.525, lng: -93.750 },
  { city: 'Mobile', state: 'AL', lat: 30.695, lng: -88.040 },
  { city: 'Knoxville', state: 'TN', lat: 35.961, lng: -83.921 },
  { city: 'Chattanooga', state: 'TN', lat: 35.046, lng: -85.310 },
  { city: 'Lexington', state: 'KY', lat: 38.040, lng: -84.504 },
  { city: 'Grand Rapids', state: 'MI', lat: 42.963, lng: -85.668 },
  { city: 'Toledo', state: 'OH', lat: 41.654, lng: -83.536 },
  { city: 'Harrisburg', state: 'PA', lat: 40.274, lng: -76.884 },
  { city: 'Scranton', state: 'PA', lat: 41.409, lng: -75.662 },
  { city: 'Albany', state: 'NY', lat: 42.653, lng: -73.758 },
  { city: 'Syracuse', state: 'NY', lat: 43.048, lng: -76.147 },
  { city: 'Rochester', state: 'NY', lat: 43.157, lng: -77.615 },
  { city: 'Hartford', state: 'CT', lat: 41.764, lng: -72.685 },
  { city: 'Providence', state: 'RI', lat: 41.824, lng: -71.413 },
  { city: 'Springfield', state: 'MA', lat: 42.101, lng: -72.590 },
  { city: 'Manchester', state: 'NH', lat: 42.996, lng: -71.455 },
  { city: 'Portland', state: 'ME', lat: 43.661, lng: -70.255 },
  { city: 'Burlington', state: 'VT', lat: 44.476, lng: -73.212 },
  // Additional trucking corridors
  { city: 'Joplin', state: 'MO', lat: 37.084, lng: -94.513 },
  { city: 'Springfield', state: 'MO', lat: 37.209, lng: -93.292 },
  { city: 'Tulsa', state: 'OK', lat: 36.154, lng: -95.993 },
  { city: 'Lubbock', state: 'TX', lat: 33.577, lng: -101.855 },
  { city: 'Midland', state: 'TX', lat: 31.997, lng: -102.078 },
  { city: 'Odessa', state: 'TX', lat: 31.845, lng: -102.368 },
  { city: 'Abilene', state: 'TX', lat: 32.449, lng: -99.733 },
  { city: 'Waco', state: 'TX', lat: 31.549, lng: -97.147 },
  { city: 'Tyler', state: 'TX', lat: 32.351, lng: -95.301 },
  { city: 'Texarkana', state: 'TX', lat: 33.425, lng: -94.048 },
  { city: 'Beaumont', state: 'TX', lat: 30.080, lng: -94.127 },
  { city: 'Corpus Christi', state: 'TX', lat: 27.801, lng: -97.396 },
  { city: 'McAllen', state: 'TX', lat: 26.203, lng: -98.230 },
  { city: 'Brownsville', state: 'TX', lat: 25.902, lng: -97.498 },
];

// State IFTA Tax Rates (2025)
const IFTA_RATES = {
  'AL': 0.29, 'AK': 0.0895, 'AZ': 0.26, 'AR': 0.285, 'CA': 0.683,
  'CO': 0.205, 'CT': 0.431, 'DE': 0.22, 'FL': 0.35, 'GA': 0.324,
  'HI': 0.16, 'ID': 0.32, 'IL': 0.467, 'IN': 0.54, 'IA': 0.325,
  'KS': 0.26, 'KY': 0.286, 'LA': 0.20, 'ME': 0.312, 'MD': 0.361,
  'MA': 0.24, 'MI': 0.467, 'MN': 0.285, 'MS': 0.18, 'MO': 0.195,
  'MT': 0.2975, 'NE': 0.284, 'NV': 0.23, 'NH': 0.222, 'NJ': 0.414,
  'NM': 0.21, 'NY': 0.327, 'NC': 0.38, 'ND': 0.23, 'OH': 0.385,
  'OK': 0.20, 'OR': 0.38, 'PA': 0.741, 'RI': 0.35, 'SC': 0.28,
  'SD': 0.28, 'TN': 0.27, 'TX': 0.20, 'UT': 0.314, 'VT': 0.302,
  'VA': 0.262, 'WA': 0.494, 'WV': 0.357, 'WI': 0.329, 'WY': 0.24
};

const STATE_NAMES = {
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
const formatCurrency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
const formatNumber = (n, decimals = 0) => new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

// Format cents per mile (for small values like profit/mile)
const formatCentsPerMile = (dollars) => {
  if (dollars === 0) return '0¢/mi';
  const cents = dollars * 100;
  // $1.00 or more per mile - show as dollars
  if (Math.abs(cents) >= 100) {
    return formatCurrency(dollars) + '/mi';
  }
  // 1 cent or more - show 1 decimal place (e.g., "5.2¢/mi")
  if (Math.abs(cents) >= 1) {
    return cents.toFixed(1) + '¢/mi';
  }
  // Less than 1 cent - show 2 decimal places (e.g., "0.15¢/mi")
  return cents.toFixed(2) + '¢/mi';
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

  return { selectedIds, selectedCount: selectedIds.size, allSelected, someSelected, isSelected, toggleItem, toggleAll, clearSelection, setSelectedIds };
};

// ============ EXPORT TO CSV ============
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
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Haversine formula for distance calculation
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 1.15); // Add 15% for road distance approximation
};

// Calculate route distance through multiple stops
const calculateRouteDistance = (stops) => {
  if (!stops || stops.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (stops[i].lat && stops[i].lng && stops[i+1].lat && stops[i+1].lng) {
      total += calculateDistance(stops[i].lat, stops[i].lng, stops[i+1].lat, stops[i+1].lng);
    }
  }
  return total;
};

// NOTE: localStorage functions removed - now using IndexedDB via ./db/database.js

// ============ STYLES ============
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
    padding: '32px 28px',
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
    padding: '24px 16px',
    margin: 0,
    flex: 1,
  },
  navItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    marginBottom: 8,
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
    padding: '40px 48px',
    minHeight: '100vh',
    transition: 'margin-left 0.3s ease',
  }),
  header: {
    marginBottom: 40,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: 800,
    color: colors.white,
    marginBottom: 8,
    letterSpacing: '-1px',
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.gray400,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 28,
    marginBottom: 40,
  },
  statCard: (color, clickable = false, selected = false) => ({
    background: selected 
      ? `linear-gradient(135deg, ${color}30 0%, ${color}20 100%)` 
      : `linear-gradient(135deg, ${colors.gray800} 0%, ${colors.gray900} 100%)`,
    borderRadius: 20,
    padding: '32px',
    border: selected ? `2px solid ${color}` : `1px solid ${color}33`,
    cursor: clickable ? 'pointer' : 'default',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  }),
  statIcon: {
    fontSize: 32,
    marginBottom: 20,
  },
  statValue: (color) => ({
    fontSize: 36,
    fontWeight: 800,
    color: color,
    marginBottom: 8,
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
    padding: '36px',
    marginBottom: 32,
    border: `1px solid rgba(255,255,255,0.06)`,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.white,
    marginBottom: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '0 12px',
  },
  th: {
    textAlign: 'left',
    padding: '16px 20px',
    color: colors.gray400,
    fontWeight: 600,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: `1px solid ${colors.gray700}`,
  },
  td: {
    padding: '20px',
    color: colors.white,
    background: colors.gray800,
    fontSize: 15,
  },
  tdClickable: {
    padding: '20px',
    color: colors.white,
    background: colors.gray800,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  input: {
    width: '100%',
    padding: '16px 20px',
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
    padding: '16px 20px',
    background: colors.gray800,
    border: `2px solid ${colors.gray700}`,
    borderRadius: 14,
    color: colors.white,
    fontSize: 16,
    outline: 'none',
    cursor: 'pointer',
  },
  btn: (variant = 'primary') => ({
    padding: '14px 28px',
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
    padding: '48px',
    maxWidth: 700,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: `1px solid ${colors.gray700}`,
  },
  formGroup: {
    marginBottom: 28,
  },
  label: {
    display: 'block',
    marginBottom: 12,
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
};

// ============ LOGO COMPONENT ============
const BalanceBooksLogo = ({ size = 48 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <defs>
      <linearGradient id="navyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{stopColor: colors.navy}} />
        <stop offset="100%" style={{stopColor: colors.navyDark}} />
      </linearGradient>
      <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: colors.orange}} />
        <stop offset="100%" style={{stopColor: colors.orangeLight}} />
      </linearGradient>
    </defs>
    <path d="M 50 5 L 92 18 L 92 55 C 92 78 73 92 50 98 C 27 92 8 78 8 55 L 8 18 Z" fill="url(#navyGrad)"/>
    <path d="M 50 14 L 82 24 L 82 54 C 82 72 67 83 50 88 C 33 83 18 72 18 54 L 18 24 Z" fill="none" stroke="url(#orangeGrad)" strokeWidth="3"/>
    <circle cx="50" cy="52" r="24" fill="url(#orangeGrad)"/>
    <path d="M 36 52 L 46 62 L 66 42" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============ LOCATION AUTOCOMPLETE COMPONENT ============
const LocationAutocomplete = ({ value, onChange, placeholder, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const input = e.target.value;
    onChange(input);
    
    if (input.length >= 2) {
      const filtered = US_LOCATIONS.filter(loc => 
        `${loc.city}, ${loc.state}`.toLowerCase().includes(input.toLowerCase()) ||
        loc.city.toLowerCase().startsWith(input.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectLocation(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const selectLocation = (loc) => {
    const formatted = `${loc.city}, ${loc.state}`;
    onChange(formatted);
    onSelect && onSelect(loc);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        style={styles.input}
      />
      {showSuggestions && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: colors.gray800,
          border: `2px solid ${colors.orange}`,
          borderRadius: 14,
          marginTop: 8,
          maxHeight: 300,
          overflowY: 'auto',
          zIndex: 50,
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map((loc, i) => (
            <div
              key={`${loc.city}-${loc.state}`}
              onClick={() => selectLocation(loc)}
              style={{
                padding: '16px 20px',
                cursor: 'pointer',
                background: i === selectedIndex ? colors.orange : 'transparent',
                color: colors.white,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderBottom: i < suggestions.length - 1 ? `1px solid ${colors.gray700}` : 'none',
              }}
            >
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <div style={{ fontWeight: 600 }}>{loc.city}</div>
                <div style={{ fontSize: 13, color: colors.gray400 }}>{loc.state}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============ MAIN APP ============
export default function App() {
  // ============ LOADING STATE (NEW - matches Pro) ============
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // ============ UI STATE ============
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showIFTAModal, setShowIFTAModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPerDiemModal, setShowPerDiemModal] = useState(false);
  const [editingLoad, setEditingLoad] = useState(null);
  const [editingFuel, setEditingFuel] = useState(null);
  const [editingIFTA, setEditingIFTA] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editingTruck, setEditingTruck] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showFuelImport, setShowFuelImport] = useState(false);
  const [importPreview, setImportPreview] = useState(null);

  // ============ DATA STATE - Now loaded from IndexedDB ============
  const [fuelEntries, setFuelEntries] = useState([]);
  const [loads, setLoads] = useState([]);
  const [iftaData, setIftaData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [perDiemDays, setPerDiemDays] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [payPeriodStart, setPayPeriodStart] = useState("");

  // ============ SETTINGS STATE (NEW - matches Pro) ============
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Ref to track if initial load is complete
  const initialLoadComplete = useRef(false);

  // ============ TOOLS IMPORT STATE (for bb-trucking-tools integration) ============
  const [showToolsImport, setShowToolsImport] = useState(false);
  const [toolsImportData, setToolsImportData] = useState(null);
  const [toolsImportError, setToolsImportError] = useState(null);


  // ============================================
  // INDEXEDDB INITIALIZATION (NEW - matches Pro)
  // ============================================
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log(`[BalanceBooks Trucking] Initializing v${APP_VERSION}...`);
        
        // Check if migration from localStorage is needed
        if (needsMigration()) {
          console.log('[BalanceBooks Trucking] Migrating from localStorage...');
          const result = await migrateFromLocalStorage();
          if (!result.success && !result.skipped) {
            console.error('[BalanceBooks Trucking] Migration failed:', result.error);
          }
        }
        
        // Load all data from IndexedDB
        const data = await loadFromIndexedDB();
        
        // Set state with loaded data
        setLoads(data.loads || []);
        setFuelEntries(data.fuelEntries || []);
        setIftaData(data.iftaData || []);
        setExpenses(data.expenses || []);
        setPerDiemDays(data.perDiemDays || []);
        setAutoBackupEnabled(data.autoBackup ?? false);
        setLastBackupDate(data.lastBackup ?? null);
        setNotificationsEnabled(data.notifications ?? false);
        
        // Load drivers and trucks (v2.0 feature) - now included in loadFromIndexedDB
        setDrivers(data.drivers || []);
        setTrucks(data.trucks || []);
        
        console.log(`[BalanceBooks Trucking] Loaded ${data.loads?.length || 0} loads, ${data.fuelEntries?.length || 0} fuel entries, ${data.drivers?.length || 0} drivers, ${data.trucks?.length || 0} trucks`);
        
        setTimeout(() => {
          initialLoadComplete.current = true;
        }, 100);
        
        setIsLoading(false);
      } catch (error) {
        console.error('[BalanceBooks Trucking] Initialization error:', error);
        setLoadError(error.message);
        setIsLoading(false);
      }
    };
    
    initializeApp();
  }, []);

  // ============================================
  // INDEXEDDB SAVE OPERATIONS (NEW - matches Pro)
  // ============================================
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    loadsDB.replaceAll(loads).catch(err => 
      console.error('[IndexedDB] Failed to save loads:', err)
    );
  }, [loads]);
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    fuelDB.replaceAll(fuelEntries).catch(err => 
      console.error('[IndexedDB] Failed to save fuel:', err)
    );
  }, [fuelEntries]);
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    iftaDB.replaceAll(iftaData).catch(err => 
      console.error('[IndexedDB] Failed to save IFTA:', err)
    );
  }, [iftaData]);
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    expensesDB.replaceAll(expenses).catch(err => 
      console.error('[IndexedDB] Failed to save expenses:', err)
    );
  }, [expenses]);
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    perdiemDB.replaceAll(perDiemDays).catch(err => 
      console.error('[IndexedDB] Failed to save per diem:', err)
    );
  }, [perDiemDays]);
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    settingsDB.set('autoBackup', autoBackupEnabled).catch(err => 
      console.error('[IndexedDB] Failed to save autoBackup:', err)
    );
  }, [autoBackupEnabled]);
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    settingsDB.set('lastBackup', lastBackupDate).catch(err => 
      console.error('[IndexedDB] Failed to save lastBackup:', err)
    );
  }, [lastBackupDate]);
  
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    settingsDB.set('notifications', notificationsEnabled).catch(err => 
      console.error('[IndexedDB] Failed to save notifications:', err)
    );
  }, [notificationsEnabled]);

  // Persist drivers to IndexedDB (v2.0)
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    driversDB.replaceAll(drivers).catch(err => 
      console.error('[IndexedDB] Failed to save drivers:', err)
    );
  }, [drivers]);

  // Persist trucks to IndexedDB (v2.0)
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    trucksDB.replaceAll(trucks).catch(err => 
      console.error('[IndexedDB] Failed to save trucks:', err)
    );
  }, [trucks]);
  // ============================================
  // AUTO-BACKUP & NOTIFICATIONS (NEW - matches Pro)
  // ============================================

  useEffect(() => {
    if (autoBackupEnabled && initialLoadComplete.current) {
      const checkBackup = () => {
        const last = lastBackupDate ? new Date(lastBackupDate) : null;
        const now = new Date();
        if (!last || (now - last) > 24 * 60 * 60 * 1000) {
          performAutoBackup();
        }
      };
      checkBackup();
      const interval = setInterval(checkBackup, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoBackupEnabled, lastBackupDate]);

  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  const performAutoBackup = useCallback(async () => {
    try {
      const data = await exportAllData();
      const backup = {
        version: APP_VERSION,
        exportDate: new Date().toISOString(),
        autoBackup: true,
        storage: 'IndexedDB',
        data
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `balancebooks-trucking-auto-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setLastBackupDate(new Date().toISOString());
    } catch (err) {
      console.error('[AutoBackup] Failed:', err);
    }
  }, []);

  // PWA Install Prompt Handler
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('PWA install prompt available');
    };
    
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      console.log('PWA installed successfully');
    };
    
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setInstallPrompt(null);
  };
  // ============================================
  // TOOLS IMPORT DETECTION (bb-trucking-tools integration)
  // Uses URL hash for cross-domain data transfer
  // ============================================
  
  useEffect(() => {
    if (isLoading) return; // Wait for app to load first
    
    const checkForToolsImport = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('import') !== 'tools') return;

      console.log('[Tools Import] Import flag detected, checking for data...');

      try {
        let data = null;
        
        // Method 1: Check URL hash for encoded data (cross-domain safe)
        const hash = window.location.hash;
        if (hash && hash.includes('data=')) {
          const encoded = hash.split('data=')[1];
          if (encoded) {
            try {
              const jsonStr = decodeURIComponent(escape(atob(encoded)));
              data = JSON.parse(jsonStr);
              console.log('[Tools Import] Data loaded from URL hash');
            } catch (decodeErr) {
              console.error('[Tools Import] Failed to decode URL data:', decodeErr);
            }
          }
        }
        
        // Method 2: Fallback to localStorage (same-domain only)
        if (!data) {
          const stored = localStorage.getItem(BB_TOOLS_STORAGE_KEY);
          if (stored) {
            data = JSON.parse(stored);
            console.log('[Tools Import] Data loaded from localStorage');
          }
        }
        
        if (!data) {
          setToolsImportError('No import data found. The data may have been too large. Try downloading CSV and importing manually.');
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }
        
        // Validate source
        const validSources = ['fuel-converter', 'ifta-calculator', 'load-calculator', 'cost-per-mile', 'per-diem', 'deadhead-calculator'];
        if (!validSources.includes(data.source)) {
          setToolsImportError('Invalid import source: ' + data.source);
          window.history.replaceState({}, '', window.location.pathname);
          return;
        }

        // Check timestamp (reject if older than 1 hour)
        if (data.timestamp) {
          const importTime = new Date(data.timestamp);
          if (new Date() - importTime > 60 * 60 * 1000) {
            setToolsImportError('Import data expired. Please export again from tools.');
            localStorage.removeItem(BB_TOOLS_STORAGE_KEY);
            window.history.replaceState({}, '', window.location.pathname);
            return;
          }
        }

        // Valid import - show confirmation modal
        console.log('[Tools Import] Valid data from:', data.source, '- Showing modal');
        setToolsImportData(data);
        setShowToolsImport(true);
        setToolsImportError(null);

        // Clean URL (remove query params and hash)
        window.history.replaceState({}, '', window.location.pathname);

      } catch (e) {
        console.error('[Tools Import] Error:', e);
        setToolsImportError('Failed to read import data: ' + e.message);
        window.history.replaceState({}, '', window.location.pathname);
      }
    };

    checkForToolsImport();
  }, [isLoading]);

  // Handle confirmed import from tools
  const handleToolsImport = useCallback(async () => {
    if (!toolsImportData) return;

    try {
      switch (toolsImportData.source) {
        case 'fuel-converter':
          // Convert tools format to app format
          const newFuelEntries = toolsImportData.data.map(row => ({
            id: uid(),
            date: row.date || new Date().toISOString().split('T')[0],
            location: row.location || row.truckStop || '',
            state: row.state || '',
            gallons: row.gallons || 0,
            pricePerGallon: row.pricePerGallon || 0,
            odometer: parseInt(row.odometer) || 0
          }));
          
          setFuelEntries(prev => [...prev, ...newFuelEntries]);
          setActiveTab('fuel');
          console.log('[Tools Import] Added ' + newFuelEntries.length + ' fuel entries');
          break;

        case 'ifta-calculator':
          if (toolsImportData.states && Array.isArray(toolsImportData.states)) {
            const newIftaEntries = toolsImportData.states.map(state => ({
              id: uid(),
              quarter: (toolsImportData.year || new Date().getFullYear()) + '-' + (toolsImportData.quarter || 'Q1'),
              state: state.state || state.abbr,
              miles: state.miles || 0,
              gallons: state.gallons || 0,
              taxRate: state.taxRate || IFTA_RATES[state.state] || 0
            }));
            
            setIftaData(prev => [...prev, ...newIftaEntries]);
            setActiveTab('ifta');
            console.log('[Tools Import] Added ' + newIftaEntries.length + ' IFTA entries');
          }
          break;

        case 'load-calculator':
          if (toolsImportData.load) {
            const newLoad = {
              id: uid(),
              date: new Date().toISOString().split('T')[0],
              loadNumber: 'CALC-' + Date.now().toString(36).toUpperCase(),
              rate: toolsImportData.load.lineHaul || 0,
              loadedMiles: toolsImportData.load.loadedMiles || 0,
              deadheadMiles: toolsImportData.load.deadheadMiles || 0,
              fuelCost: toolsImportData.load.fuelCost || 0,
              otherExpenses: toolsImportData.load.dispatchFee || 0,
              stops: [
                { location: 'Origin (from calculator)', type: 'pickup' },
                { location: 'Destination (from calculator)', type: 'delivery' }
              ],
              notes: 'Imported from Load Calculator. Verdict: ' + (toolsImportData.load.verdict || 'N/A')
            };
            
            setLoads(prev => [...prev, newLoad]);
            setActiveTab('loads');
          }
          break;

        case 'per-diem':
          if (toolsImportData.days) {
            const newPerDiem = {
              id: uid(),
              startDate: toolsImportData.startDate || new Date().toISOString().split('T')[0],
              endDate: toolsImportData.endDate || new Date().toISOString().split('T')[0],
              days: toolsImportData.days,
              rate: toolsImportData.rate || 80,
              total: toolsImportData.days * (toolsImportData.rate || 80)
            };
            
            setPerDiemDays(prev => [...prev, newPerDiem]);
            setActiveTab('perdiem');
          }
          break;

        default:
          console.warn('[Tools Import] Unknown source:', toolsImportData.source);
      }

      // Clear and close
      localStorage.removeItem(BB_TOOLS_STORAGE_KEY);
      setShowToolsImport(false);
      setToolsImportData(null);

    } catch (e) {
      console.error('[Tools Import] Failed:', e);
      setToolsImportError('Import failed: ' + e.message);
    }
  }, [toolsImportData]);

  // Cancel tools import
  const cancelToolsImport = useCallback(() => {
    localStorage.removeItem(BB_TOOLS_STORAGE_KEY);
    setShowToolsImport(false);
    setToolsImportData(null);
    setToolsImportError(null);
  }, []);


  // ============ CALCULATIONS ============
  const stats = useMemo(() => {
    const totalRevenue = loads.reduce((s, l) => s + (l.rate || 0), 0);
    const totalFuelCost = fuelEntries.reduce((s, f) => s + (f.gallons * f.pricePerGallon), 0);
    const totalMiles = loads.reduce((s, l) => s + (l.loadedMiles || 0), 0);
    const totalDeadheadMiles = loads.reduce((s, l) => s + (l.deadheadMiles || 0), 0);
    const totalAllMiles = totalMiles + totalDeadheadMiles;
    const totalGallons = fuelEntries.reduce((s, f) => s + f.gallons, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0) + totalFuelCost;
    const profit = totalRevenue - totalExpenses;
    const revenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;
    const costPerMile = totalAllMiles > 0 ? totalExpenses / totalAllMiles : 0;
    const profitPerMile = totalMiles > 0 ? profit / totalMiles : 0;
    const fleetMPG = totalGallons > 0 ? totalAllMiles / totalGallons : 0;
    const deadheadPercentage = totalAllMiles > 0 ? (totalDeadheadMiles / totalAllMiles) * 100 : 0;
    
    return {
      totalRevenue,
      totalFuelCost,
      totalMiles,
      totalDeadheadMiles,
      totalAllMiles,
      totalGallons,
      totalExpenses,
      profit,
      revenuePerMile,
      costPerMile,
      profitPerMile,
      fleetMPG,
      deadheadPercentage,
      loadCount: loads.length,
    };
  }, [loads, fuelEntries, expenses]);

  // IFTA Calculations - AUTO-CALCULATE from fuel entries - aggregate gallons by state
  const fuelByState = useMemo(() => {
    const byState = {};
    fuelEntries.forEach(f => {
      if (f.state) {
        if (!byState[f.state]) {
          byState[f.state] = { gallons: 0, cost: 0 };
        }
        byState[f.state].gallons += f.gallons || 0;
        byState[f.state].cost += (f.gallons || 0) * (f.pricePerGallon || 0);
      }
    });
    return byState;
  }, [fuelEntries]);

  // Combine manual IFTA entries with auto-calculated fuel data
  const iftaSummary = useMemo(() => {
    const avgMPG = stats.fleetMPG || 6.5;
    const statesWithData = new Set([
      ...Object.keys(fuelByState),
      ...iftaData.map(d => d.state)
    ]);
    
    return Array.from(statesWithData).map(state => {
      const manual = iftaData.find(d => d.state === state);
      const autoFuel = fuelByState[state] || { gallons: 0, cost: 0 };
      
      // Use manual miles if entered, otherwise 0
      const miles = manual?.miles || 0;
      // Use auto-calculated gallons from fuel log, or manual override
      const gallons = autoFuel.gallons > 0 ? autoFuel.gallons : (manual?.gallons || 0);
      const taxRate = IFTA_RATES[state] || 0;
      
      const gallonsUsed = miles / avgMPG;
      const taxOwed = gallonsUsed * taxRate;
      const taxPaid = gallons * taxRate;
      
      return {
        id: manual?.id || `auto-${state}`,
        state,
        miles,
        gallons,
        taxRate,
        gallonsUsed,
        taxOwed,
        taxPaid,
        netTax: taxOwed - taxPaid,
        isAuto: !manual && autoFuel.gallons > 0,
      };
    }).filter(d => d.gallons > 0 || d.miles > 0).sort((a, b) => a.state.localeCompare(b.state));
  }, [iftaData, fuelByState, stats.fleetMPG]);

  // IFTA totals
  const iftaTotals = useMemo(() => ({
    totalNetTax: iftaSummary.reduce((s, d) => s + d.netTax, 0),
    totalMiles: iftaSummary.reduce((s, d) => s + d.miles, 0),
    totalGallons: iftaSummary.reduce((s, d) => s + d.gallons, 0),
  }), [iftaSummary]);

  // ============ NAV ITEMS ============
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'loads', label: 'Loads', icon: '🚛' },
    { id: 'fuel', label: 'Fuel Log', icon: '⛽' },
    { id: 'drivers', label: 'Drivers', icon: '👤' },
    { id: 'driverpay', label: 'Driver Pay', icon: '💵' },
    { id: 'trucks', label: 'Trucks', icon: '🚚' },
    { id: 'ifta', label: 'IFTA', icon: '📋' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'perdiem', label: 'Per Diem', icon: '📅' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];
  
  // Multi-select hooks
  const loadsSelect = useMultiSelect(loads);
  const fuelSelect = useMultiSelect(fuelEntries);
  const expensesSelect = useMultiSelect(expenses);
  const driversSelect = useMultiSelect(drivers);
  const trucksSelect = useMultiSelect(trucks);

  // ============ LOAD MODAL ============
  const LoadModal = () => {
    const defaultForm = {
      date: new Date().toISOString().split('T')[0],
      loadNumber: '',
      broker: '',
      rate: '',
      driverId: '',
      stops: [
        { type: 'origin', location: '', city: '', state: '', lat: null, lng: null },
        { type: 'destination', location: '', city: '', state: '', lat: null, lng: null },
      ],
      loadedMiles: '',
      manualMiles: false,
      deadheadMiles: '',
      deadheadOrigin: '',
      deadheadOriginLat: null,
      deadheadOriginLng: null,
      fuelCost: '',
      otherExpenses: '',
      notes: '',
    };
    
    const [form, setForm] = useState(() => {
      if (editingLoad) {
        // Merge editingLoad with defaults to ensure all fields exist
        return {
          ...defaultForm,
          ...editingLoad,
          // Ensure stops array exists and has proper structure
          stops: editingLoad.stops?.length >= 2 ? editingLoad.stops : defaultForm.stops,
        };
      }
      return defaultForm;
    });
    
    // Update form when editingLoad changes (for edit mode)
    useEffect(() => {
      if (editingLoad) {
        setForm({
          ...defaultForm,
          ...editingLoad,
          stops: editingLoad.stops?.length >= 2 ? editingLoad.stops : defaultForm.stops,
        });
      } else {
        setForm(defaultForm);
      }
    }, [editingLoad?.id]);

    const handleStopChange = (index, field, value, locationData = null) => {
      const newStops = [...form.stops];
      newStops[index] = { ...newStops[index], [field]: value };
      if (locationData) {
        newStops[index].city = locationData.city;
        newStops[index].state = locationData.state;
        newStops[index].lat = locationData.lat;
        newStops[index].lng = locationData.lng;
      }
      setForm({ ...form, stops: newStops });
      
      // Auto-calculate loaded miles when stops have coordinates (only if not manual)
      if (!form.manualMiles && newStops.every(s => s.lat && s.lng)) {
        const calculatedMiles = calculateRouteDistance(newStops);
        if (calculatedMiles > 0) {
          setForm(prev => ({ ...prev, stops: newStops, loadedMiles: calculatedMiles }));
        }
      }
    };

    const addStop = () => {
      const newStops = [...form.stops];
      newStops.splice(newStops.length - 1, 0, { 
        type: 'stop', 
        location: '', 
        city: '', 
        state: '', 
        lat: null, 
        lng: null 
      });
      setForm({ ...form, stops: newStops });
    };

    const removeStop = (index) => {
      if (form.stops.length <= 2) return;
      const newStops = form.stops.filter((_, i) => i !== index);
      setForm({ ...form, stops: newStops });
      
      // Recalculate miles if not manual
      if (!form.manualMiles && newStops.every(s => s.lat && s.lng)) {
        const calculatedMiles = calculateRouteDistance(newStops);
        setForm(prev => ({ ...prev, stops: newStops, loadedMiles: calculatedMiles }));
      }
    };

    const handleDeadheadOriginSelect = (loc) => {
      // Calculate deadhead miles from deadhead origin to first stop
      if (form.stops[0]?.lat && form.stops[0]?.lng && loc.lat && loc.lng) {
        const deadheadMiles = calculateDistance(loc.lat, loc.lng, form.stops[0].lat, form.stops[0].lng);
        setForm(prev => ({ 
          ...prev, 
          deadheadOriginLat: loc.lat,
          deadheadOriginLng: loc.lng,
          deadheadMiles 
        }));
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      const loadData = {
        ...form,
        id: editingLoad?.id || uid(),
        rate: parseFloat(form.rate) || 0,
        loadedMiles: parseInt(form.loadedMiles) || 0,
        deadheadMiles: parseInt(form.deadheadMiles) || 0,
        fuelCost: parseFloat(form.fuelCost) || 0,
        otherExpenses: parseFloat(form.otherExpenses) || 0,
      };
      
      if (editingLoad) {
        setLoads(loads.map(l => l.id === editingLoad.id ? loadData : l));
      } else {
        setLoads([...loads, loadData]);
      }
      
      setShowLoadModal(false);
      setEditingLoad(null);
    };

    return (
      <div style={styles.modal} onClick={() => { setShowLoadModal(false); setEditingLoad(null); }}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 40, fontSize: 32 }}>
            {editingLoad ? '✏️ Edit Load' : '🚛 Add New Load'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Load # / Reference</label>
                <input type="text" value={form.loadNumber} onChange={e => setForm({...form, loadNumber: e.target.value})} placeholder="e.g., LD-12345" style={styles.input} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Broker / Customer</label>
                <input type="text" value={form.broker} onChange={e => setForm({...form, broker: e.target.value})} placeholder="e.g., C.H. Robinson" style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Driver</label>
                <select style={styles.select} value={form.driverId || ''} onChange={e => setForm({...form, driverId: e.target.value})}>
                  <option value="">Select Driver</option>
                  {(drivers || []).filter(d => d && d.status === 'active').map(driver => (
                    <option key={driver.id} value={driver.id}>{driver.firstName || ''} {driver.lastName || ''}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Rate ($)</label>
                <input type="number" step="0.01" value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} placeholder="0.00" style={styles.input} required />
              </div>
            </div>

            {/* Route Stops */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <label style={{ ...styles.label, marginBottom: 0 }}>
                  🗺️ Route Stops ({form.stops.length} stops)
                </label>
                <button type="button" onClick={addStop} style={{ ...styles.btn('secondary'), padding: '8px 16px' }}>
                  ➕ Add Stop
                </button>
              </div>
              
              <div style={{ 
                background: colors.navyDark, 
                borderRadius: 16, 
                padding: 20,
                border: `1px solid ${colors.gray700}` 
              }}>
                {form.stops.map((stop, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 16, 
                    marginBottom: index < form.stops.length - 1 ? 16 : 0,
                    paddingBottom: index < form.stops.length - 1 ? 16 : 0,
                    borderBottom: index < form.stops.length - 1 ? `1px dashed ${colors.gray700}` : 'none',
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: index === 0 ? colors.green : index === form.stops.length - 1 ? colors.red : colors.orange,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.white,
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                    }}>
                      {index === 0 ? 'A' : index === form.stops.length - 1 ? 'Z' : index}
                    </div>
                    <div style={{ flex: 1 }}>
                      <LocationAutocomplete
                        value={stop.location}
                        onChange={(val) => handleStopChange(index, 'location', val)}
                        onSelect={(loc) => handleStopChange(index, 'location', `${loc.city}, ${loc.state}`, loc)}
                        placeholder={index === 0 ? 'Origin (Start typing city...)' : index === form.stops.length - 1 ? 'Destination' : `Stop ${index}`}
                      />
                    </div>
                    {form.stops.length > 2 && index !== 0 && index !== form.stops.length - 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeStop(index)}
                        style={{ ...styles.btn('danger'), padding: '8px 12px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Route Summary */}
              {form.loadedMiles > 0 && (
                <div style={{ 
                  marginTop: 16, 
                  padding: '12px 16px', 
                  background: `${colors.teal}20`, 
                  borderRadius: 10,
                  border: `1px solid ${colors.teal}40`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 20 }}>📍</span>
                  <span style={{ color: colors.white }}>
                    {form.manualMiles ? 'Manual' : 'Estimated'} Route Distance: <strong>{formatNumber(form.loadedMiles)} miles</strong>
                  </span>
                </div>
              )}
              
              {/* Rate Summary - Shows Flat Rate and Rate Per Mile */}
              {form.rate > 0 && form.loadedMiles > 0 && (
                <div style={{ 
                  marginTop: 16, 
                  padding: 20, 
                  background: `${colors.green}15`, 
                  borderRadius: 12,
                  border: `1px solid ${colors.green}30`,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, textAlign: 'center' }}>
                    <div>
                      <div style={{ color: colors.gray400, fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>Flat Rate</div>
                      <div style={{ color: colors.green, fontSize: 24, fontWeight: 800 }}>{formatCurrency(parseFloat(form.rate) || 0)}</div>
                    </div>
                    <div>
                      <div style={{ color: colors.gray400, fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>Rate/Loaded Mile</div>
                      <div style={{ color: colors.teal, fontSize: 24, fontWeight: 800 }}>
                        {formatCentsPerMile((parseFloat(form.rate) || 0) / (parseInt(form.loadedMiles) || 1))}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: colors.gray400, fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
                        {parseInt(form.deadheadMiles) > 0 ? 'Rate/All Miles' : 'Deadhead'}
                      </div>
                      {parseInt(form.deadheadMiles) > 0 ? (
                        <div style={{ color: colors.orange, fontSize: 24, fontWeight: 800 }}>
                          {formatCentsPerMile((parseFloat(form.rate) || 0) / ((parseInt(form.loadedMiles) || 0) + (parseInt(form.deadheadMiles) || 0)))}
                        </div>
                      ) : (
                        <div style={{ color: colors.gray500, fontSize: 16, fontWeight: 600 }}>Add below ↓</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Deadhead Section */}
            <div style={{ 
              background: `${colors.red}15`, 
              borderRadius: 16, 
              padding: 24, 
              marginBottom: 28,
              border: `1px solid ${colors.red}30`,
            }}>
              <label style={{ ...styles.label, color: colors.red, marginBottom: 16 }}>
                🔄 Deadhead Miles (Empty Miles to Pickup)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ ...styles.label, fontSize: 13 }}>Coming From (Last Drop Location)</label>
                  <LocationAutocomplete
                    value={form.deadheadOrigin}
                    onChange={(val) => setForm({...form, deadheadOrigin: val})}
                    onSelect={handleDeadheadOriginSelect}
                    placeholder="Where did you drop last?"
                  />
                </div>
                <div>
                  <label style={{ ...styles.label, fontSize: 13 }}>Deadhead Miles</label>
                  <input 
                    type="number" 
                    value={form.deadheadMiles} 
                    onChange={e => setForm({...form, deadheadMiles: e.target.value})} 
                    placeholder="0" 
                    style={styles.input} 
                  />
                </div>
              </div>
              {form.deadheadMiles > 0 && form.loadedMiles > 0 && form.rate > 0 && (
                <div style={{ marginTop: 16, color: colors.gray300, fontSize: 14 }}>
                  <span style={{ color: colors.gray400 }}>Effective Rate Per Mile (incl. deadhead):</span>
                  <span style={{ color: colors.orange, fontWeight: 700, marginLeft: 8 }}>
                    {formatCurrency(parseFloat(form.rate) / ((parseInt(form.loadedMiles) || 0) + (parseInt(form.deadheadMiles) || 0)))}
                  </span>
                </div>
              )}
            </div>

            {/* Miles Section with Manual Override */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ ...styles.label, marginBottom: 0 }}>Loaded Miles</label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    cursor: 'pointer',
                    fontSize: 13,
                    color: form.manualMiles ? colors.orange : colors.gray400,
                  }}>
                    <input 
                      type="checkbox" 
                      checked={form.manualMiles} 
                      onChange={(e) => setForm({...form, manualMiles: e.target.checked})}
                      style={styles.checkbox}
                    />
                    Manual Entry
                  </label>
                </div>
                <input 
                  type="number" 
                  value={form.loadedMiles} 
                  onChange={e => setForm({...form, loadedMiles: e.target.value})} 
                  placeholder="0" 
                  style={{
                    ...styles.input,
                    background: form.manualMiles ? colors.gray800 : colors.gray700,
                  }}
                  readOnly={!form.manualMiles}
                />
                {!form.manualMiles && (
                  <p style={{ fontSize: 12, color: colors.gray500, marginTop: 8 }}>
                    💡 Auto-calculated from stops. Check "Manual Entry" to override.
                  </p>
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Additional Expenses ($)</label>
                <input type="number" step="0.01" value={form.otherExpenses} onChange={e => setForm({...form, otherExpenses: e.target.value})} placeholder="Tolls, lumper, etc." style={styles.input} />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any additional notes..." style={{ ...styles.input, minHeight: 100, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 32 }}>
              <button type="button" onClick={() => { setShowLoadModal(false); setEditingLoad(null); }} style={styles.btn('secondary')}>
                Cancel
              </button>
              <button type="submit" style={styles.btn('primary')}>
                {editingLoad ? '💾 Update Load' : '➕ Add Load'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ FUEL MODAL ============
  const FuelModal = () => {
    const [form, setForm] = useState(editingFuel || {
      date: new Date().toISOString().split('T')[0],
      location: '',
      state: '',
      gallons: '',
      pricePerGallon: '',
      odometer: '',
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const fuelData = {
        ...form,
        id: editingFuel?.id || uid(),
        gallons: parseFloat(form.gallons) || 0,
        pricePerGallon: parseFloat(form.pricePerGallon) || 0,
        odometer: parseInt(form.odometer) || 0,
      };
      
      if (editingFuel) {
        setFuelEntries(fuelEntries.map(f => f.id === editingFuel.id ? fuelData : f));
      } else {
        setFuelEntries([...fuelEntries, fuelData]);
      }
      
      setShowFuelModal(false);
      setEditingFuel(null);
    };

    return (
      <div style={styles.modal} onClick={() => { setShowFuelModal(false); setEditingFuel(null); }}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 40, fontSize: 32 }}>
            {editingFuel ? '✏️ Edit Fuel Entry' : '⛽ Add Fuel Purchase'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>State</label>
                <select value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={styles.select} required>
                  <option value="">Select State...</option>
                  {Object.entries(STATE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Location / Truck Stop</label>
              <LocationAutocomplete
                value={form.location}
                onChange={(val) => setForm({...form, location: val})}
                onSelect={(loc) => setForm({...form, location: `${loc.city}, ${loc.state}`, state: loc.state})}
                placeholder="e.g., Pilot Flying J, Dallas"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Gallons</label>
                <input type="number" step="0.01" value={form.gallons} onChange={e => setForm({...form, gallons: e.target.value})} placeholder="0.00" style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Price/Gallon ($)</label>
                <input type="number" step="0.001" value={form.pricePerGallon} onChange={e => setForm({...form, pricePerGallon: e.target.value})} placeholder="0.000" style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Odometer</label>
                <input type="number" value={form.odometer} onChange={e => setForm({...form, odometer: e.target.value})} placeholder="Optional" style={styles.input} />
              </div>
            </div>

            {form.gallons && form.pricePerGallon && (
              <div style={{ 
                background: colors.navyDark, 
                padding: 20, 
                borderRadius: 12, 
                marginBottom: 28,
                textAlign: 'center',
              }}>
                <span style={{ color: colors.gray400 }}>Total Cost: </span>
                <span style={{ color: colors.green, fontSize: 24, fontWeight: 800 }}>
                  {formatCurrency(parseFloat(form.gallons) * parseFloat(form.pricePerGallon))}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowFuelModal(false); setEditingFuel(null); }} style={styles.btn('secondary')}>
                Cancel
              </button>
              <button type="submit" style={styles.btn('primary')}>
                {editingFuel ? '💾 Update' : '➕ Add Fuel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ FUEL IMPORT MODAL ============
  const FuelImportModal = () => {
    const handleFileSelect = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      
      if (lines.length < 2) {
        alert('CSV file appears to be empty');
        return;
      }
      
      // Parse header to detect columns
      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Try to detect column indices
      const dateCol = headers.findIndex(h => h.includes('date') || h.includes('time'));
      const stateCol = headers.findIndex(h => h.includes('state') || h.includes('st'));
      const gallonsCol = headers.findIndex(h => h.includes('gallon') || h.includes('qty') || h.includes('quantity'));
      const priceCol = headers.findIndex(h => h.includes('price') || h.includes('ppg') || h.includes('rate') || h.includes('$/gal'));
      const totalCol = headers.findIndex(h => h.includes('total') || h.includes('amount') || h.includes('cost'));
      const locationCol = headers.findIndex(h => h.includes('location') || h.includes('city') || h.includes('stop') || h.includes('vendor'));
      
      console.log('Detected columns:', { dateCol, stateCol, gallonsCol, priceCol, totalCol, locationCol });
      
      const entries = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Parse CSV line handling quoted values
        const parts = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim().replace(/"/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim().replace(/"/g, ''));
        
        try {
          // Extract values
          let date = dateCol >= 0 ? parts[dateCol] : '';
          let state = stateCol >= 0 ? parts[stateCol] : '';
          let gallons = gallonsCol >= 0 ? parseFloat(parts[gallonsCol]?.replace(/[^0-9.-]/g, '')) : 0;
          let price = priceCol >= 0 ? parseFloat(parts[priceCol]?.replace(/[^0-9.-]/g, '')) : 0;
          let total = totalCol >= 0 ? parseFloat(parts[totalCol]?.replace(/[^0-9.-]/g, '')) : 0;
          let location = locationCol >= 0 ? parts[locationCol] : '';
          
          // Parse date - try various formats
          if (date) {
            const dateMatch = date.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
            if (dateMatch) {
              const [, m, d, y] = dateMatch;
              const year = y.length === 2 ? '20' + y : y;
              date = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
          }
          
          // Normalize state code (handle full names)
          if (state && state.length > 2) {
            const stateEntry = Object.entries(STATE_NAMES).find(([code, name]) => 
              name.toLowerCase() === state.toLowerCase()
            );
            if (stateEntry) state = stateEntry[0];
          }
          state = state.toUpperCase();
          
          // Calculate missing values
          if (!price && gallons && total) {
            price = total / gallons;
          }
          if (!total && gallons && price) {
            total = gallons * price;
          }
          
          if (gallons > 0 && state) {
            entries.push({
              id: uid(),
              date: date || new Date().toISOString().split('T')[0],
              state,
              gallons,
              pricePerGallon: price || 0,
              location: location || '',
              odometer: 0,
            });
          } else {
            errors.push(`Row ${i + 1}: Missing gallons or state`);
          }
        } catch (err) {
          errors.push(`Row ${i + 1}: Parse error`);
        }
      }
      
      if (entries.length > 0) {
        setImportPreview({ entries, errors, filename: file.name });
      } else {
        alert('No valid fuel entries found in CSV.\n\nExpected columns: Date, State, Gallons, Price/Gallon (or Total)\n\nErrors:\n' + errors.slice(0, 5).join('\n'));
      }
      
      e.target.value = '';
    };
    
    const confirmImport = () => {
      if (importPreview?.entries) {
        setFuelEntries([...fuelEntries, ...importPreview.entries]);
        setImportPreview(null);
        setShowFuelImport(false);
      }
    };
    
    return (
      <div style={styles.modal} onClick={() => { setShowFuelImport(false); setImportPreview(null); }}>
        <div style={{ ...styles.modalContent, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 24, fontSize: 28 }}>
            📥 Import Fuel Card Data
          </h2>
          
          {!importPreview ? (
            <>
              <div style={{ 
                background: `linear-gradient(135deg, ${colors.orange}20, ${colors.yellow}20)`,
                border: `2px dashed ${colors.orange}`,
                borderRadius: 16,
                padding: 40,
                textAlign: 'center',
                marginBottom: 24,
                cursor: 'pointer',
              }}>
                <input 
                  type="file" 
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="fuel-csv-input"
                />
                <label htmlFor="fuel-csv-input" style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                  <div style={{ color: colors.white, fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                    Drop CSV file here or click to browse
                  </div>
                  <div style={{ color: colors.gray400, fontSize: 14 }}>
                    Supports: Love's, Pilot, Comdata, EFS, WEX formats
                  </div>
                </label>
              </div>
              
              <div style={{ background: colors.navyDark, borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ color: colors.gray300, fontSize: 14, marginBottom: 12 }}>
                  <strong style={{ color: colors.teal }}>Expected CSV columns:</strong>
                </div>
                <div style={{ color: colors.gray400, fontSize: 13, lineHeight: 1.8 }}>
                  • <strong>Date</strong> - Transaction date (MM/DD/YYYY)<br/>
                  • <strong>State</strong> - State code (TX, CA, etc.)<br/>
                  • <strong>Gallons</strong> - Fuel quantity<br/>
                  • <strong>Price/Gallon</strong> or <strong>Total</strong> - Cost info<br/>
                  • <strong>Location</strong> (optional) - Truck stop name
                </div>
              </div>
              
              <div style={{ 
                background: `${colors.teal}20`, 
                border: `1px solid ${colors.teal}40`,
                borderRadius: 12, 
                padding: 16,
                marginBottom: 24
              }}>
                <div style={{ color: colors.teal, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  💡 Get your fuel card CSV
                </div>
                <div style={{ color: colors.gray400, fontSize: 13 }}>
                  Use the <strong>Fuel Card Converter</strong> tools at trucking.balancebooksapp.com to convert your fuel card statements to the correct format.
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ 
                background: `${colors.green}20`,
                border: `2px solid ${colors.green}`,
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 32 }}>✅</span>
                  <div>
                    <div style={{ color: colors.green, fontWeight: 700, fontSize: 18 }}>
                      {importPreview.entries.length} fuel entries ready to import
                    </div>
                    <div style={{ color: colors.gray400, fontSize: 13 }}>
                      From: {importPreview.filename}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div style={{ background: colors.navyDark, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ color: colors.orange, fontSize: 24, fontWeight: 700 }}>
                      {formatNumber(importPreview.entries.reduce((s, e) => s + e.gallons, 0), 1)}
                    </div>
                    <div style={{ color: colors.gray500, fontSize: 12 }}>Total Gallons</div>
                  </div>
                  <div style={{ background: colors.navyDark, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                    <div style={{ color: colors.red, fontSize: 24, fontWeight: 700 }}>
                      {formatCurrency(importPreview.entries.reduce((s, e) => s + (e.gallons * e.pricePerGallon), 0))}
                    </div>
                    <div style={{ color: colors.gray500, fontSize: 12 }}>Total Cost</div>
                  </div>
                </div>
              </div>
              
              {/* Preview table */}
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 24 }}>
                <table style={{ ...styles.table, fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>State</th>
                      <th style={styles.th}>Gallons</th>
                      <th style={styles.th}>Price</th>
                      <th style={styles.th}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.entries.slice(0, 10).map((entry, i) => (
                      <tr key={i}>
                        <td style={styles.td}>{entry.date}</td>
                        <td style={styles.td}>{entry.state}</td>
                        <td style={styles.td}>{formatNumber(entry.gallons, 2)}</td>
                        <td style={styles.td}>{formatCurrency(entry.pricePerGallon)}</td>
                        <td style={styles.td}>{formatCurrency(entry.gallons * entry.pricePerGallon)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreview.entries.length > 10 && (
                  <div style={{ textAlign: 'center', color: colors.gray500, padding: 12, fontSize: 13 }}>
                    ... and {importPreview.entries.length - 10} more entries
                  </div>
                )}
              </div>
              
              {importPreview.errors.length > 0 && (
                <div style={{ 
                  background: `${colors.yellow}20`,
                  border: `1px solid ${colors.yellow}`,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 24,
                  fontSize: 13,
                  color: colors.yellow,
                }}>
                  ⚠️ {importPreview.errors.length} rows skipped due to errors
                </div>
              )}
            </>
          )}
          
          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <button 
              onClick={() => { setShowFuelImport(false); setImportPreview(null); }} 
              style={styles.btn('secondary')}
            >
              Cancel
            </button>
            {importPreview && (
              <button onClick={confirmImport} style={styles.btn('primary')}>
                ✅ Import {importPreview.entries.length} Entries
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============ IFTA MODAL ============
  const IFTAModal = () => {
    const [form, setForm] = useState(editingIFTA || {
      quarter: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
      state: '',
      miles: '',
      gallons: '',
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const iftaEntry = {
        ...form,
        id: editingIFTA?.id || uid(),
        miles: parseInt(form.miles) || 0,
        gallons: parseFloat(form.gallons) || 0,
        taxRate: IFTA_RATES[form.state] || 0,
      };
      
      // Check if we're editing an existing entry (has id) or adding new
      const existingEntry = iftaData.find(d => d.id === editingIFTA?.id);
      // Also check if there's already an entry for this state (for merging)
      const existingStateEntry = iftaData.find(d => d.state === form.state);
      
      if (existingEntry) {
        // Update existing entry
        setIftaData(iftaData.map(d => d.id === existingEntry.id ? iftaEntry : d));
      } else if (existingStateEntry) {
        // Update existing state entry (merge)
        setIftaData(iftaData.map(d => d.state === form.state ? { ...iftaEntry, id: d.id } : d));
      } else {
        // Add new entry
        setIftaData([...iftaData, iftaEntry]);
      }
      
      setShowIFTAModal(false);
      setEditingIFTA(null);
    };

    return (
      <div style={styles.modal} onClick={() => { setShowIFTAModal(false); setEditingIFTA(null); }}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 40, fontSize: 32 }}>
            {editingIFTA ? '✏️ Edit IFTA Entry' : '📋 Add IFTA Entry'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Quarter</label>
                <input type="text" value={form.quarter} onChange={e => setForm({...form, quarter: e.target.value})} placeholder="2025-Q1" style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>State</label>
                <select value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={styles.select} required>
                  <option value="">Select State...</option>
                  {Object.entries(STATE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Miles Driven in State</label>
                <input type="number" value={form.miles} onChange={e => setForm({...form, miles: e.target.value})} placeholder="0" style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Gallons Purchased in State</label>
                <input type="number" step="0.01" value={form.gallons} onChange={e => setForm({...form, gallons: e.target.value})} placeholder="0.00" style={styles.input} required />
              </div>
            </div>

            {form.state && (
              <div style={{ 
                background: colors.navyDark, 
                padding: 20, 
                borderRadius: 12, 
                marginBottom: 28,
              }}>
                <div style={{ color: colors.gray400, marginBottom: 8 }}>{STATE_NAMES[form.state]} Tax Rate</div>
                <div style={{ color: colors.orange, fontSize: 24, fontWeight: 800 }}>
                  ${(IFTA_RATES[form.state] || 0).toFixed(3)} / gallon
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowIFTAModal(false); setEditingIFTA(null); }} style={styles.btn('secondary')}>
                Cancel
              </button>
              <button type="submit" style={styles.btn('primary')}>
                {editingIFTA ? '💾 Update' : '➕ Add Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ EXPENSE MODAL ============
  const ExpenseModal = () => {
    const [form, setForm] = useState(editingExpense || {
      date: new Date().toISOString().split('T')[0],
      category: 'maintenance',
      description: '',
      amount: '',
    });

    const categories = [
      { id: 'maintenance', name: '🔧 Maintenance & Repairs' },
      { id: 'insurance', name: '🛡️ Insurance' },
      { id: 'permits', name: '📄 Permits & Licenses' },
      { id: 'tolls', name: '🛣️ Tolls' },
      { id: 'parking', name: '🅿️ Parking' },
      { id: 'equipment', name: '🔩 Equipment' },
      { id: 'communication', name: '📱 Communication' },
      { id: 'other', name: '📦 Other' },
    ];

    const handleSubmit = (e) => {
      e.preventDefault();
      const expenseData = {
        ...form,
        id: editingExpense?.id || uid(),
        amount: parseFloat(form.amount) || 0,
      };
      
      if (editingExpense) {
        setExpenses(expenses.map(ex => ex.id === editingExpense.id ? expenseData : ex));
      } else {
        setExpenses([...expenses, expenseData]);
      }
      
      setShowExpenseModal(false);
      setEditingExpense(null);
    };

    return (
      <div style={styles.modal} onClick={() => { setShowExpenseModal(false); setEditingExpense(null); }}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 40, fontSize: 32 }}>
            {editingExpense ? '✏️ Edit Expense' : '💰 Add Expense'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={styles.select} required>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="e.g., Oil change, Tire rotation" style={styles.input} required />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Amount ($)</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" style={styles.input} required />
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowExpenseModal(false); setEditingExpense(null); }} style={styles.btn('secondary')}>
                Cancel
              </button>
              <button type="submit" style={styles.btn('primary')}>
                {editingExpense ? '💾 Update' : '➕ Add Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ PER DIEM MODAL ============
  const PerDiemModal = () => {
    const [form, setForm] = useState({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      const perDiemEntry = {
        id: uid(),
        startDate: form.startDate,
        endDate: form.endDate,
        days: days,
        rate: 80, // 2024 IRS per diem rate for transportation industry
        total: days * 80,
      };
      
      setPerDiemDays([...perDiemDays, perDiemEntry]);
      setShowPerDiemModal(false);
    };

    return (
      <div style={styles.modal} onClick={() => setShowPerDiemModal(false)}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 40, fontSize: 32 }}>📅 Add Per Diem Days</h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} style={styles.input} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} style={styles.input} required />
              </div>
            </div>

            <div style={{ 
              background: colors.navyDark, 
              padding: 24, 
              borderRadius: 12, 
              marginBottom: 28,
              textAlign: 'center',
            }}>
              <div style={{ color: colors.gray400, marginBottom: 8 }}>IRS Per Diem Rate (Transportation)</div>
              <div style={{ color: colors.green, fontSize: 32, fontWeight: 800 }}>$80 / day</div>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowPerDiemModal(false)} style={styles.btn('secondary')}>
                Cancel
              </button>
              <button type="submit" style={styles.btn('primary')}>
                ➕ Add Days
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ HELPER: Edit Load Function ============
  const openEditLoad = (load) => {
    setEditingLoad(load);
    setShowLoadModal(true);
  };

  // ============ DASHBOARD VIEW ============
  const renderDashboard = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Dashboard</h1>
        <p style={styles.pageSubtitle}>Your trucking business at a glance</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard(colors.green, true)} onClick={() => setActiveTab('loads')}>
          <div style={styles.statIcon}>💵</div>
          <div style={styles.statValue(colors.green)}>{formatCurrency(stats.profit)}</div>
          <div style={styles.statLabel}>Net Profit</div>
        </div>
        <div style={styles.statCard(colors.orange, true)} onClick={() => setActiveTab('loads')}>
          <div style={styles.statIcon}>🚛</div>
          <div style={styles.statValue(colors.orange)}>{formatNumber(stats.totalMiles)}</div>
          <div style={styles.statLabel}>Loaded Miles</div>
        </div>
        <div style={styles.statCard(colors.teal, true)} onClick={() => setActiveTab('loads')}>
          <div style={styles.statIcon}>📦</div>
          <div style={styles.statValue(colors.teal)}>{stats.loadCount}</div>
          <div style={styles.statLabel}>Total Loads</div>
        </div>
        <div style={styles.statCard(colors.yellow, true)} onClick={() => setActiveTab('loads')}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue(colors.yellow)}>{formatCentsPerMile(stats.profitPerMile)}</div>
          <div style={styles.statLabel}>Profit/Mile</div>
        </div>
      </div>

      {/* Deadhead Analysis Card */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>🔄 Deadhead Analysis</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          <div style={{ background: colors.navyDark, padding: 24, borderRadius: 16, textAlign: 'center' }}>
            <div style={{ color: colors.gray400, fontSize: 14, marginBottom: 8 }}>Deadhead Miles</div>
            <div style={{ color: colors.red, fontSize: 28, fontWeight: 800 }}>{formatNumber(stats.totalDeadheadMiles)}</div>
          </div>
          <div style={{ background: colors.navyDark, padding: 24, borderRadius: 16, textAlign: 'center' }}>
            <div style={{ color: colors.gray400, fontSize: 14, marginBottom: 8 }}>Deadhead %</div>
            <div style={{ color: stats.deadheadPercentage > 15 ? colors.red : colors.green, fontSize: 28, fontWeight: 800 }}>
              {stats.deadheadPercentage.toFixed(1)}%
            </div>
          </div>
          <div style={{ background: colors.navyDark, padding: 24, borderRadius: 16, textAlign: 'center' }}>
            <div style={{ color: colors.gray400, fontSize: 14, marginBottom: 8 }}>All Miles RPM</div>
            <div style={{ color: colors.orange, fontSize: 28, fontWeight: 800 }}>
              {formatCurrency(stats.totalAllMiles > 0 ? stats.totalRevenue / stats.totalAllMiles : 0)}
            </div>
          </div>
          <div style={{ background: colors.navyDark, padding: 24, borderRadius: 16, textAlign: 'center' }}>
            <div style={{ color: colors.gray400, fontSize: 14, marginBottom: 8 }}>Fleet MPG</div>
            <div style={{ color: colors.teal, fontSize: 28, fontWeight: 800 }}>{stats.fleetMPG.toFixed(2)}</div>
          </div>
        </div>
        {stats.deadheadPercentage > 15 && (
          <div style={{ 
            background: `${colors.red}20`, 
            border: `1px solid ${colors.red}40`,
            padding: 20, 
            borderRadius: 12, 
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div>
              <div style={{ color: colors.white, fontWeight: 700 }}>High Deadhead Alert</div>
              <div style={{ color: colors.gray400, fontSize: 14 }}>
                Your deadhead percentage is above 15%. Consider finding backhauls or loads closer to your drop locations.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Loads */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>📋 Recent Loads</span>
          <button style={styles.btn('primary')} onClick={() => setShowLoadModal(true)}>
            ➕ Add Load
          </button>
        </div>
        {loads.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Route</th>
                <th style={styles.th}>Loaded Miles</th>
                <th style={styles.th}>Deadhead</th>
                <th style={styles.th}>Rate</th>
                <th style={styles.th}>RPM (All)</th>
              </tr>
            </thead>
            <tbody>
              {loads.slice(-5).reverse().map(load => {
                const origin = load.stops?.[0]?.location || 'N/A';
                const dest = load.stops?.[load.stops.length - 1]?.location || 'N/A';
                const totalMiles = (load.loadedMiles || 0) + (load.deadheadMiles || 0);
                const effectiveRPM = totalMiles > 0 ? load.rate / totalMiles : 0;
                return (
                  <tr key={load.id} style={{ cursor: 'pointer' }} onClick={() => openEditLoad(load)}>
                    <td style={{ ...styles.td, borderRadius: '14px 0 0 14px', color: colors.teal }}>{load.date}</td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: colors.green }}>●</span>
                        {origin.split(',')[0]}
                        <span style={{ color: colors.gray500 }}>→</span>
                        {load.stops?.length > 2 && <span style={{ color: colors.orange, fontSize: 12 }}>+{load.stops.length - 2} stops</span>}
                        <span style={{ color: colors.red }}>●</span>
                        {dest.split(',')[0]}
                      </div>
                    </td>
                    <td style={styles.td}>{formatNumber(load.loadedMiles)}</td>
                    <td style={{ ...styles.td, color: load.deadheadMiles > 0 ? colors.red : colors.gray500 }}>
                      {formatNumber(load.deadheadMiles || 0)}
                    </td>
                    <td style={{ ...styles.td, color: colors.green, fontWeight: 700 }}>{formatCurrency(load.rate)}</td>
                    <td style={{ ...styles.td, borderRadius: '0 14px 14px 0', color: colors.orange, fontWeight: 700 }}>
                      {formatCurrency(effectiveRPM)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.gray400 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🚛</div>
            <p style={{ fontSize: 18 }}>No loads recorded yet</p>
            <p style={{ fontSize: 14 }}>Click "Add Load" to get started!</p>
          </div>
        )}
      </div>
    </>
  );

  // ============ LOADS VIEW ============
  const renderLoads = () => {
    // Helper to get driver for a load - with safety checks
    const getLoadDriver = (load) => {
      if (!load || !load.driverId) return null;
      return drivers.find(d => d.id === load.driverId) || null;
    };
    
    return (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Loads</h1>
        <p style={styles.pageSubtitle}>Track your hauling revenue and routes</p>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>🚛 All Loads</span>
          <button style={styles.btn('primary')} onClick={() => setShowLoadModal(true)}>
            ➕ Add Load
          </button>
        </div>
        
        {loads.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Load #</th>
                <th style={styles.th}>Route</th>
                <th style={styles.th}>Driver</th>
                <th style={styles.th}>Miles</th>
                <th style={styles.th}>Rate</th>
                <th style={styles.th}>Driver Pay</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...loads].reverse().map(load => {
                const origin = load.stops?.[0]?.location || 'N/A';
                const dest = load.stops?.[load.stops.length - 1]?.location || 'N/A';
                const driver = getLoadDriver(load);
                const driverPay = driver ? calculateDriverPay(load, driver) : 0;
                const totalMiles = (parseInt(load.loadedMiles) || 0) + (parseInt(load.deadheadMiles) || 0);
                return (
                  <tr key={load.id}>
                    <td 
                      style={{ ...styles.tdClickable, borderRadius: '14px 0 0 14px', color: colors.teal, fontWeight: 600 }}
                      onClick={() => openEditLoad(load)}
                    >
                      {load.date}
                    </td>
                    <td 
                      style={{ ...styles.tdClickable, color: colors.orange }}
                      onClick={() => openEditLoad(load)}
                    >
                      {load.loadNumber || '-'}
                    </td>
                    <td style={styles.td}>
                      <div>
                        <div style={{ color: colors.white }}>{String(origin).split(',')[0]}</div>
                        <div style={{ color: colors.gray500, fontSize: 13 }}>to {String(dest).split(',')[0]}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      {driver ? (
                        <span style={{ display: 'inline-block', padding: '4px 12px', background: `${colors.blue}20`, color: colors.blue, borderRadius: 16, fontSize: 13, fontWeight: 600 }}>
                          {driver.firstName || ''} {(driver.lastName || '').charAt(0)}.
                        </span>
                      ) : (
                        <span style={{ color: colors.gray500, fontSize: 13 }}>-</span>
                      )}
                    </td>
                    <td style={styles.td}>{formatNumber(totalMiles)} mi</td>
                    <td style={{ ...styles.td, color: colors.green, fontWeight: 700 }}>{formatCurrency(load.rate || 0)}</td>
                    <td style={{ ...styles.td, color: driverPay > 0 ? colors.orange : colors.gray500, fontWeight: 600 }}>
                      {driverPay > 0 ? formatCurrency(driverPay) : '-'}
                    </td>
                    <td style={{ ...styles.td, borderRadius: '0 14px 14px 0' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => openEditLoad(load)}
                          style={{ ...styles.btn('secondary'), padding: '8px 12px', fontSize: 13 }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => setLoads(loads.filter(l => l.id !== load.id))}
                          style={{ ...styles.btn('danger'), padding: '8px 12px', fontSize: 13 }}
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
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: colors.gray400 }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>🚛</div>
            <p style={{ fontSize: 20, marginBottom: 8 }}>No loads recorded yet</p>
            <p style={{ fontSize: 14, marginBottom: 24 }}>Start tracking your hauling revenue</p>
            <button style={styles.btn('primary')} onClick={() => setShowLoadModal(true)}>
              ➕ Add Your First Load
            </button>
          </div>
        )}
      </div>
    </>
    );
  };

  // ============ FUEL VIEW ============
  const renderFuel = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Fuel Log</h1>
        <p style={styles.pageSubtitle}>Track your fuel purchases by state for IFTA</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard(colors.red)}>
          <div style={styles.statIcon}>⛽</div>
          <div style={styles.statValue(colors.red)}>{formatCurrency(stats.totalFuelCost)}</div>
          <div style={styles.statLabel}>Total Fuel Cost</div>
        </div>
        <div style={styles.statCard(colors.orange)}>
          <div style={styles.statIcon}>🛢️</div>
          <div style={styles.statValue(colors.orange)}>{formatNumber(stats.totalGallons, 1)}</div>
          <div style={styles.statLabel}>Total Gallons</div>
        </div>
        <div style={styles.statCard(colors.teal)}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue(colors.teal)}>
            {stats.totalGallons > 0 ? formatCurrency(stats.totalFuelCost / stats.totalGallons) : '$0.00'}
          </div>
          <div style={styles.statLabel}>Avg Price/Gallon</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>⛽ Fuel Purchases</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={styles.btn('secondary')} onClick={() => setShowFuelImport(true)}>
              📥 Import CSV
            </button>
            <button style={styles.btn('primary')} onClick={() => setShowFuelModal(true)}>
              ➕ Add Fuel
            </button>
          </div>
        </div>
        
        {fuelEntries.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
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
              {[...fuelEntries].reverse().map(fuel => (
                <tr key={fuel.id}>
                  <td style={{ ...styles.td, borderRadius: '14px 0 0 14px' }}>{fuel.date}</td>
                  <td style={styles.td}>{fuel.location || '-'}</td>
                  <td style={styles.td}>{fuel.state}</td>
                  <td style={styles.td}>{formatNumber(fuel.gallons, 2)}</td>
                  <td style={styles.td}>{formatCurrency(fuel.pricePerGallon)}</td>
                  <td style={{ ...styles.td, color: colors.red, fontWeight: 700 }}>
                    {formatCurrency(fuel.gallons * fuel.pricePerGallon)}
                  </td>
                  <td style={{ ...styles.td, borderRadius: '0 14px 14px 0' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => { setEditingFuel(fuel); setShowFuelModal(true); }}
                        style={{ ...styles.btn('secondary'), padding: '8px 12px', fontSize: 13 }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => setFuelEntries(fuelEntries.filter(f => f.id !== fuel.id))}
                        style={{ ...styles.btn('danger'), padding: '8px 12px', fontSize: 13 }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.gray400 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>⛽</div>
            <p style={{ fontSize: 18 }}>No fuel entries yet</p>
            <p style={{ fontSize: 14 }}>Track your fuel purchases for IFTA reporting</p>
          </div>
        )}
      </div>
    </>
  );

  // ============ IFTA VIEW ============
  const renderIFTA = () => {
    // Use component-level calculated values: fuelByState, iftaSummary, iftaTotals
    const { totalNetTax, totalMiles, totalGallons } = iftaTotals;

    // Export functions
    const exportIFTAPDF = () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>IFTA Report - BalanceBooks Trucking</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #1e3a5f; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #1e3a5f; color: white; }
            .total { font-weight: bold; background: #f0f0f0; }
            .positive { color: green; }
            .negative { color: red; }
          </style>
        </head>
        <body>
          <h1>🚛 IFTA Quarterly Report</h1>
          <p>Generated: ${new Date().toLocaleDateString()}</p>
          <p>Fleet MPG: ${stats.fleetMPG.toFixed(2)}</p>
          <table>
            <thead>
              <tr>
                <th>State</th>
                <th>Miles</th>
                <th>Gallons Purchased</th>
                <th>Gallons Used</th>
                <th>Tax Rate</th>
                <th>Tax Owed</th>
                <th>Tax Paid</th>
                <th>Net Tax</th>
              </tr>
            </thead>
            <tbody>
              ${iftaSummary.map(d => `
                <tr>
                  <td>${STATE_NAMES[d.state] || d.state}</td>
                  <td>${formatNumber(d.miles)}</td>
                  <td>${formatNumber(d.gallons, 2)}</td>
                  <td>${formatNumber(d.gallonsUsed, 2)}</td>
                  <td>$${d.taxRate.toFixed(3)}</td>
                  <td>$${d.taxOwed.toFixed(2)}</td>
                  <td>$${d.taxPaid.toFixed(2)}</td>
                  <td class="${d.netTax >= 0 ? 'negative' : 'positive'}">$${d.netTax.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="7">TOTAL NET TAX</td>
                <td class="${totalNetTax >= 0 ? 'negative' : 'positive'}">$${totalNetTax.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 20px; color: #666;">
            ${totalNetTax >= 0 ? '⚠️ You OWE taxes to these states' : '✅ You have a CREDIT/REFUND due'}
          </p>
        </body>
        </html>
      `;
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IFTA-Report-${new Date().toISOString().split('T')[0]}.html`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const exportIFTAExcel = () => {
      const rows = [
        ['IFTA Quarterly Report - BalanceBooks Trucking'],
        [`Generated: ${new Date().toLocaleDateString()}`],
        [`Fleet MPG: ${stats.fleetMPG.toFixed(2)}`],
        [],
        ['State', 'Miles', 'Gallons Purchased', 'Gallons Used', 'Tax Rate', 'Tax Owed', 'Tax Paid', 'Net Tax'],
        ...iftaSummary.map(d => [
          STATE_NAMES[d.state] || d.state, d.miles, d.gallons.toFixed(2), d.gallonsUsed.toFixed(2),
          d.taxRate.toFixed(3), d.taxOwed.toFixed(2), d.taxPaid.toFixed(2), d.netTax.toFixed(2)
        ]),
        [],
        ['TOTAL NET TAX', '', '', '', '', '', '', totalNetTax.toFixed(2)],
      ];
      
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IFTA-Report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Add miles for a state
    const addMilesForState = (state) => {
      const existing = iftaData.find(d => d.state === state);
      if (existing) {
        setEditingIFTA(existing);
      } else {
        setEditingIFTA({
          state,
          miles: '',
          gallons: fuelByState[state]?.gallons || 0,
        });
      }
      setShowIFTAModal(true);
    };

    return (
      <>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>IFTA Calculator</h1>
          <p style={styles.pageSubtitle}>Auto-calculated from your Fuel Log • Add miles driven per state</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard(totalNetTax >= 0 ? colors.red : colors.green)}>
            <div style={styles.statIcon}>{totalNetTax >= 0 ? '💸' : '💰'}</div>
            <div style={styles.statValue(totalNetTax >= 0 ? colors.red : colors.green)}>
              {formatCurrency(Math.abs(totalNetTax))}
            </div>
            <div style={styles.statLabel}>{totalNetTax >= 0 ? 'Tax Owed' : 'Tax Credit'}</div>
          </div>
          <div style={styles.statCard(colors.blue)}>
            <div style={styles.statIcon}>🛣️</div>
            <div style={styles.statValue(colors.blue)}>{formatNumber(totalMiles)}</div>
            <div style={styles.statLabel}>Total Miles</div>
          </div>
          <div style={styles.statCard(colors.orange)}>
            <div style={styles.statIcon}>⛽</div>
            <div style={styles.statValue(colors.orange)}>{formatNumber(totalGallons, 1)}</div>
            <div style={styles.statLabel}>Total Gallons</div>
          </div>
          <div style={styles.statCard(colors.teal)}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statValue(colors.teal)}>{stats.fleetMPG.toFixed(2)}</div>
            <div style={styles.statLabel}>Fleet MPG</div>
          </div>
        </div>

        {/* Info Banner */}
        {fuelEntries.length > 0 && iftaSummary.some(d => d.miles === 0) && (
          <div style={{
            background: `linear-gradient(135deg, ${colors.orange}20, ${colors.yellow}20)`,
            border: `2px solid ${colors.orange}`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>💡</span>
              <div>
                <div style={{ color: colors.orange, fontWeight: 700, fontSize: 16 }}>
                  Add Miles Driven Per State
                </div>
                <div style={{ color: colors.gray400, fontSize: 14 }}>
                  Gallons are auto-imported from your Fuel Log. Click "Add Miles" to enter miles driven in each state to calculate IFTA taxes.
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>📋 IFTA Data by State</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={styles.btn('secondary')} onClick={exportIFTAPDF}>
                📄 Export PDF
              </button>
              <button style={styles.btn('secondary')} onClick={exportIFTAExcel}>
                📊 Export XLS
              </button>
              <button style={styles.btn('primary')} onClick={() => setShowIFTAModal(true)}>
                ➕ Add State
              </button>
            </div>
          </div>
          
          {iftaSummary.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>State</th>
                  <th style={styles.th}>Miles</th>
                  <th style={styles.th}>Gal Purchased</th>
                  <th style={styles.th}>Gal Used</th>
                  <th style={styles.th}>Tax Rate</th>
                  <th style={styles.th}>Tax Owed</th>
                  <th style={styles.th}>Tax Paid</th>
                  <th style={styles.th}>Net</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {iftaSummary.map(d => (
                  <tr key={d.id}>
                    <td style={{ ...styles.td, borderRadius: '14px 0 0 14px', fontWeight: 700 }}>
                      {STATE_NAMES[d.state] || d.state}
                      {d.isAuto && <span style={{ color: colors.teal, fontSize: 11, marginLeft: 6 }}>AUTO</span>}
                    </td>
                    <td style={{ ...styles.td, color: d.miles === 0 ? colors.yellow : colors.white }}>
                      {d.miles > 0 ? formatNumber(d.miles) : (
                        <button 
                          onClick={() => addMilesForState(d.state)}
                          style={{ 
                            background: colors.orange, 
                            color: colors.white, 
                            border: 'none', 
                            padding: '4px 8px', 
                            borderRadius: 6, 
                            fontSize: 11,
                            cursor: 'pointer',
                          }}
                        >
                          + Add Miles
                        </button>
                      )}
                    </td>
                    <td style={styles.td}>{formatNumber(d.gallons, 2)}</td>
                    <td style={styles.td}>{formatNumber(d.gallonsUsed, 2)}</td>
                    <td style={styles.td}>${d.taxRate.toFixed(3)}</td>
                    <td style={styles.td}>{formatCurrency(d.taxOwed)}</td>
                    <td style={styles.td}>{formatCurrency(d.taxPaid)}</td>
                    <td style={{ ...styles.td, color: d.netTax >= 0 ? colors.red : colors.green, fontWeight: 700 }}>
                      {formatCurrency(d.netTax)}
                    </td>
                    <td style={{ ...styles.td, borderRadius: '0 14px 14px 0' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          onClick={() => addMilesForState(d.state)}
                          style={{ ...styles.btn('secondary'), padding: '8px 12px', fontSize: 13 }}
                        >
                          ✏️
                        </button>
                        {!d.isAuto && (
                          <button 
                            onClick={() => setIftaData(iftaData.filter(i => i.state !== d.state))}
                            style={{ ...styles.btn('danger'), padding: '8px 12px', fontSize: 13 }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.gray400 }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>📋</div>
              <p style={{ fontSize: 18, marginBottom: 12 }}>No IFTA data yet</p>
              <p style={{ fontSize: 14, marginBottom: 24 }}>
                Add fuel purchases to the <strong style={{ color: colors.orange }}>Fuel Log</strong> tab,<br/>
                then add miles driven per state here.
              </p>
              <button style={styles.btn('primary')} onClick={() => setActiveTab('fuel')}>
                ⛽ Go to Fuel Log
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  // ============ EXPENSES VIEW ============
  const renderExpenses = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Expenses</h1>
        <p style={styles.pageSubtitle}>Track your operating costs</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard(colors.red)}>
          <div style={styles.statIcon}>💸</div>
          <div style={styles.statValue(colors.red)}>{formatCurrency(stats.totalExpenses)}</div>
          <div style={styles.statLabel}>Total Expenses</div>
        </div>
        <div style={styles.statCard(colors.orange)}>
          <div style={styles.statIcon}>⛽</div>
          <div style={styles.statValue(colors.orange)}>{formatCurrency(stats.totalFuelCost)}</div>
          <div style={styles.statLabel}>Fuel Costs</div>
        </div>
        <div style={styles.statCard(colors.yellow)}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue(colors.yellow)}>{formatCentsPerMile(stats.costPerMile)}</div>
          <div style={styles.statLabel}>Cost/Mile</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>💰 All Expenses</span>
          <button style={styles.btn('primary')} onClick={() => setShowExpenseModal(true)}>
            ➕ Add Expense
          </button>
        </div>
        
        {expenses.length > 0 ? (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...expenses].reverse().map(expense => (
                <tr key={expense.id}>
                  <td style={{ ...styles.td, borderRadius: '14px 0 0 14px' }}>{expense.date}</td>
                  <td style={styles.td}>{expense.category}</td>
                  <td style={styles.td}>{expense.description}</td>
                  <td style={{ ...styles.td, color: colors.red, fontWeight: 700 }}>
                    {formatCurrency(expense.amount)}
                  </td>
                  <td style={{ ...styles.td, borderRadius: '0 14px 14px 0' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => { setEditingExpense(expense); setShowExpenseModal(true); }}
                        style={{ ...styles.btn('secondary'), padding: '8px 12px', fontSize: 13 }}
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => setExpenses(expenses.filter(e => e.id !== expense.id))}
                        style={{ ...styles.btn('danger'), padding: '8px 12px', fontSize: 13 }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.gray400 }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>💰</div>
            <p style={{ fontSize: 18 }}>No expenses recorded yet</p>
            <p style={{ fontSize: 14 }}>Track maintenance, permits, and other costs</p>
          </div>
        )}
      </div>
    </>
  );

  // ============ PER DIEM VIEW ============
  const renderPerDiem = () => {
    const totalDays = perDiemDays.reduce((s, d) => s + d.days, 0);
    const totalPerDiem = perDiemDays.reduce((s, d) => s + d.total, 0);

    return (
      <>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Per Diem</h1>
          <p style={styles.pageSubtitle}>Track your travel days for tax deductions</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard(colors.green)}>
            <div style={styles.statIcon}>📅</div>
            <div style={styles.statValue(colors.green)}>{totalDays}</div>
            <div style={styles.statLabel}>Total Days</div>
          </div>
          <div style={styles.statCard(colors.teal)}>
            <div style={styles.statIcon}>💵</div>
            <div style={styles.statValue(colors.teal)}>{formatCurrency(totalPerDiem)}</div>
            <div style={styles.statLabel}>Total Per Diem</div>
          </div>
          <div style={styles.statCard(colors.orange)}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statValue(colors.orange)}>$80/day</div>
            <div style={styles.statLabel}>IRS Rate (2024)</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>📅 Per Diem Entries</span>
            <button style={styles.btn('primary')} onClick={() => setShowPerDiemModal(true)}>
              ➕ Add Days
            </button>
          </div>
          
          {perDiemDays.length > 0 ? (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Start Date</th>
                  <th style={styles.th}>End Date</th>
                  <th style={styles.th}>Days</th>
                  <th style={styles.th}>Rate</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...perDiemDays].reverse().map(entry => (
                  <tr key={entry.id}>
                    <td style={{ ...styles.td, borderRadius: '14px 0 0 14px' }}>{entry.startDate}</td>
                    <td style={styles.td}>{entry.endDate}</td>
                    <td style={styles.td}>{entry.days}</td>
                    <td style={styles.td}>{formatCurrency(entry.rate)}</td>
                    <td style={{ ...styles.td, color: colors.green, fontWeight: 700 }}>
                      {formatCurrency(entry.total)}
                    </td>
                    <td style={{ ...styles.td, borderRadius: '0 14px 14px 0' }}>
                      <button 
                        onClick={() => setPerDiemDays(perDiemDays.filter(d => d.id !== entry.id))}
                        style={{ ...styles.btn('danger'), padding: '8px 12px', fontSize: 13 }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: colors.gray400 }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>📅</div>
              <p style={{ fontSize: 18 }}>No per diem entries yet</p>
              <p style={{ fontSize: 14 }}>Track your travel days for tax deductions</p>
            </div>
          )}
        </div>
      </>
    );
  };


  // ============ DRIVER CRUD FUNCTIONS ============
  const saveDriver = (driver) => {
    try {
      if (editingDriver) {
        setDrivers(prev => prev.map(d => d.id === driver.id ? { ...driver, updatedAt: new Date().toISOString() } : d));
      } else {
        const newDriver = { 
          ...driver, 
          id: uid(), 
          createdAt: new Date().toISOString() 
        };
        setDrivers(prev => [...prev, newDriver]);
      }
      setShowDriverModal(false);
      setEditingDriver(null);
    } catch (err) {
      console.error('Error saving driver:', err);
      alert('Error saving driver. Please try again.');
    }
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

  // ============ TRUCK CRUD FUNCTIONS ============
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

  // ============ EXPORT FUNCTIONS ============
  const exportDriversCSV = () => {
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
          <h2 style={{ color: colors.white, marginBottom: 24, fontSize: 24 }}>
            {editingDriver ? '✏️ Edit Driver' : '👤 Add Driver'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name *</label>
                <input style={styles.input} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required placeholder="John" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name *</label>
                <input style={styles.input} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required placeholder="Doe" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input style={styles.input} type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="(555) 123-4567" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="driver@email.com" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>CDL Number</label>
                <input style={styles.input} value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} placeholder="License #" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>CDL State</label>
                <select style={styles.select} value={form.licenseState} onChange={e => setForm({...form, licenseState: e.target.value})}>
                  <option value="">Select</option>
                  {Object.keys(STATE_NAMES).map(abbr => <option key={abbr} value={abbr}>{abbr}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>CDL Expiry</label>
                <input style={styles.input} type="date" value={form.licenseExpiry} onChange={e => setForm({...form, licenseExpiry: e.target.value})} />
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${colors.gray700}`, margin: '24px 0', paddingTop: 24 }}>
              <h3 style={{ color: colors.orange, marginBottom: 16, fontSize: 16 }}>💰 Pay Configuration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Type *</label>
                  <select style={styles.select} value={form.paymentType} onChange={e => setForm({...form, paymentType: e.target.value})}>
                    <option value={PAY_TYPES.PER_MILE}>Per Mile</option>
                    <option value={PAY_TYPES.PERCENTAGE}>Percentage</option>
                    <option value={PAY_TYPES.FLAT_RATE}>Flat Rate per Load</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Pay Rate * {form.paymentType === PAY_TYPES.PER_MILE && '($/mile)'}{form.paymentType === PAY_TYPES.PERCENTAGE && '(%)'}{form.paymentType === PAY_TYPES.FLAT_RATE && '($/load)'}</label>
                  <input style={styles.input} type="number" step="0.01" value={form.payRate} onChange={e => setForm({...form, payRate: e.target.value})} placeholder={form.paymentType === PAY_TYPES.PER_MILE ? '0.55' : form.paymentType === PAY_TYPES.PERCENTAGE ? '28' : '500'} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Assigned Truck</label>
                <select style={styles.select} value={form.assignedTruckId || ''} onChange={e => setForm({...form, assignedTruckId: e.target.value})}>
                  <option value="">No Truck Assigned</option>
                  {(trucks || []).filter(t => t && t.status === 'active').map(truck => (
                    <option key={truck.id} value={truck.id}>{truck.unitNumber || 'Unknown'} - {truck.year || ''} {truck.make || ''}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select style={styles.select} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" style={styles.btn('secondary')} onClick={() => { setShowDriverModal(false); setEditingDriver(null); }}>Cancel</button>
              <button type="submit" style={styles.btn('primary')}>{editingDriver ? '💾 Update' : '➕ Add Driver'}</button>
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
          <h2 style={{ color: colors.white, marginBottom: 24, fontSize: 24 }}>
            {editingTruck ? '✏️ Edit Truck' : '🚚 Add Truck'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Unit Number *</label>
                <input style={styles.input} value={form.unitNumber} onChange={e => setForm({...form, unitNumber: e.target.value})} required placeholder="Unit 101" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>VIN</label>
                <input style={styles.input} value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} placeholder="17-character VIN" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Year</label>
                <input style={styles.input} type="number" value={form.year} onChange={e => setForm({...form, year: e.target.value})} placeholder="2024" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Make</label>
                <select style={styles.select} value={form.make} onChange={e => setForm({...form, make: e.target.value})}>
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
                <input style={styles.input} value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Cascadia" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>License Plate</label>
                <input style={styles.input} value={form.licensePlate} onChange={e => setForm({...form, licensePlate: e.target.value})} placeholder="ABC-1234" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Plate State</label>
                <select style={styles.select} value={form.licensePlateState} onChange={e => setForm({...form, licensePlateState: e.target.value})}>
                  <option value="">Select</option>
                  {Object.keys(STATE_NAMES).map(abbr => <option key={abbr} value={abbr}>{abbr}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select style={styles.select} value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${colors.gray700}`, margin: '24px 0', paddingTop: 24 }}>
              <h3 style={{ color: colors.teal, marginBottom: 16, fontSize: 16 }}>⛽ Specifications</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fuel Capacity (gal)</label>
                  <input style={styles.input} type="number" value={form.fuelCapacity} onChange={e => setForm({...form, fuelCapacity: e.target.value})} placeholder="300" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Target MPG</label>
                  <input style={styles.input} type="number" step="0.1" value={form.targetMPG} onChange={e => setForm({...form, targetMPG: e.target.value})} placeholder="7.5" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Ownership</label>
                  <select style={styles.select} value={form.ownershipType} onChange={e => setForm({...form, ownershipType: e.target.value})}>
                    <option value="owned">Owned</option>
                    <option value="leased">Leased</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Monthly Payment</label>
                  <input style={styles.input} type="number" step="0.01" value={form.monthlyPayment} onChange={e => setForm({...form, monthlyPayment: e.target.value})} placeholder="0.00" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" style={styles.btn('secondary')} onClick={() => { setShowTruckModal(false); setEditingTruck(null); }}>Cancel</button>
              <button type="submit" style={styles.btn('primary')}>{editingTruck ? '💾 Update' : '➕ Add Truck'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // ============ DRIVERS VIEW ============
  const renderDrivers = () => {
    const getDriverTruck = (driverId) => {
      if (!drivers || !trucks) return null;
      const driver = drivers.find(d => d && d.id === driverId);
      if (!driver?.assignedTruckId) return null;
      return trucks.find(t => t && t.id === driver.assignedTruckId) || null;
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return colors.green;
        case 'inactive': return colors.yellow;
        case 'terminated': return colors.red;
        default: return colors.gray400;
      }
    };

    // Calculate driver stats
    const getDriverStats = (driverId) => {
      const driverLoads = loads.filter(l => l.driverId === driverId);
      const driver = drivers.find(d => d.id === driverId);
      const totalLoads = driverLoads.length;
      const totalMiles = driverLoads.reduce((sum, l) => sum + (parseFloat(l.loadedMiles) || 0) + (parseFloat(l.deadheadMiles) || 0), 0);
      const totalRevenue = driverLoads.reduce((sum, l) => sum + (parseFloat(l.rate) || 0), 0);
      const totalPay = driverLoads.reduce((sum, l) => sum + (driver ? calculateDriverPay(l, driver) : 0), 0);
      return { totalLoads, totalMiles, totalRevenue, totalPay };
    };

    // Calculate totals across all drivers
    const totalDriverPay = drivers.reduce((sum, driver) => {
      const stats = getDriverStats(driver.id);
      return sum + stats.totalPay;
    }, 0);

    const totalAssignedLoads = loads.filter(l => l.driverId).length;

    return (
      <>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>👤 Drivers</h1>
          <p style={styles.pageSubtitle}>Manage your drivers, pay rates, and assignments</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard(colors.green)}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statValue(colors.green)}>{(drivers || []).filter(d => d && d.status === 'active').length}</div>
            <div style={styles.statLabel}>Active Drivers</div>
          </div>
          <div style={styles.statCard(colors.blue)}>
            <div style={styles.statIcon}>🚛</div>
            <div style={styles.statValue(colors.blue)}>{totalAssignedLoads}</div>
            <div style={styles.statLabel}>Assigned Loads</div>
          </div>
          <div style={styles.statCard(colors.orange)}>
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statValue(colors.orange)}>{formatCurrency(totalDriverPay)}</div>
            <div style={styles.statLabel}>Total Driver Pay</div>
          </div>
        </div>

        {/* Driver Pay Report Card */}
        {drivers && drivers.length > 0 && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>
              <span>📊 Driver Pay Report</span>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Driver</th>
                  <th style={styles.th}>Pay Type</th>
                  <th style={styles.th}>Rate</th>
                  <th style={styles.th}>Loads</th>
                  <th style={styles.th}>Miles</th>
                  <th style={styles.th}>Revenue</th>
                  <th style={styles.th}>Driver Pay</th>
                  <th style={styles.th}>Profit After Pay</th>
                </tr>
              </thead>
              <tbody>
                {(drivers || []).filter(d => d && d.status === 'active').map(driver => {
                  const stats = getDriverStats(driver.id);
                  const profit = stats.totalRevenue - stats.totalPay;
                  return (
                    <tr key={driver.id}>
                      <td style={{ ...styles.td, borderRadius: '12px 0 0 12px', fontWeight: 600 }}>
                        {driver.firstName || ''} {driver.lastName || ''}
                      </td>
                      <td style={styles.td}>
                        <span style={{ textTransform: 'capitalize' }}>{(driver.paymentType || '').replace('_', ' ')}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ color: colors.orange, fontWeight: 600 }}>{formatPayRate(driver.paymentType, driver.payRate)}</span>
                      </td>
                      <td style={styles.td}>{stats.totalLoads}</td>
                      <td style={styles.td}>{formatNumber(stats.totalMiles)} mi</td>
                      <td style={{ ...styles.td, color: colors.green, fontWeight: 600 }}>{formatCurrency(stats.totalRevenue)}</td>
                      <td style={{ ...styles.td, color: colors.orange, fontWeight: 600 }}>{formatCurrency(stats.totalPay)}</td>
                      <td style={{ ...styles.td, borderRadius: '0 12px 12px 0', color: profit >= 0 ? colors.teal : colors.red, fontWeight: 600 }}>
                        {formatCurrency(profit)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>👤 Driver Roster</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={styles.btn('secondary')} onClick={exportDriversCSV}>📤 Export</button>
              <button style={styles.btn('primary')} onClick={() => setShowDriverModal(true)}>➕ Add Driver</button>
            </div>
          </div>

          {driversSelect.selectedCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', background: `${colors.orange}20`, borderRadius: 12, marginBottom: 20 }}>
              <span style={{ background: colors.orange, color: colors.white, padding: '6px 14px', borderRadius: 16, fontWeight: 600, fontSize: 14 }}>✓ {driversSelect.selectedCount} selected</span>
              <button style={{ ...styles.btn('danger'), padding: '8px 16px', fontSize: 13 }} onClick={deleteSelectedDrivers}>🗑️ Delete</button>
              <button style={{ background: 'transparent', border: `1px solid ${colors.orange}`, color: colors.orange, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }} onClick={driversSelect.clearSelection}>✕ Clear</button>
            </div>
          )}

          {(!drivers || drivers.length === 0) ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
              <h3 style={{ color: colors.white, marginBottom: 8 }}>No Drivers Yet</h3>
              <p style={{ marginBottom: 16 }}>Add your first driver to get started</p>
              <button style={styles.btn('primary')} onClick={() => setShowDriverModal(true)}>➕ Add Driver</button>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: 40 }}>
                    <input type="checkbox" checked={driversSelect.allSelected} ref={el => { if (el) el.indeterminate = driversSelect.someSelected && !driversSelect.allSelected; }} onChange={driversSelect.toggleAll} style={styles.checkbox} />
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
                {(drivers || []).map(driver => {
                  const truck = getDriverTruck(driver.id);
                  return (
                    <tr key={driver.id} style={{ background: driversSelect.isSelected(driver.id) ? `${colors.orange}15` : 'transparent' }}>
                      <td style={{ ...styles.td, borderRadius: '12px 0 0 12px' }}>
                        <input type="checkbox" checked={driversSelect.isSelected(driver.id)} onChange={() => driversSelect.toggleItem(driver.id)} style={styles.checkbox} />
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600 }}>{driver.firstName} {driver.lastName}</div>
                        <div style={{ fontSize: 12, color: colors.gray400 }}>{driver.licenseNumber && `CDL: ${driver.licenseNumber}`}</div>
                      </td>
                      <td style={styles.td}>
                        <div>{driver.phone || '-'}</div>
                        <div style={{ fontSize: 12, color: colors.gray400 }}>{driver.email || '-'}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ display: 'inline-block', padding: '6px 12px', background: `${colors.orange}20`, color: colors.orange, borderRadius: 16, fontSize: 13, fontWeight: 600 }}>
                          {formatPayRate(driver.paymentType, driver.payRate)}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {truck ? (
                          <span style={{ display: 'inline-block', padding: '6px 12px', background: `${colors.teal}20`, color: colors.teal, borderRadius: 16, fontSize: 13, fontWeight: 600 }}>🚛 {truck.unitNumber}</span>
                        ) : (
                          <span style={{ color: colors.gray500 }}>Not assigned</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{ display: 'inline-block', padding: '6px 12px', background: `${getStatusColor(driver.status)}20`, color: getStatusColor(driver.status), borderRadius: 16, fontSize: 13, fontWeight: 600 }}>{driver.status}</span>
                      </td>
                      <td style={{ ...styles.td, borderRadius: '0 12px 12px 0' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ background: colors.gray700, border: 'none', color: colors.white, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }} onClick={() => { setEditingDriver(driver); setShowDriverModal(true); }}>✏️</button>
                          <button style={{ background: colors.red, border: 'none', color: colors.white, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }} onClick={() => deleteDriver(driver.id)}>🗑️</button>
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

  // ============ TRUCKS VIEW ============
  const renderTrucks = () => {
    const getAssignedDriver = (truckId) => (drivers || []).find(d => d && d.assignedTruckId === truckId) || null;

    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return colors.green;
        case 'inactive': return colors.yellow;
        case 'maintenance': return colors.orange;
        case 'sold': return colors.red;
        default: return colors.gray400;
      }
    };

    return (
      <>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>🚚 Trucks</h1>
          <p style={styles.pageSubtitle}>Manage your fleet inventory and assignments</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard(colors.green)}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statValue(colors.green)}>{(trucks || []).filter(t => t && t.status === 'active').length}</div>
            <div style={styles.statLabel}>Active Trucks</div>
          </div>
          <div style={styles.statCard(colors.teal)}>
            <div style={styles.statIcon}>🚚</div>
            <div style={styles.statValue(colors.teal)}>{(trucks || []).length}</div>
            <div style={styles.statLabel}>Total Fleet</div>
          </div>
          <div style={styles.statCard(colors.orange)}>
            <div style={styles.statIcon}>🔧</div>
            <div style={styles.statValue(colors.orange)}>{(trucks || []).filter(t => t && t.status === 'maintenance').length}</div>
            <div style={styles.statLabel}>In Maintenance</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>🚚 Fleet Inventory</span>
            <button style={styles.btn('primary')} onClick={() => setShowTruckModal(true)}>➕ Add Truck</button>
          </div>

          {trucksSelect.selectedCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', background: `${colors.orange}20`, borderRadius: 12, marginBottom: 20 }}>
              <span style={{ background: colors.orange, color: colors.white, padding: '6px 14px', borderRadius: 16, fontWeight: 600, fontSize: 14 }}>✓ {trucksSelect.selectedCount} selected</span>
              <button style={{ ...styles.btn('danger'), padding: '8px 16px', fontSize: 13 }} onClick={deleteSelectedTrucks}>🗑️ Delete</button>
              <button style={{ background: 'transparent', border: `1px solid ${colors.orange}`, color: colors.orange, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }} onClick={trucksSelect.clearSelection}>✕ Clear</button>
            </div>
          )}

          {(!trucks || trucks.length === 0) ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚚</div>
              <h3 style={{ color: colors.white, marginBottom: 8 }}>No Trucks Yet</h3>
              <p style={{ marginBottom: 16 }}>Add your first truck to start tracking</p>
              <button style={styles.btn('primary')} onClick={() => setShowTruckModal(true)}>➕ Add Truck</button>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={{ ...styles.th, width: 40 }}>
                    <input type="checkbox" checked={trucksSelect.allSelected} ref={el => { if (el) el.indeterminate = trucksSelect.someSelected && !trucksSelect.allSelected; }} onChange={trucksSelect.toggleAll} style={styles.checkbox} />
                  </th>
                  <th style={styles.th}>Unit</th>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Assigned Driver</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(trucks || []).map(truck => {
                  const driver = getAssignedDriver(truck.id);
                  return (
                    <tr key={truck.id} style={{ background: trucksSelect.isSelected(truck.id) ? `${colors.orange}15` : 'transparent' }}>
                      <td style={{ ...styles.td, borderRadius: '12px 0 0 12px' }}>
                        <input type="checkbox" checked={trucksSelect.isSelected(truck.id)} onChange={() => trucksSelect.toggleItem(truck.id)} style={styles.checkbox} />
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{truck.unitNumber || ''}</div>
                        <div style={{ fontSize: 12, color: colors.gray400 }}>{truck.licensePlate}</div>
                      </td>
                      <td style={styles.td}>
                        <div>{truck.year} {truck.make}</div>
                        <div style={{ fontSize: 12, color: colors.gray400 }}>{truck.model}</div>
                      </td>
                      <td style={styles.td}>
                        {driver ? (
                          <span style={{ display: 'inline-block', padding: '6px 12px', background: `${colors.blue}20`, color: colors.blue, borderRadius: 16, fontSize: 13, fontWeight: 600 }}>👤 {driver.firstName} {driver.lastName}</span>
                        ) : (
                          <span style={{ color: colors.gray500 }}>Unassigned</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{ display: 'inline-block', padding: '6px 12px', background: `${getStatusColor(truck.status)}20`, color: getStatusColor(truck.status), borderRadius: 16, fontSize: 13, fontWeight: 600 }}>{truck.status}</span>
                      </td>
                      <td style={{ ...styles.td, borderRadius: '0 12px 12px 0' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ background: colors.gray700, border: 'none', color: colors.white, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }} onClick={() => { setEditingTruck(truck); setShowTruckModal(true); }}>✏️</button>
                          <button style={{ background: colors.red, border: 'none', color: colors.white, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }} onClick={() => deleteTruck(truck.id)}>🗑️</button>
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

  // ============ DRIVER PAY VIEW ============
  const renderDriverPay = () => {
    // Get current week dates
    const getWeekDates = () => {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0]
      };
    };

    const currentWeek = getWeekDates();
    const startDate = payPeriodStart || currentWeek.start;
    const endDate = currentWeek.end;

    // Filter loads
    const filteredLoads = loads.filter(function(load) {
      const loadDate = load.date;
      return loadDate >= startDate && loadDate <= endDate;
    });

    // Group by driver
    const driverPayMap = {};
    filteredLoads.forEach(function(load) {
      const driverId = load.driverId || 'unassigned';
      if (!driverPayMap[driverId]) {
        const driver = drivers.find(function(d) { return d.id === driverId; });
        driverPayMap[driverId] = {
          driver: driver || { id: 'unassigned', firstName: 'Unassigned', lastName: '', paymentType: 'none', payRate: 0 },
          loads: [],
          totalMiles: 0,
          totalRevenue: 0,
          totalPay: 0
        };
      }
      
      const miles = (parseFloat(load.loadedMiles) || 0) + (parseFloat(load.deadheadMiles) || 0);
      const revenue = parseFloat(load.rate) || 0;
      const driverData = driverPayMap[driverId].driver;
      
      var pay = 0;
      if (driverData.paymentType === 'perMile') {
        pay = miles * (parseFloat(driverData.payRate) || 0);
      } else if (driverData.paymentType === 'percentage') {
        pay = revenue * (parseFloat(driverData.payRate) || 0) / 100;
      } else if (driverData.paymentType === 'flatRate') {
        pay = parseFloat(driverData.payRate) || 0;
      }
      
      driverPayMap[driverId].loads.push(Object.assign({}, load, { calculatedPay: pay }));
      driverPayMap[driverId].totalMiles += miles;
      driverPayMap[driverId].totalRevenue += revenue;
      driverPayMap[driverId].totalPay += pay;
    });

    const payStatements = Object.values(driverPayMap);
    
    const grandTotals = payStatements.reduce(function(acc, stmt) {
      return {
        loads: acc.loads + stmt.loads.length,
        miles: acc.miles + stmt.totalMiles,
        revenue: acc.revenue + stmt.totalRevenue,
        pay: acc.pay + stmt.totalPay
      };
    }, { loads: 0, miles: 0, revenue: 0, pay: 0 });

    const setThisWeek = function() {
      const dates = getWeekDates();
      setPayPeriodStart(dates.start);
    };

    const getPayLabel = function(type, rate) {
      if (type === 'perMile') return '$' + rate + '/mi';
      if (type === 'percentage') return rate + '%';
      if (type === 'flatRate') return '$' + rate + '/load';
      return 'Not Set';
    };

    return (
      <>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Driver Pay Statements</h1>
          <p style={styles.pageSubtitle}>Calculate driver pay for period: {startDate} to {endDate}</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button style={styles.btn('secondary')} onClick={setThisWeek}>This Week</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Loads</div>
            <div style={styles.statValue(colors.teal)}>{grandTotals.loads}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Miles</div>
            <div style={styles.statValue(colors.orange)}>{formatNumber(grandTotals.miles)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Revenue</div>
            <div style={styles.statValue(colors.blue)}>{formatCurrency(grandTotals.revenue)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Driver Pay</div>
            <div style={styles.statValue(colors.green)}>{formatCurrency(grandTotals.pay)}</div>
          </div>
        </div>

        {payStatements.length === 0 ? (
          <div style={styles.card}>
            <div style={{ textAlign: 'center', padding: 60, color: colors.gray400 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>💵</div>
              <p style={{ fontSize: 18 }}>No loads found for this period</p>
            </div>
          </div>
        ) : (
          payStatements.map(function(stmt) {
            return (
              <div key={stmt.driver.id} style={Object.assign({}, styles.card, { marginBottom: 24 })}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid ' + colors.gray700 }}>
                  <div>
                    <h3 style={{ color: colors.white, fontSize: 18, marginBottom: 4 }}>
                      {stmt.driver.firstName} {stmt.driver.lastName}
                    </h3>
                    <p style={{ color: colors.gray400, fontSize: 13 }}>
                      Pay: {getPayLabel(stmt.driver.paymentType, stmt.driver.payRate)} | {stmt.loads.length} loads | {formatNumber(stmt.totalMiles)} mi
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: colors.gray400, fontSize: 11 }}>Total Pay</div>
                    <div style={{ color: colors.green, fontSize: 24, fontWeight: 800 }}>{formatCurrency(stmt.totalPay)}</div>
                  </div>
                </div>

                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Load #</th>
                      <th style={styles.th}>Miles</th>
                      <th style={styles.th}>Revenue</th>
                      <th style={styles.th}>Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stmt.loads.map(function(load) {
                      var loadMiles = (parseFloat(load.loadedMiles) || 0) + (parseFloat(load.deadheadMiles) || 0);
                      return (
                        <tr key={load.id}>
                          <td style={styles.td}>{load.date}</td>
                          <td style={styles.td}>{load.loadNumber || '-'}</td>
                          <td style={styles.td}>{formatNumber(loadMiles)}</td>
                          <td style={Object.assign({}, styles.td, { color: colors.blue })}>{formatCurrency(load.rate)}</td>
                          <td style={Object.assign({}, styles.td, { color: colors.green, fontWeight: 600 })}>{formatCurrency(load.calculatedPay)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </>
    );
  };

  // ============ SETTINGS VIEW (UPDATED FOR INDEXEDDB) ============
  const renderSettings = () => (
    <>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Settings</h1>
        <p style={styles.pageSubtitle}>Manage your data and preferences</p>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>💾 Data Management</span>
        </div>
        
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ 
            background: colors.navyDark, 
            padding: 24, 
            borderRadius: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ color: colors.white, fontWeight: 700, marginBottom: 4 }}>Export All Data</div>
              <div style={{ color: colors.gray400, fontSize: 14 }}>Download your data as JSON backup</div>
            </div>
            <button 
              onClick={async () => {
                try {
                  const data = await exportAllData();
                  const backup = {
                    version: APP_VERSION,
                    exportDate: new Date().toISOString(),
                    storage: 'IndexedDB',
                    data
                  };
                  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `balancebooks-trucking-backup-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (err) {
                  alert('❌ Export failed: ' + err.message);
                }
              }}
              style={styles.btn('primary')}
            >
              📥 Export
            </button>
          </div>

          <div style={{ 
            background: colors.navyDark, 
            padding: 24, 
            borderRadius: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ color: colors.white, fontWeight: 700, marginBottom: 4 }}>Import Data</div>
              <div style={{ color: colors.gray400, fontSize: 14 }}>Restore from a JSON backup file</div>
            </div>
            <label style={{ ...styles.btn('secondary'), cursor: 'pointer' }}>
              📤 Import
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      try {
                        const imported = JSON.parse(ev.target?.result);
                        const data = imported.data || imported;
                        
                        const result = await importAllData(data);
                        if (result.success) {
                          const freshData = await loadFromIndexedDB();
                          setLoads(freshData.loads || []);
                          setFuelEntries(freshData.fuelEntries || []);
                          setIftaData(freshData.iftaData || []);
                          setExpenses(freshData.expenses || []);
                          setPerDiemDays(freshData.perDiemDays || []);
                          alert('✅ Data imported successfully!');
                        } else {
                          alert('❌ Import failed: ' + result.error);
                        }
                      } catch (err) {
                        alert('❌ Failed to import: Invalid file format');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>

          {/* Individual Data Clear Options */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ color: colors.gray300, fontWeight: 600, marginBottom: 12 }}>🧹 Clear Individual Data</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <button 
                onClick={async () => {
                  if (confirm('Clear all FUEL entries? This cannot be undone.')) {
                    try {
                      const db = await new Promise((resolve, reject) => {
                        const req = indexedDB.open('BalanceBooksTrucking');
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => reject(req.error);
                      });
                      const tx = db.transaction('fuel', 'readwrite');
                      await new Promise((resolve, reject) => {
                        const req = tx.objectStore('fuel').clear();
                        req.onsuccess = () => resolve();
                        req.onerror = () => reject(req.error);
                      });
                      setFuelEntries([]);
                      alert('✅ Fuel data cleared!');
                    } catch (e) { alert('❌ Error: ' + e.message); }
                  }
                }}
                style={{ ...styles.btn('secondary'), justifyContent: 'center', fontSize: 13 }}
              >⛽ Fuel</button>
              <button 
                onClick={async () => {
                  if (confirm('Clear all LOAD entries? This cannot be undone.')) {
                    try {
                      const db = await new Promise((resolve, reject) => {
                        const req = indexedDB.open('BalanceBooksTrucking');
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => reject(req.error);
                      });
                      const tx = db.transaction('loads', 'readwrite');
                      await new Promise((resolve, reject) => {
                        const req = tx.objectStore('loads').clear();
                        req.onsuccess = () => resolve();
                        req.onerror = () => reject(req.error);
                      });
                      setLoads([]);
                      alert('✅ Load data cleared!');
                    } catch (e) { alert('❌ Error: ' + e.message); }
                  }
                }}
                style={{ ...styles.btn('secondary'), justifyContent: 'center', fontSize: 13 }}
              >🚛 Loads</button>
              <button 
                onClick={async () => {
                  if (confirm('Clear all IFTA entries? This cannot be undone.')) {
                    try {
                      const db = await new Promise((resolve, reject) => {
                        const req = indexedDB.open('BalanceBooksTrucking');
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => reject(req.error);
                      });
                      const tx = db.transaction('ifta', 'readwrite');
                      await new Promise((resolve, reject) => {
                        const req = tx.objectStore('ifta').clear();
                        req.onsuccess = () => resolve();
                        req.onerror = () => reject(req.error);
                      });
                      setIftaData([]);
                      alert('✅ IFTA data cleared!');
                    } catch (e) { alert('❌ Error: ' + e.message); }
                  }
                }}
                style={{ ...styles.btn('secondary'), justifyContent: 'center', fontSize: 13 }}
              >📋 IFTA</button>
              <button 
                onClick={async () => {
                  if (confirm('Clear all EXPENSE entries? This cannot be undone.')) {
                    try {
                      const db = await new Promise((resolve, reject) => {
                        const req = indexedDB.open('BalanceBooksTrucking');
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => reject(req.error);
                      });
                      const tx = db.transaction('expenses', 'readwrite');
                      await new Promise((resolve, reject) => {
                        const req = tx.objectStore('expenses').clear();
                        req.onsuccess = () => resolve();
                        req.onerror = () => reject(req.error);
                      });
                      setExpenses([]);
                      alert('✅ Expense data cleared!');
                    } catch (e) { alert('❌ Error: ' + e.message); }
                  }
                }}
                style={{ ...styles.btn('secondary'), justifyContent: 'center', fontSize: 13 }}
              >💰 Expenses</button>
              <button 
                onClick={async () => {
                  if (confirm('Clear all PER DIEM entries? This cannot be undone.')) {
                    try {
                      const db = await new Promise((resolve, reject) => {
                        const req = indexedDB.open('BalanceBooksTrucking');
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => reject(req.error);
                      });
                      const tx = db.transaction('perdiem', 'readwrite');
                      await new Promise((resolve, reject) => {
                        const req = tx.objectStore('perdiem').clear();
                        req.onsuccess = () => resolve();
                        req.onerror = () => reject(req.error);
                      });
                      setPerDiemDays([]);
                      alert('✅ Per Diem data cleared!');
                    } catch (e) { alert('❌ Error: ' + e.message); }
                  }
                }}
                style={{ ...styles.btn('secondary'), justifyContent: 'center', fontSize: 13 }}
              >📅 Per Diem</button>
            </div>
          </div>

          {/* Danger Zone - Clear All */}
          <div style={{ 
            background: `${colors.red}20`, 
            border: `1px solid ${colors.red}40`,
            padding: 24, 
            borderRadius: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ color: colors.red, fontWeight: 700, marginBottom: 4 }}>⚠️ Clear All Data</div>
              <div style={{ color: colors.gray400, fontSize: 14 }}>Permanently delete all your data</div>
            </div>
            <button 
              onClick={async () => {
                if (confirm('Are you sure? This will permanently delete ALL your data!')) {
                  const result = await clearAllData();
                  if (result.success) {
                    setLoads([]);
                    setFuelEntries([]);
                    setIftaData([]);
                    setExpenses([]);
                    setPerDiemDays([]);
                    alert('All data has been cleared.');
                  } else {
                    alert('❌ Failed to clear data: ' + result.error);
                  }
                }
              }}
              style={styles.btn('danger')}
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      </div>
      
      {/* NEW: Auto-Backup & Notifications Card (matches Pro) */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>⚙️ Preferences</span>
        </div>
        
        <div style={{ display: 'grid', gap: 20 }}>
          <div style={{ 
            background: colors.navyDark, 
            padding: 24, 
            borderRadius: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ color: colors.white, fontWeight: 700, marginBottom: 4 }}>
                🔄 Auto-Backup (Daily)
              </div>
              <div style={{ color: colors.gray400, fontSize: 14 }}>
                Automatically download a backup once per day
                {lastBackupDate && (
                  <span style={{ marginLeft: 8, color: colors.teal }}>
                    • Last: {new Date(lastBackupDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <label style={{ 
              position: 'relative', 
              display: 'inline-block', 
              width: 56, 
              height: 28,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={autoBackupEnabled}
                onChange={(e) => setAutoBackupEnabled(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: autoBackupEnabled ? colors.green : colors.gray600,
                borderRadius: 28,
                transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  left: autoBackupEnabled ? 30 : 4,
                  bottom: 4,
                  width: 20,
                  height: 20,
                  background: colors.white,
                  borderRadius: '50%',
                  transition: '0.3s',
                }} />
              </span>
            </label>
          </div>

          <div style={{ 
            background: colors.navyDark, 
            padding: 24, 
            borderRadius: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ color: colors.white, fontWeight: 700, marginBottom: 4 }}>
                🔔 Notifications
              </div>
              <div style={{ color: colors.gray400, fontSize: 14 }}>
                Get reminders for important events
              </div>
            </div>
            <label style={{ 
              position: 'relative', 
              display: 'inline-block', 
              width: 56, 
              height: 28,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: notificationsEnabled ? colors.green : colors.gray600,
                borderRadius: 28,
                transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  left: notificationsEnabled ? 30 : 4,
                  bottom: 4,
                  width: 20,
                  height: 20,
                  background: colors.white,
                  borderRadius: '50%',
                  transition: '0.3s',
                }} />
              </span>
            </label>
          </div>

          <div style={{ 
            background: `${colors.teal}20`, 
            border: `1px solid ${colors.teal}40`,
            padding: 24, 
            borderRadius: 16,
          }}>
            <div style={{ color: colors.teal, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💾</span> Storage: IndexedDB
            </div>
            <div style={{ color: colors.gray300, fontSize: 14, lineHeight: 1.6 }}>
              <p>Your data is stored locally using IndexedDB - a robust browser database that handles larger datasets than localStorage.</p>
              <p style={{ marginTop: 8, color: colors.gray500 }}>
                Data stored: {loads.length} loads, {fuelEntries.length} fuel entries, {expenses.length} expenses, {perDiemDays.length} per diem days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PWA Install Section */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>📱 Install as Desktop App</span>
        </div>
        <div style={{ color: colors.gray300, lineHeight: 1.8 }}>
          {isInstalled ? (
            <div style={{ 
              background: `linear-gradient(135deg, ${colors.green}20, ${colors.teal}20)`,
              border: `2px solid ${colors.green}`,
              borderRadius: 12,
              padding: 20,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ color: colors.green, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                App Installed!
              </div>
              <div style={{ color: colors.gray400, fontSize: 14 }}>
                BalanceBooks Trucking is running as a desktop app with offline access.
              </div>
            </div>
          ) : installPrompt ? (
            <div>
              <div style={{ 
                background: `linear-gradient(135deg, ${colors.orange}20, ${colors.yellow}20)`,
                border: `2px solid ${colors.orange}`,
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📥</div>
                <div style={{ color: colors.orange, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                  Ready to Install!
                </div>
                <div style={{ color: colors.gray300, fontSize: 14, marginBottom: 16 }}>
                  Install BalanceBooks Trucking for offline access and a dedicated window.
                </div>
                <button
                  onClick={handleInstallClick}
                  style={{
                    background: `linear-gradient(135deg, ${colors.orange}, ${colors.orangeLight})`,
                    color: colors.white,
                    border: 'none',
                    padding: '16px 32px',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: `0 4px 20px ${colors.orange}50`,
                  }}
                >
                  ⬇️ Install App Now
                </button>
              </div>
              <p style={{ color: colors.gray500, fontSize: 14 }}>
                💡 Installing gives you: offline access, faster loading, and runs in its own window.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: 16 }}>To install BalanceBooks Trucking as a desktop application:</p>
              <ol style={{ paddingLeft: 24 }}>
                <li style={{ marginBottom: 12 }}>
                  <strong>Chrome/Edge:</strong> Click the install icon (⊕) in the address bar, or go to Menu → "Install BalanceBooks Trucking..."
                </li>
                <li style={{ marginBottom: 12 }}>
                  <strong>Safari (Mac):</strong> File → Add to Dock
                </li>
                <li style={{ marginBottom: 12 }}>
                  <strong>Firefox:</strong> This app works as a website - bookmark it for quick access
                </li>
              </ol>
              <p style={{ marginTop: 16, color: colors.gray500, fontSize: 14 }}>
                💡 Installing as an app gives you offline access and a dedicated window.
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>ℹ️ About</span>
        </div>
        <div style={{ color: colors.gray400 }}>
          <p><strong style={{ color: colors.white }}>BalanceBooks Trucking</strong></p>
          <p>Version {APP_VERSION} (IndexedDB)</p>
          <p style={{ marginTop: 16 }}>Privacy-first financial tracking for owner-operators.</p>
          <p>100% offline • Your data stays on your device</p>
          <p style={{ marginTop: 16, fontSize: 13 }}>
            Data stored: {loads.length} loads, {fuelEntries.length} fuel entries, {expenses.length} expenses
          </p>
        </div>
      </div>
    </>
  );



  // ============================================
  // TOOLS IMPORT MODAL (bb-trucking-tools integration)
  // ============================================
  
  const ToolsImportModal = () => {
    if (!showToolsImport || !toolsImportData) return null;

    const getImportSummary = () => {
      switch (toolsImportData.source) {
        case 'fuel-converter':
          return {
            icon: '⛽',
            title: 'Import Fuel Transactions',
            details: [
              (toolsImportData.rowCount || toolsImportData.data?.length || 0) + ' transactions',
              'Provider: ' + (toolsImportData.provider || 'Unknown'),
              'Total: ' + (toolsImportData.summary?.gallons || 0).toFixed(1) + ' gallons',
              'Amount: $' + (toolsImportData.summary?.amount || 0).toFixed(2)
            ]
          };
        case 'ifta-calculator':
          return {
            icon: '📋',
            title: 'Import IFTA Data',
            details: [
              (toolsImportData.quarter || 'Q?') + ' ' + (toolsImportData.year || ''),
              (toolsImportData.states?.length || 0) + ' states',
              (toolsImportData.summary?.totalMiles || 0).toLocaleString() + ' total miles'
            ]
          };
        case 'load-calculator':
          return {
            icon: '🚛',
            title: 'Import Load',
            details: [
              'Rate: $' + (toolsImportData.load?.lineHaul || 0).toLocaleString(),
              (toolsImportData.load?.loadedMiles || 0) + ' loaded miles',
              'Verdict: ' + (toolsImportData.load?.verdict || 'N/A')
            ]
          };
        case 'per-diem':
          return {
            icon: '📅',
            title: 'Import Per Diem',
            details: [
              (toolsImportData.days || 0) + ' days',
              '$' + (toolsImportData.rate || 80) + '/day',
              'Total: $' + ((toolsImportData.days || 0) * (toolsImportData.rate || 80)).toFixed(2)
            ]
          };
        default:
          return { icon: '📥', title: 'Import Data', details: ['Data from BalanceBooks Tools'] };
      }
    };

    const summary = getImportSummary();

    return (
      <div style={styles.modal} onClick={cancelToolsImport}>
        <div style={{ ...styles.modalContent, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{summary.icon}</div>
            <h2 style={{ color: colors.white, fontSize: 28, marginBottom: 8 }}>{summary.title}</h2>
            <p style={{ color: colors.gray400 }}>From BalanceBooks Tools</p>
          </div>

          <div style={{ background: colors.navyDark, borderRadius: 16, padding: 24, marginBottom: 32 }}>
            {summary.details.map((detail, i) => (
              <div key={i} style={{ 
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0',
                borderBottom: i < summary.details.length - 1 ? '1px solid ' + colors.gray700 : 'none'
              }}>
                <span style={{ color: colors.orange }}>•</span>
                <span style={{ color: colors.gray200 }}>{detail}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={cancelToolsImport} style={{ ...styles.btn('secondary'), flex: 1 }}>Cancel</button>
            <button onClick={handleToolsImport} style={{ ...styles.btn('primary'), flex: 1 }}>✅ Import Data</button>
          </div>
        </div>
      </div>
    );
  };

  // Tools Import Error Toast
  const ToolsImportError = () => {
    if (!toolsImportError) return null;
    return (
      <div style={{
        position: 'fixed', top: 24, right: 24, zIndex: 9999,
        background: colors.red + '20', border: '1px solid ' + colors.red,
        borderRadius: 12, padding: 16, maxWidth: 360,
        display: 'flex', alignItems: 'flex-start', gap: 12
      }}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: colors.red, fontWeight: 700, marginBottom: 4 }}>Import Failed</div>
          <div style={{ color: colors.gray300, fontSize: 14 }}>{toolsImportError}</div>
        </div>
        <button onClick={() => setToolsImportError(null)} style={{ 
          background: 'none', border: 'none', color: colors.gray400, cursor: 'pointer', fontSize: 18 
        }}>✕</button>
      </div>
    );
  };

  // ============================================
  // LOADING SCREEN (NEW - matches Pro)
  // ============================================
  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.gray900} 0%, ${colors.navyDark} 100%)`,
        color: colors.white
      }}>
        <BalanceBooksLogo size={80} />
        <div style={{ marginTop: 24, fontSize: 24, fontWeight: 700 }}>BalanceBooks Trucking</div>
        <div style={{ marginTop: 8, fontSize: 14, color: colors.orange }}>v{APP_VERSION}</div>
        <div style={{ marginTop: 16, color: colors.gray400 }}>Loading your data...</div>
        <div style={{
          marginTop: 24,
          width: 48,
          height: 48,
          border: `4px solid ${colors.gray700}`,
          borderTopColor: colors.orange,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.gray900} 0%, ${colors.navyDark} 100%)`,
        color: colors.white,
        padding: 40
      }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>⚠️</div>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Failed to Load Data</div>
        <div style={{ color: colors.gray400, marginBottom: 24, textAlign: 'center' }}>{loadError}</div>
        <button onClick={() => window.location.reload()} style={styles.btn('primary')}>
          🔄 Retry
        </button>
      </div>
    );
  }

  // ============ MAIN RENDER ============
  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={styles.sidebar(sidebarCollapsed)}>
        <div style={styles.logoContainer}>
          <BalanceBooksLogo size={44} />
          {!sidebarCollapsed && (
            <div>
              <div style={styles.logoText}>BalanceBooks</div>
              <div style={styles.logoSubtext}>Trucking</div>
            </div>
          )}
        </div>
        
        <nav style={styles.nav}>
          {navItems.map(item => (
            <div
              key={item.id}
              style={styles.navItem(activeTab === item.id)}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </div>
          ))}
        </nav>

        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {!sidebarCollapsed && (
            <div style={{ fontSize: 13, color: colors.gray500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: colors.green }}>🔒</span> 100% Offline
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: colors.teal }}>🛡️</span> Privacy-First
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main(sidebarCollapsed)}>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'loads' && renderLoads()}
        {activeTab === 'fuel' && renderFuel()}
        {activeTab === 'drivers' && renderDrivers()}
        {activeTab === 'driverpay' && renderDriverPay()}
        {activeTab === 'trucks' && renderTrucks()}
        {activeTab === 'ifta' && renderIFTA()}
        {activeTab === 'expenses' && renderExpenses()}
        {activeTab === 'perdiem' && renderPerDiem()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Modals */}
      {showLoadModal && <LoadModal />}
      {showFuelModal && <FuelModal />}
      {showFuelImport && <FuelImportModal />}
      {showIFTAModal && <IFTAModal />}
      {showExpenseModal && <ExpenseModal />}
      {showPerDiemModal && <PerDiemModal />}
      {showDriverModal && <DriverModal />}
      {showTruckModal && <TruckModal />}

      {/* Tools Import Modal */}
      <ToolsImportModal />
      <ToolsImportError />
    </div>
  );
}
