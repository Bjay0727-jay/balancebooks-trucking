import { useState, useMemo } from 'react';

// ============================================================================
// BALANCEBOOKS FOR TRUCKING - Owner-Operator Financial Management
// ============================================================================

// Design System Colors
const colors = {
  navyDark: '#0f172a',
  navy: '#1e3a5f',
  orange: '#f97316',
  orangeDark: '#ea580c',
  orangeLight: '#fdba74',
  teal: '#14b8a6',
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray800: '#1e293b',
  gray900: '#0f172a',
  green: '#22c55e',
  red: '#ef4444',
};

// IFTA Tax Rates by State (2025)
const iftaTaxRates = {
  AL: 0.28, AZ: 0.26, AR: 0.245, CA: 0.68, CO: 0.205, CT: 0.445, DE: 0.22,
  FL: 0.35, GA: 0.312, ID: 0.32, IL: 0.467, IN: 0.54, IA: 0.305, KS: 0.24,
  KY: 0.246, LA: 0.20, ME: 0.312, MD: 0.365, MA: 0.24, MI: 0.302, MN: 0.285,
  MS: 0.184, MO: 0.195, MT: 0.2975, NE: 0.245, NV: 0.23, NH: 0.222, NJ: 0.414,
  NM: 0.187, NY: 0.3215, NC: 0.38, ND: 0.23, OH: 0.47, OK: 0.19, OR: 0.38,
  PA: 0.576, RI: 0.35, SC: 0.28, SD: 0.28, TN: 0.27, TX: 0.20, UT: 0.315,
  VT: 0.31, VA: 0.262, WA: 0.494, WV: 0.357, WI: 0.309, WY: 0.24, DC: 0.235
};

