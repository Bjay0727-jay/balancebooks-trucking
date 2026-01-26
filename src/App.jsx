import React, { useState, useMemo, useEffect, useRef } from 'react';

// ============ CONSTANTS ============
const APP_VERSION = '1.3.0';

const colors = {
  navy: '#1e3a5f',
  navyDark: '#0f172a',
  orange: '#f97316',
  orangeLight: '#fb923c',
  teal: '#14b8a6',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#eab308',
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
  if (Math.abs(cents) >= 100) {
    return formatCurrency(dollars) + '/mi';
  }
  return cents.toFixed(1) + '¢/mi';
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

// Enhanced localStorage with error handling
const saveData = (key, data) => { 
  try { 
    localStorage.setItem('bbt_' + key, JSON.stringify(data)); 
    return true;
  } catch (e) {
    console.error('Failed to save data:', key, e);
    return false;
  }
};

const loadData = (key, defaultValue) => { 
  try { 
    const saved = localStorage.getItem('bbt_' + key); 
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log(`Loaded ${key}:`, parsed.length || 'object');
      return parsed;
    }
    return defaultValue; 
  } catch (e) {
    console.error('Failed to load data:', key, e);
    return defaultValue; 
  }
};

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
  const [dataLoaded, setDataLoaded] = useState(false);

  // ============ DATA STATE ============
  const [fuelEntries, setFuelEntries] = useState(() => loadData('fuel', []));
  const [loads, setLoads] = useState(() => loadData('loads', []));
  const [iftaData, setIftaData] = useState(() => loadData('ifta', []));
  const [expenses, setExpenses] = useState(() => loadData('expenses', []));
  const [perDiemDays, setPerDiemDays] = useState(() => loadData('perdiem', []));

  // Mark data as loaded on mount
  useEffect(() => {
    setDataLoaded(true);
    console.log('BalanceBooks Trucking v' + APP_VERSION + ' loaded');
    console.log('Loads:', loads.length, 'Fuel:', fuelEntries.length, 'Expenses:', expenses.length);
  }, []);

  // Persist data to localStorage
  useEffect(() => { if (dataLoaded) saveData('fuel', fuelEntries); }, [fuelEntries, dataLoaded]);
  useEffect(() => { if (dataLoaded) saveData('loads', loads); }, [loads, dataLoaded]);
  useEffect(() => { if (dataLoaded) saveData('ifta', iftaData); }, [iftaData, dataLoaded]);
  useEffect(() => { if (dataLoaded) saveData('expenses', expenses); }, [expenses, dataLoaded]);
  useEffect(() => { if (dataLoaded) saveData('perdiem', perDiemDays); }, [perDiemDays, dataLoaded]);

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

  // ============ NAV ITEMS ============
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'loads', label: 'Loads', icon: '🚛' },
    { id: 'fuel', label: 'Fuel Log', icon: '⛽' },
    { id: 'ifta', label: 'IFTA', icon: '📋' },
    { id: 'expenses', label: 'Expenses', icon: '💰' },
    { id: 'perdiem', label: 'Per Diem', icon: '📅' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // ============ LOAD MODAL ============
  const LoadModal = () => {
    const [form, setForm] = useState(editingLoad || {
      date: new Date().toISOString().split('T')[0],
      loadNumber: '',
      broker: '',
      rate: '',
      stops: [
        { type: 'origin', location: '', city: '', state: '', lat: null, lng: null },
        { type: 'destination', location: '', city: '', state: '', lat: null, lng: null },
      ],
      loadedMiles: '',
      manualMiles: false, // NEW: Flag for manual miles entry
      deadheadMiles: '',
      deadheadOrigin: '',
      deadheadOriginLat: null,
      deadheadOriginLng: null,
      fuelCost: '',
      otherExpenses: '',
      notes: '',
    });

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Broker / Customer</label>
                <input type="text" value={form.broker} onChange={e => setForm({...form, broker: e.target.value})} placeholder="e.g., C.H. Robinson" style={styles.input} />
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
      
      if (editingIFTA) {
        setIftaData(iftaData.map(d => d.id === editingIFTA.id ? iftaEntry : d));
      } else {
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
  const renderLoads = () => (
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
                <th style={styles.th}>Stops</th>
                <th style={styles.th}>Loaded</th>
                <th style={styles.th}>Deadhead</th>
                <th style={styles.th}>Rate</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...loads].reverse().map(load => {
                const origin = load.stops?.[0]?.location || 'N/A';
                const dest = load.stops?.[load.stops.length - 1]?.location || 'N/A';
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
                        <div style={{ color: colors.white }}>{origin.split(',')[0]}</div>
                        <div style={{ color: colors.gray500, fontSize: 13 }}>to {dest.split(',')[0]}</div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        background: colors.orange, 
                        padding: '4px 12px', 
                        borderRadius: 20, 
                        fontSize: 13,
                        fontWeight: 600
                      }}>
                        {load.stops?.length || 2}
                      </span>
                    </td>
                    <td style={styles.td}>{formatNumber(load.loadedMiles)} mi</td>
                    <td style={{ ...styles.td, color: load.deadheadMiles > 0 ? colors.red : colors.gray500 }}>
                      {formatNumber(load.deadheadMiles || 0)} mi
                    </td>
                    <td style={{ ...styles.td, color: colors.green, fontWeight: 700 }}>{formatCurrency(load.rate)}</td>
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
          <button style={styles.btn('primary')} onClick={() => setShowFuelModal(true)}>
            ➕ Add Fuel
          </button>
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
    // Calculate IFTA summary
    const iftaSummary = useMemo(() => {
      const avgMPG = stats.fleetMPG || 6.5; // Default to 6.5 if no data
      return iftaData.map(d => {
        const gallonsUsed = d.miles / avgMPG;
        const taxOwed = gallonsUsed * d.taxRate;
        const taxPaid = d.gallons * d.taxRate;
        return {
          ...d,
          gallonsUsed,
          taxOwed,
          taxPaid,
          netTax: taxOwed - taxPaid,
        };
      });
    }, [iftaData, stats.fleetMPG]);

    const totalNetTax = iftaSummary.reduce((s, d) => s + d.netTax, 0);

    // Export functions
    const exportIFTAPDF = () => {
      // Create a simple HTML report that can be printed to PDF
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

    return (
      <>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>IFTA Calculator</h1>
          <p style={styles.pageSubtitle}>Calculate your quarterly fuel tax obligations</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard(totalNetTax >= 0 ? colors.red : colors.green)}>
            <div style={styles.statIcon}>{totalNetTax >= 0 ? '💸' : '💰'}</div>
            <div style={styles.statValue(totalNetTax >= 0 ? colors.red : colors.green)}>
              {formatCurrency(Math.abs(totalNetTax))}
            </div>
            <div style={styles.statLabel}>{totalNetTax >= 0 ? 'Tax Owed' : 'Tax Credit'}</div>
          </div>
          <div style={styles.statCard(colors.teal)}>
            <div style={styles.statIcon}>⛽</div>
            <div style={styles.statValue(colors.teal)}>{stats.fleetMPG.toFixed(2)}</div>
            <div style={styles.statLabel}>Fleet MPG</div>
          </div>
        </div>

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
                ➕ Add Entry
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
                    </td>
                    <td style={styles.td}>{formatNumber(d.miles)}</td>
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
                          onClick={() => { setEditingIFTA(d); setShowIFTAModal(true); }}
                          style={{ ...styles.btn('secondary'), padding: '8px 12px', fontSize: 13 }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => setIftaData(iftaData.filter(i => i.id !== d.id))}
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
              <div style={{ fontSize: 48, marginBottom: 20 }}>📋</div>
              <p style={{ fontSize: 18 }}>No IFTA data yet</p>
              <p style={{ fontSize: 14 }}>Add your miles and fuel by state to calculate taxes</p>
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

  // ============ SETTINGS VIEW ============
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
              onClick={() => {
                const data = { fuelEntries, loads, iftaData, expenses, perDiemDays, exportDate: new Date().toISOString(), version: APP_VERSION };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `balancebooks-trucking-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      try {
                        const data = JSON.parse(ev.target?.result);
                        if (data.loads) setLoads(data.loads);
                        if (data.fuelEntries) setFuelEntries(data.fuelEntries);
                        if (data.iftaData) setIftaData(data.iftaData);
                        if (data.expenses) setExpenses(data.expenses);
                        if (data.perDiemDays) setPerDiemDays(data.perDiemDays);
                        alert('✅ Data imported successfully!');
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
              onClick={() => {
                if (confirm('Are you sure? This will permanently delete ALL your data!')) {
                  setLoads([]);
                  setFuelEntries([]);
                  setIftaData([]);
                  setExpenses([]);
                  setPerDiemDays([]);
                  localStorage.clear();
                  alert('All data has been cleared.');
                }
              }}
              style={styles.btn('danger')}
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      </div>

      {/* PWA Install Instructions */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>📱 Install as Desktop App</span>
        </div>
        <div style={{ color: colors.gray300, lineHeight: 1.8 }}>
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
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>ℹ️ About</span>
        </div>
        <div style={{ color: colors.gray400 }}>
          <p><strong style={{ color: colors.white }}>BalanceBooks Trucking</strong></p>
          <p>Version {APP_VERSION}</p>
          <p style={{ marginTop: 16 }}>Privacy-first financial tracking for owner-operators.</p>
          <p>100% offline • Your data stays on your device</p>
          <p style={{ marginTop: 16, fontSize: 13 }}>
            Data stored: {loads.length} loads, {fuelEntries.length} fuel entries, {expenses.length} expenses
          </p>
        </div>
      </div>
    </>
  );

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
        {activeTab === 'ifta' && renderIFTA()}
        {activeTab === 'expenses' && renderExpenses()}
        {activeTab === 'perdiem' && renderPerDiem()}
        {activeTab === 'settings' && renderSettings()}
      </main>

      {/* Modals */}
      {showLoadModal && <LoadModal />}
      {showFuelModal && <FuelModal />}
      {showIFTAModal && <IFTAModal />}
      {showExpenseModal && <ExpenseModal />}
      {showPerDiemModal && <PerDiemModal />}
    </div>
  );
}