// Format currency
const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// Format number with commas
const formatNumber = (value, decimals = 0) => {
  const num = parseFloat(value) || 0;
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ========== FUEL LOG STATE ==========
  const [fuelEntries, setFuelEntries] = useState([
    { id: 1, date: '2025-01-05', state: 'TX', location: 'Dallas - Loves #405', gallons: 180, pricePerGal: 3.45, odometer: 125000 },
    { id: 2, date: '2025-01-08', state: 'OK', location: 'OKC - Pilot #892', gallons: 165, pricePerGal: 3.38, odometer: 126100 },
    { id: 3, date: '2025-01-12', state: 'AR', location: 'Little Rock - TA', gallons: 175, pricePerGal: 3.52, odometer: 127200 },
    { id: 4, date: '2025-01-15', state: 'TN', location: 'Memphis - Flying J', gallons: 190, pricePerGal: 3.41, odometer: 128400 },
    { id: 5, date: '2025-01-18', state: 'GA', location: 'Atlanta - Loves #612', gallons: 170, pricePerGal: 3.48, odometer: 129500 },
  ]);

  // ========== LOAD TRACKER STATE ==========
  const [loads, setLoads] = useState([
    { id: 1, loadNum: '2025-001', date: '2025-01-05', origin: 'Dallas, TX', dest: 'Atlanta, GA', loadedMiles: 802, deadhead: 45, lineHaul: 2800, fsc: 320, other: 150, fuelCost: 624, tolls: 45.80, scales: 12, parking: 35, lumper: 0 },
    { id: 2, loadNum: '2025-002', date: '2025-01-08', origin: 'Atlanta, GA', dest: 'Miami, FL', loadedMiles: 660, deadhead: 0, lineHaul: 2200, fsc: 264, other: 100, fuelCost: 512, tolls: 32.50, scales: 12, parking: 25, lumper: 50 },
    { id: 3, loadNum: '2025-003', date: '2025-01-11', origin: 'Miami, FL', dest: 'Houston, TX', loadedMiles: 1187, deadhead: 30, lineHaul: 3800, fsc: 475, other: 200, fuelCost: 892, tolls: 78.20, scales: 18, parking: 45, lumper: 0 },
    { id: 4, loadNum: '2025-004', date: '2025-01-15', origin: 'Houston, TX', dest: 'Phoenix, AZ', loadedMiles: 1176, deadhead: 85, lineHaul: 3500, fsc: 420, other: 175, fuelCost: 875, tolls: 65.40, scales: 15, parking: 40, lumper: 75 },
    { id: 5, loadNum: '2025-005', date: '2025-01-19', origin: 'Phoenix, AZ', dest: 'Los Angeles, CA', loadedMiles: 372, deadhead: 0, lineHaul: 1400, fsc: 186, other: 75, fuelCost: 289, tolls: 22.00, scales: 12, parking: 20, lumper: 0 },
  ]);

  // ========== COST PER MILE STATE ==========
  const [cpmData, setCpmData] = useState({
    totalMiles: 8234,
    fuel: 3892,
    maintenance: 1245,
    insurance: 1850,
    truckPayment: 2100,
    tolls: 456,
    permits: 320,
    parking: 180,
    communication: 150,
    lumper: 200,
    scales: 75,
    other: 232
  });

  // ========== PER DIEM STATE ==========
  const [perDiemData, setPerDiemData] = useState([
    { month: 'January', days: 24 },
    { month: 'February', days: 22 },
    { month: 'March', days: 26 },
    { month: 'April', days: 23 },
    { month: 'May', days: 25 },
    { month: 'June', days: 24 },
    { month: 'July', days: 26 },
    { month: 'August', days: 25 },
    { month: 'September', days: 23 },
    { month: 'October', days: 26 },
    { month: 'November', days: 22 },
    { month: 'December', days: 20 },
  ]);

  // ========== IFTA STATE ==========
  const [iftaQuarter, setIftaQuarter] = useState('Q1 2025');
  const [iftaData, setIftaData] = useState([
    { state: 'TX', miles: 8200, fuelPurchased: 1450 },
    { state: 'OK', miles: 3100, fuelPurchased: 320 },
    { state: 'AR', miles: 2800, fuelPurchased: 280 },
    { state: 'TN', miles: 4500, fuelPurchased: 620 },
    { state: 'GA', miles: 5200, fuelPurchased: 780 },
    { state: 'LA', miles: 3800, fuelPurchased: 500 },
    { state: 'MS', miles: 2100, fuelPurchased: 400 },
    { state: 'AL', miles: 2750, fuelPurchased: 500 },
  ]);

  // ========== MODAL STATES ==========
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showIftaModal, setShowIftaModal] = useState(false);
  const [editingFuel, setEditingFuel] = useState(null);
  const [editingLoad, setEditingLoad] = useState(null);

  // ========== CALCULATED STATISTICS ==========
  const stats = useMemo(() => {
    // Fuel stats
    const totalFuelGallons = fuelEntries.reduce((sum, e) => sum + e.gallons, 0);
    const totalFuelCost = fuelEntries.reduce((sum, e) => sum + (e.gallons * e.pricePerGal), 0);
    const avgFuelPrice = totalFuelCost / totalFuelGallons || 0;
    
    // MPG calculation
    const sortedFuel = [...fuelEntries].sort((a, b) => a.odometer - b.odometer);
    let totalMilesTraveled = 0;
    let totalGallonsForMPG = 0;
    for (let i = 1; i < sortedFuel.length; i++) {
      totalMilesTraveled += sortedFuel[i].odometer - sortedFuel[i-1].odometer;
      totalGallonsForMPG += sortedFuel[i-1].gallons;
    }
    const avgMPG = totalMilesTraveled / totalGallonsForMPG || 0;

    // Load stats
    const totalRevenue = loads.reduce((sum, l) => sum + l.lineHaul + l.fsc + l.other, 0);
    const totalExpenses = loads.reduce((sum, l) => sum + l.fuelCost + l.tolls + l.scales + l.parking + l.lumper, 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalLoadedMiles = loads.reduce((sum, l) => sum + l.loadedMiles, 0);
    const totalDeadhead = loads.reduce((sum, l) => sum + l.deadhead, 0);
    const profitPerMile = netProfit / (totalLoadedMiles + totalDeadhead) || 0;

    // CPM stats
    const totalOperatingCosts = cpmData.fuel + cpmData.maintenance + cpmData.insurance + 
      cpmData.truckPayment + cpmData.tolls + cpmData.permits + cpmData.parking + 
      cpmData.communication + cpmData.lumper + cpmData.scales + cpmData.other;
    const cpm = totalOperatingCosts / cpmData.totalMiles || 0;

    // Per Diem stats
    const totalDaysOTR = perDiemData.reduce((sum, m) => sum + m.days, 0);
    const perDiemRate = 69; // 2025 IRS rate
    const deductibleRate = perDiemRate * 0.80; // 80% deductible
    const totalPerDiem = totalDaysOTR * deductibleRate;
    const estimatedTaxSavings = totalPerDiem * 0.25; // 25% tax bracket estimate

    // IFTA stats
    const totalIFTAMiles = iftaData.reduce((sum, s) => sum + s.miles, 0);
    const totalIFTAFuel = iftaData.reduce((sum, s) => sum + s.fuelPurchased, 0);
    const fleetMPG = totalIFTAMiles / totalIFTAFuel || avgMPG || 6.5;

    return {
      totalFuelGallons, totalFuelCost, avgFuelPrice, avgMPG,
      totalRevenue, totalExpenses, netProfit, totalLoadedMiles, totalDeadhead, profitPerMile,
      totalOperatingCosts, cpm,
      totalDaysOTR, totalPerDiem, estimatedTaxSavings, perDiemRate, deductibleRate,
      totalIFTAMiles, totalIFTAFuel, fleetMPG,
      completedLoads: loads.length
    };
  }, [fuelEntries, loads, cpmData, perDiemData, iftaData]);

  // ========== NAVIGATION ITEMS ==========
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'fuel', icon: '⛽', label: 'Fuel Log' },
    { id: 'loads', icon: '📦', label: 'Loads' },
    { id: 'cpm', icon: '🧮', label: 'Cost Per Mile' },
    { id: 'ifta', icon: '📋', label: 'IFTA Report' },
    { id: 'perdiem', icon: '💵', label: 'Per Diem' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  // ========== STYLES ==========
  const styles = {
    app: {
      display: 'flex',
      minHeight: '100vh',
      background: colors.navyDark,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    sidebar: {
      width: sidebarCollapsed ? 70 : 240,
      background: colors.gray800,
      borderRight: `1px solid rgba(255,255,255,0.1)`,
      padding: '20px 0',
      transition: 'width 0.3s ease',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    },
    logo: {
      padding: sidebarCollapsed ? '0 10px 20px' : '0 20px 20px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
    },
    logoIcon: {
      fontSize: 28,
      flexShrink: 0,
    },
    logoText: {
      fontSize: 18,
      fontWeight: 700,
      color: colors.white,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    nav: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      flex: 1,
    },
    navItem: (isActive) => ({
      padding: sidebarCollapsed ? '14px 0' : '12px 20px',
      color: isActive ? colors.orange : colors.gray400,
      fontSize: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
      gap: 12,
      cursor: 'pointer',
      borderLeft: isActive ? `3px solid ${colors.orange}` : '3px solid transparent',
      background: isActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
      transition: 'all 0.2s ease',
    }),
    main: {
      flex: 1,
      padding: 24,
      overflow: 'auto',
      minHeight: '100vh',
    },
    pageHeader: {
      marginBottom: 24,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: 700,
      color: colors.white,
      marginBottom: 8,
    },
    pageSubtitle: {
      fontSize: 14,
      color: colors.gray400,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 20,
      marginBottom: 24,
    },
    statCard: (accent = colors.white) => ({
      background: colors.gray800,
      borderRadius: 16,
      padding: 20,
      borderLeft: `4px solid ${accent}`,
    }),
    statIcon: {
      fontSize: 24,
      marginBottom: 12,
    },
    statValue: (color = colors.white) => ({
      fontSize: 28,
      fontWeight: 800,
      color: color,
      marginBottom: 4,
    }),
    statLabel: {
      fontSize: 13,
      color: colors.gray400,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    card: {
      background: colors.gray800,
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 600,
      color: colors.white,
      marginBottom: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      padding: '12px 16px',
      color: colors.gray400,
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderBottom: `1px solid rgba(255,255,255,0.1)`,
    },
    td: {
      padding: '14px 16px',
      color: colors.gray300,
      fontSize: 14,
      borderBottom: `1px solid rgba(255,255,255,0.05)`,
    },
    btn: (variant = 'primary') => ({
      padding: '10px 20px',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      transition: 'all 0.2s ease',
      background: variant === 'primary' 
        ? `linear-gradient(135deg, ${colors.orange}, ${colors.orangeDark})` 
        : 'rgba(255,255,255,0.1)',
      color: colors.white,
    }),
    modal: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      background: colors.gray800,
      borderRadius: 20,
      padding: 32,
      width: '90%',
      maxWidth: 600,
      maxHeight: '90vh',
      overflow: 'auto',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      borderRadius: 8,
      border: `1px solid rgba(255,255,255,0.2)`,
      background: colors.navyDark,
      color: colors.white,
      fontSize: 14,
      outline: 'none',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 16,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      display: 'block',
      color: colors.gray400,
      fontSize: 12,
      fontWeight: 500,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    progressBar: {
      width: '100%',
      height: 8,
      background: 'rgba(255,255,255,0.1)',
      borderRadius: 4,
      overflow: 'hidden',
    },
  };

  // ========== RENDER FUNCTIONS ==========
  
  const renderDashboard = () => (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Dashboard</h1>
        <p style={styles.pageSubtitle}>Overview of your trucking business performance</p>
      </div>

      {/* Key Metrics */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard(colors.green)}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statValue(colors.green)}>{formatCurrency(stats.netProfit)}</div>
          <div style={styles.statLabel}>Net Profit (YTD)</div>
        </div>
        <div style={styles.statCard(colors.orange)}>
          <div style={styles.statIcon}>🛣️</div>
          <div style={styles.statValue()}>{formatNumber(stats.totalLoadedMiles)}</div>
          <div style={styles.statLabel}>Loaded Miles</div>
        </div>
        <div style={styles.statCard(colors.teal)}>
          <div style={styles.statIcon}>📦</div>
          <div style={styles.statValue()}>{stats.completedLoads}</div>
          <div style={styles.statLabel}>Completed Loads</div>
        </div>
        <div style={styles.statCard(colors.green)}>
          <div style={styles.statIcon}>📈</div>
          <div style={styles.statValue(colors.green)}>{formatCurrency(stats.profitPerMile)}</div>
          <div style={styles.statLabel}>Profit Per Mile</div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard()}>
          <div style={styles.statIcon}>⛽</div>
          <div style={styles.statValue()}>{stats.avgMPG.toFixed(1)}</div>
          <div style={styles.statLabel}>Avg MPG</div>
        </div>
        <div style={styles.statCard()}>
          <div style={styles.statIcon}>🧮</div>
          <div style={styles.statValue(colors.orange)}>{formatCurrency(stats.cpm)}</div>
          <div style={styles.statLabel}>Cost Per Mile</div>
        </div>
        <div style={styles.statCard()}>
          <div style={styles.statIcon}>⛽</div>
          <div style={styles.statValue()}>{formatCurrency(stats.avgFuelPrice)}</div>
          <div style={styles.statLabel}>Avg Fuel Price</div>
        </div>
        <div style={styles.statCard()}>
          <div style={styles.statIcon}>📅</div>
          <div style={styles.statValue()}>{stats.totalDaysOTR}</div>
          <div style={styles.statLabel}>Days OTR (YTD)</div>
        </div>
      </div>

      {/* Recent Loads */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>📦 Recent Loads</span>
          <button style={styles.btn('secondary')} onClick={() => setActiveTab('loads')}>
            View All →
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Load #</th>
                <th style={styles.th}>Route</th>
                <th style={styles.th}>Miles</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Revenue</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Expenses</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {loads.slice(-5).reverse().map(load => {
                const rev = load.lineHaul + load.fsc + load.other;
                const exp = load.fuelCost + load.tolls + load.scales + load.parking + load.lumper;
                const profit = rev - exp;
                return (
                  <tr key={load.id}>
                    <td style={styles.td}>{load.loadNum}</td>
                    <td style={styles.td}>{load.origin} → {load.dest}</td>
                    <td style={styles.td}>{formatNumber(load.loadedMiles)}</td>
                    <td style={{ ...styles.td, textAlign: 'right', color: colors.green }}>{formatCurrency(rev)}</td>
                    <td style={{ ...styles.td, textAlign: 'right', color: colors.orange }}>{formatCurrency(exp)}</td>
                    <td style={{ ...styles.td, textAlign: 'right', color: profit >= 0 ? colors.green : colors.red, fontWeight: 600 }}>
                      {formatCurrency(profit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <button style={{ ...styles.btn('secondary'), justifyContent: 'center', padding: 20 }} onClick={() => { setEditingFuel(null); setShowFuelModal(true); }}>
          ⛽ Log Fuel Purchase
        </button>
        <button style={{ ...styles.btn('secondary'), justifyContent: 'center', padding: 20 }} onClick={() => { setEditingLoad(null); setShowLoadModal(true); }}>
          📦 Add New Load
        </button>
        <button style={{ ...styles.btn('secondary'), justifyContent: 'center', padding: 20 }} onClick={() => setActiveTab('ifta')}>
          📋 Generate IFTA Report
        </button>
        <button style={{ ...styles.btn('secondary'), justifyContent: 'center', padding: 20 }} onClick={() => setActiveTab('cpm')}>
          🧮 Calculate Cost Per Mile
        </button>
      </div>
    </div>
  );

  const renderFuelLog = () => (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>⛽ Fuel Log</h1>
        <p style={styles.pageSubtitle}>Track fuel purchases for IFTA compliance and expense tracking</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard(colors.orange)}>
          <div style={styles.statIcon}>⛽</div>
          <div style={styles.statValue()}>{formatNumber(stats.totalFuelGallons, 0)}</div>
          <div style={styles.statLabel}>Total Gallons</div>
        </div>
        <div style={styles.statCard(colors.orange)}>
          <div style={styles.statIcon}>💵</div>
          <div style={styles.statValue()}>{formatCurrency(stats.totalFuelCost)}</div>
          <div style={styles.statLabel}>Total Cost</div>
        </div>
        <div style={styles.statCard()}>
          <div style={styles.statIcon}>💲</div>
          <div style={styles.statValue()}>{formatCurrency(stats.avgFuelPrice)}</div>
          <div style={styles.statLabel}>Avg Price/Gallon</div>
        </div>
        <div style={styles.statCard(colors.teal)}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue()}>{stats.avgMPG.toFixed(1)}</div>
          <div style={styles.statLabel}>Average MPG</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>Fuel Purchase History</span>
          <button style={styles.btn('primary')} onClick={() => { setEditingFuel(null); setShowFuelModal(true); }}>
            + Add Entry
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>State</th>
                <th style={styles.th}>Location</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Gallons</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Price/Gal</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Odometer</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fuelEntries.map((entry, idx) => {
                const prevEntry = fuelEntries[idx - 1];
                const milesSince = prevEntry ? entry.odometer - prevEntry.odometer : null;
                const mpg = milesSince && prevEntry ? milesSince / prevEntry.gallons : null;
                return (
                  <tr key={entry.id}>
                    <td style={styles.td}>{entry.date}</td>
                    <td style={styles.td}><span style={{ background: colors.orange, padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{entry.state}</span></td>
                    <td style={styles.td}>{entry.location}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{formatNumber(entry.gallons, 1)}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(entry.pricePerGal)}</td>
                    <td style={{ ...styles.td, textAlign: 'right', color: colors.orange }}>{formatCurrency(entry.gallons * entry.pricePerGal)}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{formatNumber(entry.odometer)}</td>
                    <td style={styles.td}>
                      <button style={{ ...styles.btn('secondary'), padding: '6px 12px', marginRight: 8 }} onClick={() => { setEditingFuel(entry); setShowFuelModal(true); }}>Edit</button>
                      <button style={{ ...styles.btn('secondary'), padding: '6px 12px', background: 'rgba(239,68,68,0.2)' }} onClick={() => setFuelEntries(fuelEntries.filter(e => e.id !== entry.id))}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLoads = () => (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>📦 Load Tracker</h1>
        <p style={styles.pageSubtitle}>Track load profitability and analyze your hauling performance</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard(colors.green)}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statValue(colors.green)}>{formatCurrency(stats.totalRevenue)}</div>
          <div style={styles.statLabel}>Total Revenue</div>
        </div>
        <div style={styles.statCard(colors.orange)}>
          <div style={styles.statIcon}>📉</div>
          <div style={styles.statValue(colors.orange)}>{formatCurrency(stats.totalExpenses)}</div>
          <div style={styles.statLabel}>Total Expenses</div>
        </div>
        <div style={styles.statCard(colors.green)}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue(colors.green)}>{formatCurrency(stats.netProfit)}</div>
          <div style={styles.statLabel}>Net Profit</div>
        </div>
        <div style={styles.statCard()}>
          <div style={styles.statIcon}>🛣️</div>
          <div style={styles.statValue()}>{formatNumber(stats.totalLoadedMiles + stats.totalDeadhead)}</div>
          <div style={styles.statLabel}>Total Miles</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>Load History</span>
          <button style={styles.btn('primary')} onClick={() => { setEditingLoad(null); setShowLoadModal(true); }}>
            + Add Load
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
          {loads.map(load => {
            const rev = load.lineHaul + load.fsc + load.other;
            const exp = load.fuelCost + load.tolls + load.scales + load.parking + load.lumper;
            const profit = rev - exp;
            const totalMiles = load.loadedMiles + load.deadhead;
            const ppm = profit / totalMiles;
            return (
              <div key={load.id} style={{ background: colors.navyDark, borderRadius: 12, padding: 20, border: `1px solid rgba(255,255,255,0.1)` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: colors.white }}>{load.loadNum}</div>
                    <div style={{ fontSize: 13, color: colors.gray400 }}>{load.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: profit >= 0 ? colors.green : colors.red }}>
                      {formatCurrency(profit)}
                    </div>
                    <div style={{ fontSize: 12, color: colors.gray400 }}>Net Profit</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: colors.gray300, marginBottom: 16 }}>
                  {load.origin} → {load.dest}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <div style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colors.green }}>{formatCurrency(rev)}</div>
                    <div style={{ fontSize: 11, color: colors.gray400 }}>Revenue</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colors.orange }}>{formatCurrency(exp)}</div>
                    <div style={{ fontSize: 11, color: colors.gray400 }}>Expenses</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colors.white }}>{formatNumber(totalMiles)}</div>
                    <div style={{ fontSize: 11, color: colors.gray400 }}>Miles</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colors.white }}>{formatNumber(load.loadedMiles)}</div>
                    <div style={{ fontSize: 11, color: colors.gray400 }}>Loaded</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colors.gray400 }}>{formatNumber(load.deadhead)}</div>
                    <div style={{ fontSize: 11, color: colors.gray400 }}>Deadhead</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: ppm >= 0 ? colors.green : colors.red }}>{formatCurrency(ppm)}</div>
                    <div style={{ fontSize: 11, color: colors.gray400 }}>$/Mile</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button style={{ ...styles.btn('secondary'), flex: 1, justifyContent: 'center', padding: '8px 12px' }} onClick={() => { setEditingLoad(load); setShowLoadModal(true); }}>Edit</button>
                  <button style={{ ...styles.btn('secondary'), flex: 1, justifyContent: 'center', padding: '8px 12px', background: 'rgba(239,68,68,0.2)' }} onClick={() => setLoads(loads.filter(l => l.id !== load.id))}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCPM = () => {
    const categories = [
      { key: 'fuel', label: 'Fuel', icon: '⛽', desc: 'Diesel fuel costs' },
      { key: 'maintenance', label: 'Maintenance/Repairs', icon: '🔧', desc: 'Oil, tires, repairs' },
      { key: 'insurance', label: 'Insurance', icon: '🛡️', desc: 'Truck insurance' },
      { key: 'truckPayment', label: 'Truck Payment', icon: '🚛', desc: 'Loan/lease payment' },
      { key: 'tolls', label: 'Tolls', icon: '🛣️', desc: 'Highway tolls' },
      { key: 'permits', label: 'Permits & Fees', icon: '📄', desc: 'IFTA, IRP, etc.' },
      { key: 'parking', label: 'Parking', icon: '🅿️', desc: 'Truck stops' },
      { key: 'communication', label: 'Communication', icon: '📱', desc: 'Phone, ELD' },
      { key: 'lumper', label: 'Lumper Fees', icon: '📦', desc: 'Loading/unloading' },
      { key: 'scales', label: 'Scales', icon: '⚖️', desc: 'CAT scales' },
      { key: 'other', label: 'Other', icon: '💳', desc: 'Misc expenses' },
    ];

    const handleChange = (key, value) => {
      setCpmData({ ...cpmData, [key]: parseFloat(value) || 0 });
    };

    return (
      <div>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>🧮 Cost Per Mile Calculator</h1>
          <p style={styles.pageSubtitle}>Calculate your true operating cost per mile</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard(colors.orange), gridColumn: 'span 2' }}>
            <div style={styles.statIcon}>🚛</div>
            <div style={styles.statValue(colors.orange)}>{formatCurrency(stats.cpm)}</div>
            <div style={styles.statLabel}>Your Cost Per Mile</div>
          </div>
          <div style={styles.statCard()}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statValue()}>{formatCurrency(stats.totalOperatingCosts)}</div>
            <div style={styles.statLabel}>Total Monthly Costs</div>
          </div>
          <div style={styles.statCard(colors.green)}>
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statValue(colors.green)}>{formatCurrency(stats.cpm * 1.2)}</div>
            <div style={styles.statLabel}>Break-Even Rate (+20%)</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Monthly Operating Costs</div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Total Miles This Month</label>
            <input
              type="number"
              value={cpmData.totalMiles}
              onChange={(e) => handleChange('totalMiles', e.target.value)}
              style={{ ...styles.input, maxWidth: 200 }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 24 }}>
            {categories.map(cat => {
              const value = cpmData[cat.key];
              const cpmVal = value / cpmData.totalMiles || 0;
              const pctTotal = (value / stats.totalOperatingCosts) * 100 || 0;
              return (
                <div key={cat.key} style={{ background: colors.navyDark, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 24 }}>{cat.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: colors.white, fontWeight: 600 }}>{cat.label}</div>
                      <div style={{ color: colors.gray500, fontSize: 12 }}>{cat.desc}</div>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleChange(cat.key, e.target.value)}
                    style={{ ...styles.input, marginBottom: 12 }}
                    placeholder="0.00"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: colors.gray400 }}>{formatCurrency(cpmVal)}/mi</span>
                    <span style={{ color: colors.orange }}>{pctTotal.toFixed(1)}% of total</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ width: `${Math.min(pctTotal, 100)}%`, height: '100%', background: colors.orange, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...styles.card, background: `linear-gradient(135deg, ${colors.navy}, ${colors.navyDark})` }}>
          <h3 style={{ color: colors.white, marginBottom: 16 }}>💡 What This Means</h3>
          <p style={{ color: colors.gray300, lineHeight: 1.8 }}>
            Your cost per mile of <strong style={{ color: colors.orange }}>{formatCurrency(stats.cpm)}</strong> means you need to 
            charge at least this amount per mile just to break even. To make a profit, aim for rates 
            of <strong style={{ color: colors.green }}>{formatCurrency(stats.cpm * 1.2)}</strong> per mile (20% profit margin) 
            or higher. Any load paying less than {formatCurrency(stats.cpm)}/mile is losing you money!
          </p>
        </div>
      </div>
    );
  };

  const renderIFTA = () => {
    const calculateIFTA = (state, miles, fuelPurchased) => {
      const taxableGallons = miles / stats.fleetMPG;
      const netGallons = taxableGallons - fuelPurchased;
      const taxRate = iftaTaxRates[state] || 0.25;
      const taxDue = netGallons * taxRate;
      return { taxableGallons, netGallons, taxRate, taxDue };
    };

    const totalTaxDue = iftaData.reduce((sum, row) => {
      const calc = calculateIFTA(row.state, row.miles, row.fuelPurchased);
      return sum + calc.taxDue;
    }, 0);

    const handleIftaChange = (index, field, value) => {
      const newData = [...iftaData];
      newData[index] = { ...newData[index], [field]: parseFloat(value) || 0 };
      setIftaData(newData);
    };

    const addState = (state) => {
      if (state && !iftaData.find(d => d.state === state)) {
        setIftaData([...iftaData, { state, miles: 0, fuelPurchased: 0 }]);
      }
      setShowIftaModal(false);
    };

    const removeState = (state) => {
      setIftaData(iftaData.filter(d => d.state !== state));
    };

    return (
      <div>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>📋 IFTA Report</h1>
          <p style={styles.pageSubtitle}>International Fuel Tax Agreement quarterly reporting</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard()}>
            <div style={styles.statIcon}>📅</div>
            <div style={styles.statValue()}>{iftaQuarter}</div>
            <div style={styles.statLabel}>Reporting Quarter</div>
          </div>
          <div style={styles.statCard()}>
            <div style={styles.statIcon}>🛣️</div>
            <div style={styles.statValue()}>{formatNumber(stats.totalIFTAMiles)}</div>
            <div style={styles.statLabel}>Total Miles</div>
          </div>
          <div style={styles.statCard()}>
            <div style={styles.statIcon}>⛽</div>
            <div style={styles.statValue()}>{formatNumber(stats.totalIFTAFuel)}</div>
            <div style={styles.statLabel}>Total Gallons</div>
          </div>
          <div style={styles.statCard(totalTaxDue >= 0 ? colors.red : colors.green)}>
            <div style={styles.statIcon}>💵</div>
            <div style={styles.statValue(totalTaxDue >= 0 ? colors.red : colors.green)}>
              {totalTaxDue >= 0 ? formatCurrency(totalTaxDue) : `(${formatCurrency(Math.abs(totalTaxDue))})`}
            </div>
            <div style={styles.statLabel}>{totalTaxDue >= 0 ? 'Tax Due' : 'Tax Credit'}</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>Fleet MPG: {stats.fleetMPG.toFixed(2)}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={iftaQuarter}
                onChange={(e) => setIftaQuarter(e.target.value)}
                style={{ ...styles.input, width: 'auto' }}
              >
                <option value="Q1 2025">Q1 2025</option>
                <option value="Q2 2025">Q2 2025</option>
                <option value="Q3 2025">Q3 2025</option>
                <option value="Q4 2025">Q4 2025</option>
              </select>
              <button style={styles.btn('primary')} onClick={() => setShowIftaModal(true)}>
                + Add State
              </button>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>State</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Miles</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Taxable Gal</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Fuel Purchased</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Net Gallons</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Tax Rate</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Tax Due/(Credit)</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {iftaData.map((row, idx) => {
                  const calc = calculateIFTA(row.state, row.miles, row.fuelPurchased);
                  return (
                    <tr key={row.state}>
                      <td style={styles.td}>
                        <span style={{ background: colors.orange, padding: '4px 10px', borderRadius: 4, fontWeight: 600 }}>{row.state}</span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <input
                          type="number"
                          value={row.miles}
                          onChange={(e) => handleIftaChange(idx, 'miles', e.target.value)}
                          style={{ ...styles.input, width: 100, textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', color: colors.gray400 }}>{formatNumber(calc.taxableGallons, 2)}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <input
                          type="number"
                          value={row.fuelPurchased}
                          onChange={(e) => handleIftaChange(idx, 'fuelPurchased', e.target.value)}
                          style={{ ...styles.input, width: 100, textAlign: 'right' }}
                        />
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', color: calc.netGallons >= 0 ? colors.orange : colors.teal }}>
                        {formatNumber(calc.netGallons, 2)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>${calc.taxRate.toFixed(3)}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600, color: calc.taxDue >= 0 ? colors.red : colors.green }}>
                        {calc.taxDue >= 0 ? formatCurrency(calc.taxDue) : `(${formatCurrency(Math.abs(calc.taxDue))})`}
                      </td>
                      <td style={styles.td}>
                        <button style={{ ...styles.btn('secondary'), padding: '6px 12px', background: 'rgba(239,68,68,0.2)' }} onClick={() => removeState(row.state)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <td style={{ ...styles.td, fontWeight: 700, color: colors.white }}>TOTAL</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: colors.white }}>{formatNumber(stats.totalIFTAMiles)}</td>
                  <td style={styles.td}></td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: colors.white }}>{formatNumber(stats.totalIFTAFuel)}</td>
                  <td colSpan="2" style={styles.td}></td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, fontSize: 18, color: totalTaxDue >= 0 ? colors.red : colors.green }}>
                    {totalTaxDue >= 0 ? formatCurrency(totalTaxDue) : `(${formatCurrency(Math.abs(totalTaxDue))})`}
                  </td>
                  <td style={styles.td}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button style={styles.btn('primary')}>📄 Export Report</button>
          <button style={styles.btn('secondary')}>🖨️ Print</button>
        </div>
      </div>
    );
  };

  const renderPerDiem = () => {
    const handleDaysChange = (index, value) => {
      const newData = [...perDiemData];
      newData[index] = { ...newData[index], days: parseInt(value) || 0 };
      setPerDiemData(newData);
    };

    return (
      <div>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>💵 Per Diem Tracker 2025</h1>
          <p style={styles.pageSubtitle}>IRS Rate: ${stats.perDiemRate}/day (80% deductible = ${stats.deductibleRate.toFixed(2)}/day)</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard(colors.teal)}>
            <div style={styles.statIcon}>📅</div>
            <div style={styles.statValue()}>{stats.totalDaysOTR}</div>
            <div style={styles.statLabel}>Days OTR (YTD)</div>
          </div>
          <div style={styles.statCard(colors.green)}>
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statValue(colors.green)}>{formatCurrency(stats.totalPerDiem)}</div>
            <div style={styles.statLabel}>Per Diem Total</div>
          </div>
          <div style={styles.statCard(colors.orange)}>
            <div style={styles.statIcon}>🧾</div>
            <div style={styles.statValue(colors.orange)}>{formatCurrency(stats.estimatedTaxSavings)}</div>
            <div style={styles.statLabel}>Est. Tax Savings (25%)</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Monthly Breakdown</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Month</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Days OTR</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Per Diem Amount</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Est. Tax Savings (25%)</th>
                </tr>
              </thead>
              <tbody>
                {perDiemData.map((row, idx) => {
                  const perDiemAmt = row.days * stats.deductibleRate;
                  const taxSavings = perDiemAmt * 0.25;
                  return (
                    <tr key={row.month}>
                      <td style={styles.td}>{row.month}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <input
                          type="number"
                          value={row.days}
                          onChange={(e) => handleDaysChange(idx, e.target.value)}
                          style={{ ...styles.input, width: 80, textAlign: 'center' }}
                          min="0"
                          max="31"
                        />
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', color: colors.green }}>{formatCurrency(perDiemAmt)}</td>
                      <td style={{ ...styles.td, textAlign: 'right', color: colors.orange }}>{formatCurrency(taxSavings)}</td>
                    </tr>
                  );
                })}
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <td style={{ ...styles.td, fontWeight: 700, color: colors.white }}>ANNUAL TOTAL</td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 700, color: colors.white }}>{stats.totalDaysOTR}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, fontSize: 18, color: colors.green }}>{formatCurrency(stats.totalPerDiem)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, fontSize: 18, color: colors.orange }}>{formatCurrency(stats.estimatedTaxSavings)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...styles.card, background: `linear-gradient(135deg, ${colors.navy}, ${colors.navyDark})` }}>
          <h3 style={{ color: colors.white, marginBottom: 16 }}>💡 Per Diem Tips</h3>
          <ul style={{ color: colors.gray300, lineHeight: 2, marginLeft: 20 }}>
            <li>The IRS allows truck drivers to deduct <strong style={{ color: colors.orange }}>$69/day</strong> for 2025 when away from home overnight</li>
            <li>Only <strong style={{ color: colors.orange }}>80%</strong> of the per diem amount is deductible (${stats.deductibleRate.toFixed(2)}/day)</li>
            <li>You must be away from your tax home overnight to qualify</li>
            <li>Keep a detailed log of your travel days for IRS documentation</li>
            <li>Per diem is claimed on Schedule C of your tax return</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button style={styles.btn('primary')}>📄 Export Tax Report</button>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>⚙️ Settings</h1>
        <p style={styles.pageSubtitle}>Manage your BalanceBooks for Trucking preferences</p>
      </div>

      <div style={styles.card}>
        <h3 style={{ color: colors.white, marginBottom: 20 }}>Company Information</h3>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Company Name</label>
            <input type="text" placeholder="Your Trucking LLC" style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>USDOT Number</label>
            <input type="text" placeholder="1234567" style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>MC Number</label>
            <input type="text" placeholder="MC-123456" style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>EIN</label>
            <input type="text" placeholder="12-3456789" style={styles.input} />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ color: colors.white, marginBottom: 20 }}>Tax Settings</h3>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tax Bracket (%)</label>
            <input type="number" placeholder="25" defaultValue="25" style={styles.input} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Tax Year</label>
            <select style={styles.input}>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ color: colors.white, marginBottom: 20 }}>Data Management</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={styles.btn('primary')}>📤 Export All Data</button>
          <button style={styles.btn('secondary')}>📥 Import Data</button>
          <button style={{ ...styles.btn('secondary'), background: 'rgba(239,68,68,0.2)' }}>🗑️ Clear All Data</button>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ color: colors.white, marginBottom: 20 }}>About</h3>
        <p style={{ color: colors.gray400, lineHeight: 1.8 }}>
          <strong style={{ color: colors.white }}>BalanceBooks for Trucking</strong><br />
          Version 1.0.0<br /><br />
          Owner-operator financial management made simple. Track your loads, calculate your true costs, 
          and maximize your profitability.<br /><br />
          <span style={{ color: colors.orange }}>🔒 100% Offline</span> • <span style={{ color: colors.teal }}>🛡️ Privacy-First</span> • <span style={{ color: colors.green }}>💎 Pay Once, Own Forever</span>
        </p>
      </div>
    </div>
  );

  // ========== MODALS ==========
  const FuelModal = () => {
    const [form, setForm] = useState(editingFuel || {
      date: new Date().toISOString().split('T')[0],
      state: '',
      location: '',
      gallons: '',
      pricePerGal: '',
      odometer: ''
    });

    const handleSubmit = () => {
      if (!form.state || !form.gallons || !form.pricePerGal) return;
      
      if (editingFuel) {
        setFuelEntries(fuelEntries.map(e => e.id === editingFuel.id ? { ...form, id: editingFuel.id } : e));
      } else {
        setFuelEntries([...fuelEntries, { ...form, id: Date.now(), gallons: parseFloat(form.gallons), pricePerGal: parseFloat(form.pricePerGal), odometer: parseFloat(form.odometer) }]);
      }
      setShowFuelModal(false);
    };

    return (
      <div style={styles.modal} onClick={() => setShowFuelModal(false)}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 24 }}>{editingFuel ? 'Edit' : 'Add'} Fuel Entry</h2>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={styles.input}>
                <option value="">Select State</option>
                {Object.keys(iftaTaxRates).sort().map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Location</label>
              <input type="text" placeholder="e.g., Dallas - Loves #405" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Gallons</label>
              <input type="number" step="0.1" value={form.gallons} onChange={e => setForm({ ...form, gallons: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Price Per Gallon</label>
              <input type="number" step="0.01" value={form.pricePerGal} onChange={e => setForm({ ...form, pricePerGal: e.target.value })} style={styles.input} />
            </div>
            <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}>
              <label style={styles.label}>Odometer</label>
              <input type="number" value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} style={styles.input} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button style={styles.btn('primary')} onClick={handleSubmit}>{editingFuel ? 'Update' : 'Add'} Entry</button>
            <button style={styles.btn('secondary')} onClick={() => setShowFuelModal(false)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const LoadModal = () => {
    const [form, setForm] = useState(editingLoad || {
      loadNum: `2025-${String(loads.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      origin: '', dest: '',
      loadedMiles: '', deadhead: 0,
      lineHaul: '', fsc: '', other: 0,
      fuelCost: '', tolls: '', scales: '', parking: '', lumper: 0
    });

    const handleSubmit = () => {
      if (!form.origin || !form.dest || !form.loadedMiles || !form.lineHaul) return;
      
      const processedForm = {
        ...form,
        loadedMiles: parseFloat(form.loadedMiles) || 0,
        deadhead: parseFloat(form.deadhead) || 0,
        lineHaul: parseFloat(form.lineHaul) || 0,
        fsc: parseFloat(form.fsc) || 0,
        other: parseFloat(form.other) || 0,
        fuelCost: parseFloat(form.fuelCost) || 0,
        tolls: parseFloat(form.tolls) || 0,
        scales: parseFloat(form.scales) || 0,
        parking: parseFloat(form.parking) || 0,
        lumper: parseFloat(form.lumper) || 0,
      };
      
      if (editingLoad) {
        setLoads(loads.map(l => l.id === editingLoad.id ? { ...processedForm, id: editingLoad.id } : l));
      } else {
        setLoads([...loads, { ...processedForm, id: Date.now() }]);
      }
      setShowLoadModal(false);
    };

    return (
      <div style={styles.modal} onClick={() => setShowLoadModal(false)}>
        <div style={{ ...styles.modalContent, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 24 }}>{editingLoad ? 'Edit' : 'Add'} Load</h2>
          
          <h4 style={{ color: colors.gray400, marginBottom: 12, fontSize: 12, textTransform: 'uppercase' }}>Load Details</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Load #</label>
              <input type="text" value={form.loadNum} onChange={e => setForm({ ...form, loadNum: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Origin</label>
              <input type="text" placeholder="Dallas, TX" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Destination</label>
              <input type="text" placeholder="Atlanta, GA" value={form.dest} onChange={e => setForm({ ...form, dest: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Loaded Miles</label>
              <input type="number" value={form.loadedMiles} onChange={e => setForm({ ...form, loadedMiles: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Deadhead Miles</label>
              <input type="number" value={form.deadhead} onChange={e => setForm({ ...form, deadhead: e.target.value })} style={styles.input} />
            </div>
          </div>

          <h4 style={{ color: colors.green, marginBottom: 12, marginTop: 20, fontSize: 12, textTransform: 'uppercase' }}>Revenue</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Line Haul</label>
              <input type="number" step="0.01" value={form.lineHaul} onChange={e => setForm({ ...form, lineHaul: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Fuel Surcharge</label>
              <input type="number" step="0.01" value={form.fsc} onChange={e => setForm({ ...form, fsc: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Other Revenue</label>
              <input type="number" step="0.01" value={form.other} onChange={e => setForm({ ...form, other: e.target.value })} style={styles.input} />
            </div>
          </div>

          <h4 style={{ color: colors.orange, marginBottom: 12, marginTop: 20, fontSize: 12, textTransform: 'uppercase' }}>Expenses</h4>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Fuel Cost</label>
              <input type="number" step="0.01" value={form.fuelCost} onChange={e => setForm({ ...form, fuelCost: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Tolls</label>
              <input type="number" step="0.01" value={form.tolls} onChange={e => setForm({ ...form, tolls: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Scales</label>
              <input type="number" step="0.01" value={form.scales} onChange={e => setForm({ ...form, scales: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Parking</label>
              <input type="number" step="0.01" value={form.parking} onChange={e => setForm({ ...form, parking: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Lumper Fees</label>
              <input type="number" step="0.01" value={form.lumper} onChange={e => setForm({ ...form, lumper: e.target.value })} style={styles.input} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button style={styles.btn('primary')} onClick={handleSubmit}>{editingLoad ? 'Update' : 'Add'} Load</button>
            <button style={styles.btn('secondary')} onClick={() => setShowLoadModal(false)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const IftaStateModal = () => {
    const [selectedState, setSelectedState] = useState('');
    const availableStates = Object.keys(iftaTaxRates).filter(s => !iftaData.find(d => d.state === s)).sort();

    return (
      <div style={styles.modal} onClick={() => setShowIftaModal(false)}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 24 }}>Add State</h2>
          <div style={styles.formGroup}>
            <label style={styles.label}>Select State</label>
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={styles.input}>
              <option value="">Select a state...</option>
              {availableStates.map(s => <option key={s} value={s}>{s} (${iftaTaxRates[s].toFixed(3)}/gal)</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button style={styles.btn('primary')} onClick={() => selectedState && setIftaData([...iftaData, { state: selectedState, miles: 0, fuelPurchased: 0 }]) || setShowIftaModal(false)}>Add State</button>
            <button style={styles.btn('secondary')} onClick={() => setShowIftaModal(false)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  // ========== MAIN RENDER ==========
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'fuel': return renderFuelLog();
      case 'loads': return renderLoads();
      case 'cpm': return renderCPM();
      case 'ifta': return renderIFTA();
      case 'perdiem': return renderPerDiem();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <span style={styles.logoIcon}>🚛</span>
          {!sidebarCollapsed && (
            <span style={styles.logoText}>
              Balance<span style={{ color: colors.orange }}>Books</span>
            </span>
          )}
        </div>
        <ul style={styles.nav}>
          {navItems.map(item => (
            <li
              key={item.id}
              style={styles.navItem(activeTab === item.id)}
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={(e) => { if (activeTab !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = colors.white; }}
              onMouseLeave={(e) => { if (activeTab !== item.id) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.gray400; }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {!sidebarCollapsed && item.label}
            </li>
          ))}
        </ul>
        {!sidebarCollapsed && (
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
            <div style={{ fontSize: 11, color: colors.gray500, textAlign: 'center' }}>
              🔒 100% Offline • 🛡️ Privacy-First
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main style={styles.main}>
        {renderContent()}
      </main>

      {/* Modals */}
      {showFuelModal && <FuelModal />}
      {showLoadModal && <LoadModal />}
      {showIftaModal && <IftaStateModal />}
    </div>
  );
}
