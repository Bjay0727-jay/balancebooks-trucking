import { useState, useMemo } from 'react';

// ============================================================================
// BALANCEBOOKS FOR TRUCKING - Owner-Operator Financial Management
// Enhanced with BalanceBooks branding, more whitespace, and IFTA exports
// ============================================================================

// Design System Colors - Orange theme for Trucking
const colors = {
  navyDark: '#0f172a',
  navy: '#1e3a5f',
  orange: '#f97316',
  orangeDark: '#ea580c',
  orangeLight: '#fdba74',
  orangePale: '#fff7ed',
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
// BALANCEBOOKS SHIELD LOGO COMPONENT
// ============================================================================
const BalanceBooksLogo = ({ size = 40 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size}>
    <defs>
      <linearGradient id="navyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{stopColor:'#1e3a5f'}} />
        <stop offset="100%" style={{stopColor:'#0f172a'}} />
      </linearGradient>
      <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor:'#f97316'}} />
        <stop offset="100%" style={{stopColor:'#ea580c'}} />
      </linearGradient>
    </defs>
    <path d="M 50 5 L 92 18 L 92 55 C 92 78 73 92 50 98 C 27 92 8 78 8 55 L 8 18 Z" fill="url(#navyGrad)"/>
    <path d="M 50 14 L 82 24 L 82 54 C 82 72 67 83 50 88 C 33 83 18 72 18 54 L 18 24 Z" fill="none" stroke="url(#orangeGrad)" strokeWidth="3"/>
    <circle cx="50" cy="52" r="24" fill="url(#orangeGrad)"/>
    <path d="M 36 52 L 46 62 L 66 42" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // ========== CLEAN DATA - NO SAMPLE DATA ==========
  const [fuelEntries, setFuelEntries] = useState([]);
  const [loads, setLoads] = useState([]);
  const [cpmData, setCpmData] = useState({
    totalMiles: 0,
    fuel: 0,
    maintenance: 0,
    insurance: 0,
    truckPayment: 0,
    tolls: 0,
    permits: 0,
    parking: 0,
    communication: 0,
    lumper: 0,
    scales: 0,
    other: 0
  });
  const [perDiemData, setPerDiemData] = useState([
    { month: 'January', days: 0 },
    { month: 'February', days: 0 },
    { month: 'March', days: 0 },
    { month: 'April', days: 0 },
    { month: 'May', days: 0 },
    { month: 'June', days: 0 },
    { month: 'July', days: 0 },
    { month: 'August', days: 0 },
    { month: 'September', days: 0 },
    { month: 'October', days: 0 },
    { month: 'November', days: 0 },
    { month: 'December', days: 0 },
  ]);
  const [iftaQuarter, setIftaQuarter] = useState('Q1 2025');
  const [iftaData, setIftaData] = useState([]);

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
    const avgFuelPrice = totalFuelGallons > 0 ? totalFuelCost / totalFuelGallons : 0;
    
    // MPG calculation
    const sortedFuel = [...fuelEntries].sort((a, b) => a.odometer - b.odometer);
    let totalMilesTraveled = 0;
    let totalGallonsForMPG = 0;
    for (let i = 1; i < sortedFuel.length; i++) {
      totalMilesTraveled += sortedFuel[i].odometer - sortedFuel[i-1].odometer;
      totalGallonsForMPG += sortedFuel[i-1].gallons;
    }
    const avgMPG = totalGallonsForMPG > 0 ? totalMilesTraveled / totalGallonsForMPG : 6.5;

    // Load stats
    const totalRevenue = loads.reduce((sum, l) => sum + l.lineHaul + l.fsc + l.other, 0);
    const totalExpenses = loads.reduce((sum, l) => sum + l.fuelCost + l.tolls + l.scales + l.parking + l.lumper, 0);
    const netProfit = totalRevenue - totalExpenses;
    const totalLoadedMiles = loads.reduce((sum, l) => sum + l.loadedMiles, 0);
    const totalDeadhead = loads.reduce((sum, l) => sum + l.deadhead, 0);
    const totalAllMiles = totalLoadedMiles + totalDeadhead;
    const profitPerMile = totalAllMiles > 0 ? netProfit / totalAllMiles : 0;

    // CPM stats
    const totalOperatingCosts = cpmData.fuel + cpmData.maintenance + cpmData.insurance + 
      cpmData.truckPayment + cpmData.tolls + cpmData.permits + cpmData.parking + 
      cpmData.communication + cpmData.lumper + cpmData.scales + cpmData.other;
    const cpm = cpmData.totalMiles > 0 ? totalOperatingCosts / cpmData.totalMiles : 0;

    // Per Diem stats
    const totalDaysOTR = perDiemData.reduce((sum, m) => sum + m.days, 0);
    const perDiemRate = 69; // 2025 IRS rate
    const deductibleRate = perDiemRate * 0.80; // 80% deductible
    const totalPerDiem = totalDaysOTR * deductibleRate;
    const estimatedTaxSavings = totalPerDiem * 0.25; // 25% tax bracket estimate

    // IFTA stats
    const totalIFTAMiles = iftaData.reduce((sum, s) => sum + s.miles, 0);
    const totalIFTAFuel = iftaData.reduce((sum, s) => sum + s.fuelPurchased, 0);
    const fleetMPG = totalIFTAFuel > 0 ? totalIFTAMiles / totalIFTAFuel : avgMPG || 6.5;

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

  // ========== STYLES - ENHANCED WITH MORE WHITESPACE ==========
  const styles = {
    app: {
      display: 'flex',
      minHeight: '100vh',
      background: colors.navyDark,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    sidebar: {
      width: sidebarCollapsed ? 80 : 280,
      background: colors.gray800,
      borderRight: `1px solid rgba(255,255,255,0.1)`,
      padding: '28px 0',
      transition: 'width 0.3s ease',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    },
    logo: {
      padding: sidebarCollapsed ? '0 16px 28px' : '0 28px 32px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      marginBottom: 32,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      cursor: 'pointer',
    },
    logoText: {
      fontSize: 22,
      fontWeight: 700,
      color: colors.white,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      lineHeight: 1.2,
    },
    logoSubtext: {
      fontSize: 13,
      color: colors.orange,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginTop: 4,
    },
    nav: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      flex: 1,
    },
    navItem: (isActive) => ({
      padding: sidebarCollapsed ? '18px 0' : '18px 28px',
      color: isActive ? colors.orange : colors.gray400,
      fontSize: 15,
      display: 'flex',
      alignItems: 'center',
      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
      gap: 16,
      cursor: 'pointer',
      borderLeft: isActive ? `4px solid ${colors.orange}` : '4px solid transparent',
      background: isActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
      transition: 'all 0.2s ease',
      marginBottom: 6,
    }),
    main: {
      flex: 1,
      padding: 48,
      overflow: 'auto',
      minHeight: '100vh',
    },
    pageHeader: {
      marginBottom: 48,
    },
    pageTitle: {
      fontSize: 36,
      fontWeight: 700,
      color: colors.white,
      marginBottom: 14,
    },
    pageSubtitle: {
      fontSize: 16,
      color: colors.gray400,
      lineHeight: 1.6,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 32,
      marginBottom: 48,
    },
    statCard: (accent = colors.white, isSelected = false, isClickable = false) => ({
      background: colors.gray800,
      borderRadius: 20,
      padding: 32,
      borderLeft: `5px solid ${accent}`,
      cursor: isClickable ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      boxShadow: isSelected ? `0 8px 32px rgba(249, 115, 22, 0.25)` : 'none',
      border: isSelected ? `2px solid ${colors.orange}` : '2px solid transparent',
    }),
    statIcon: {
      fontSize: 32,
      marginBottom: 20,
    },
    statValue: (color = colors.white) => ({
      fontSize: 36,
      fontWeight: 800,
      color: color,
      marginBottom: 10,
    }),
    statLabel: {
      fontSize: 14,
      color: colors.gray400,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    card: {
      background: colors.gray800,
      borderRadius: 24,
      padding: 40,
      marginBottom: 40,
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: 600,
      color: colors.white,
      marginBottom: 32,
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
      padding: '18px 24px',
      color: colors.gray400,
      fontSize: 12,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      borderBottom: `1px solid rgba(255,255,255,0.1)`,
    },
    td: {
      padding: '20px 24px',
      color: colors.gray300,
      fontSize: 15,
      borderBottom: `1px solid rgba(255,255,255,0.05)`,
    },
    btn: (variant = 'primary') => ({
      padding: '16px 32px',
      borderRadius: 14,
      border: 'none',
      cursor: 'pointer',
      fontSize: 15,
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
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
      padding: 32,
    },
    modalContent: {
      background: colors.gray800,
      borderRadius: 28,
      padding: 48,
      width: '90%',
      maxWidth: 680,
      maxHeight: '90vh',
      overflow: 'auto',
    },
    input: {
      width: '100%',
      padding: '16px 20px',
      borderRadius: 12,
      border: `1px solid rgba(255,255,255,0.2)`,
      background: colors.navyDark,
      color: colors.white,
      fontSize: 15,
      outline: 'none',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 24,
    },
    formGroup: {
      marginBottom: 24,
    },
    label: {
      display: 'block',
      color: colors.gray400,
      fontSize: 12,
      fontWeight: 500,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '80px 48px',
      color: colors.gray400,
    },
    emptyIcon: {
      fontSize: 72,
      marginBottom: 28,
      opacity: 0.5,
    },
  };

  // ========== IFTA EXPORT FUNCTIONS ==========
  
  const calculateIFTA = (state, miles, fuelPurchased) => {
    const taxableGallons = miles / stats.fleetMPG;
    const netGallons = taxableGallons - fuelPurchased;
    const taxRate = iftaTaxRates[state] || 0.25;
    const taxDue = netGallons * taxRate;
    return { taxableGallons, netGallons, taxRate, taxDue };
  };

  const exportIFTAtoCSV = () => {
    const totalTaxDue = iftaData.reduce((sum, row) => {
      const calc = calculateIFTA(row.state, row.miles, row.fuelPurchased);
      return sum + calc.taxDue;
    }, 0);

    let csv = 'BalanceBooks Trucking - IFTA Report\n';
    csv += `Quarter: ${iftaQuarter}\n`;
    csv += `Fleet MPG: ${stats.fleetMPG.toFixed(2)}\n\n`;
    csv += 'State,Miles,Taxable Gallons,Fuel Purchased,Net Gallons,Tax Rate,Tax Due/Credit\n';
    
    iftaData.forEach(row => {
      const calc = calculateIFTA(row.state, row.miles, row.fuelPurchased);
      csv += `${row.state},${row.miles},${calc.taxableGallons.toFixed(2)},${row.fuelPurchased},${calc.netGallons.toFixed(2)},$${calc.taxRate.toFixed(3)},$${calc.taxDue.toFixed(2)}\n`;
    });
    
    csv += `\nTOTAL,${stats.totalIFTAMiles},,${stats.totalIFTAFuel},,,$${totalTaxDue.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IFTA-Report-${iftaQuarter.replace(' ', '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportIFTAtoPDF = () => {
    const totalTaxDue = iftaData.reduce((sum, row) => {
      const calc = calculateIFTA(row.state, row.miles, row.fuelPurchased);
      return sum + calc.taxDue;
    }, 0);

    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>IFTA Report - ${iftaQuarter}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 48px; color: #333; max-width: 1000px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 4px solid #f97316; }
          .logo { display: flex; align-items: center; gap: 16px; }
          .logo-text { font-size: 28px; font-weight: bold; }
          .logo-text span { color: #f97316; }
          h1 { color: #1e3a5f; margin: 0 0 10px 0; font-size: 32px; }
          .subtitle { color: #64748b; margin: 0; font-size: 16px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 48px; }
          .summary-card { background: #f8fafc; padding: 28px; border-radius: 16px; text-align: center; border-left: 5px solid #f97316; }
          .summary-value { font-size: 28px; font-weight: bold; color: #1e3a5f; }
          .summary-label { font-size: 12px; color: #64748b; text-transform: uppercase; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 48px; }
          th { background: #1e3a5f; color: white; padding: 18px 20px; text-align: left; font-size: 12px; text-transform: uppercase; }
          td { padding: 18px 20px; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
          tr:nth-child(even) { background: #f8fafc; }
          .total-row { background: #1e3a5f !important; color: white; font-weight: bold; }
          .credit { color: #22c55e; }
          .due { color: #ef4444; }
          .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; text-align: center; }
          @media print { body { padding: 24px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">
            <svg viewBox="0 0 100 100" width="56" height="56">
              <defs>
                <linearGradient id="navyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#1e3a5f" />
                  <stop offset="100%" style="stop-color:#0f172a" />
                </linearGradient>
                <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#f97316" />
                  <stop offset="100%" style="stop-color:#ea580c" />
                </linearGradient>
              </defs>
              <path d="M 50 5 L 92 18 L 92 55 C 92 78 73 92 50 98 C 27 92 8 78 8 55 L 8 18 Z" fill="url(#navyGrad)"/>
              <path d="M 50 14 L 82 24 L 82 54 C 82 72 67 83 50 88 C 33 83 18 72 18 54 L 18 24 Z" fill="none" stroke="url(#orangeGrad)" stroke-width="3"/>
              <circle cx="50" cy="52" r="24" fill="url(#orangeGrad)"/>
              <path d="M 36 52 L 46 62 L 66 42" fill="none" stroke="white" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div>
              <div class="logo-text">Balance<span>Books</span></div>
              <div style="color: #f97316; font-size: 14px; font-weight: 600; letter-spacing: 1px;">TRUCKING</div>
            </div>
          </div>
          <div style="text-align: right;">
            <h1>IFTA Report</h1>
            <p class="subtitle">${iftaQuarter}</p>
          </div>
        </div>

        <div class="summary">
          <div class="summary-card">
            <div class="summary-value">${iftaQuarter}</div>
            <div class="summary-label">Quarter</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${formatNumber(stats.totalIFTAMiles)}</div>
            <div class="summary-label">Total Miles</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${formatNumber(stats.totalIFTAFuel)}</div>
            <div class="summary-label">Total Gallons</div>
          </div>
          <div class="summary-card">
            <div class="summary-value ${totalTaxDue >= 0 ? 'due' : 'credit'}">${totalTaxDue >= 0 ? formatCurrency(totalTaxDue) : '(' + formatCurrency(Math.abs(totalTaxDue)) + ')'}</div>
            <div class="summary-label">${totalTaxDue >= 0 ? 'Tax Due' : 'Tax Credit'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>State</th>
              <th style="text-align: right;">Miles</th>
              <th style="text-align: right;">Taxable Gal</th>
              <th style="text-align: right;">Fuel Purchased</th>
              <th style="text-align: right;">Net Gallons</th>
              <th style="text-align: right;">Tax Rate</th>
              <th style="text-align: right;">Tax Due/(Credit)</th>
            </tr>
          </thead>
          <tbody>
            ${iftaData.map(row => {
              const calc = calculateIFTA(row.state, row.miles, row.fuelPurchased);
              return `
                <tr>
                  <td><strong>${row.state}</strong></td>
                  <td style="text-align: right;">${formatNumber(row.miles)}</td>
                  <td style="text-align: right;">${formatNumber(calc.taxableGallons, 2)}</td>
                  <td style="text-align: right;">${formatNumber(row.fuelPurchased)}</td>
                  <td style="text-align: right;" class="${calc.netGallons >= 0 ? 'due' : 'credit'}">${formatNumber(calc.netGallons, 2)}</td>
                  <td style="text-align: right;">$${calc.taxRate.toFixed(3)}</td>
                  <td style="text-align: right;" class="${calc.taxDue >= 0 ? 'due' : 'credit'}">${calc.taxDue >= 0 ? formatCurrency(calc.taxDue) : '(' + formatCurrency(Math.abs(calc.taxDue)) + ')'}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td><strong>TOTAL</strong></td>
              <td style="text-align: right;">${formatNumber(stats.totalIFTAMiles)}</td>
              <td></td>
              <td style="text-align: right;">${formatNumber(stats.totalIFTAFuel)}</td>
              <td colspan="2"></td>
              <td style="text-align: right; font-size: 18px;">${totalTaxDue >= 0 ? formatCurrency(totalTaxDue) : '(' + formatCurrency(Math.abs(totalTaxDue)) + ')'}</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #fff7ed; padding: 24px; border-radius: 16px; border-left: 5px solid #f97316;">
          <strong style="color: #ea580c;">Fleet MPG Used:</strong> ${stats.fleetMPG.toFixed(2)} miles per gallon
        </div>

        <div class="footer">
          Generated by BalanceBooks Trucking • ${new Date().toLocaleDateString()} • www.balancebooksapp.com
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  // ========== RENDER FUNCTIONS ==========
  
  const renderDashboard = () => {
    const handleCardClick = (cardId) => {
      setSelectedCard(selectedCard === cardId ? null : cardId);
    };

    return (
      <div>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <p style={styles.pageSubtitle}>Overview of your trucking business performance. Click any card to select it.</p>
        </div>

        {/* Key Metrics - Clickable Cards */}
        <div style={styles.statsGrid}>
          <div 
            style={styles.statCard(colors.green, selectedCard === 'profit', true)}
            onClick={() => handleCardClick('profit')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = selectedCard === 'profit' ? 'scale(1.02)' : 'scale(1)'}
          >
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statValue(colors.green)}>{formatCurrency(stats.netProfit)}</div>
            <div style={styles.statLabel}>Net Profit (YTD)</div>
          </div>
          <div 
            style={styles.statCard(colors.orange, selectedCard === 'miles', true)}
            onClick={() => handleCardClick('miles')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = selectedCard === 'miles' ? 'scale(1.02)' : 'scale(1)'}
          >
            <div style={styles.statIcon}>🛣️</div>
            <div style={styles.statValue()}>{formatNumber(stats.totalLoadedMiles)}</div>
            <div style={styles.statLabel}>Loaded Miles</div>
          </div>
          <div 
            style={styles.statCard(colors.teal, selectedCard === 'loads', true)}
            onClick={() => handleCardClick('loads')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = selectedCard === 'loads' ? 'scale(1.02)' : 'scale(1)'}
          >
            <div style={styles.statIcon}>📦</div>
            <div style={styles.statValue()}>{stats.completedLoads}</div>
            <div style={styles.statLabel}>Completed Loads</div>
          </div>
          <div 
            style={styles.statCard(colors.green, selectedCard === 'ppm', true)}
            onClick={() => handleCardClick('ppm')}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = selectedCard === 'ppm' ? 'scale(1.02)' : 'scale(1)'}
          >
            <div style={styles.statIcon}>📈</div>
            <div style={styles.statValue(colors.green)}>{formatCurrency(stats.profitPerMile)}</div>
            <div style={styles.statLabel}>Profit Per Mile</div>
          </div>
        </div>

        {/* Secondary Metrics - Clickable */}
        <div style={styles.statsGrid}>
          <div 
            style={styles.statCard(colors.white, selectedCard === 'mpg', true)}
            onClick={() => handleCardClick('mpg')}
          >
            <div style={styles.statIcon}>⛽</div>
            <div style={styles.statValue()}>{stats.avgMPG.toFixed(1)}</div>
            <div style={styles.statLabel}>Avg MPG</div>
          </div>
          <div 
            style={styles.statCard(colors.white, selectedCard === 'cpm', true)}
            onClick={() => handleCardClick('cpm')}
          >
            <div style={styles.statIcon}>🧮</div>
            <div style={styles.statValue(colors.orange)}>{formatCurrency(stats.cpm)}</div>
            <div style={styles.statLabel}>Cost Per Mile</div>
          </div>
          <div 
            style={styles.statCard(colors.white, selectedCard === 'fuelprice', true)}
            onClick={() => handleCardClick('fuelprice')}
          >
            <div style={styles.statIcon}>⛽</div>
            <div style={styles.statValue()}>{formatCurrency(stats.avgFuelPrice)}</div>
            <div style={styles.statLabel}>Avg Fuel Price</div>
          </div>
          <div 
            style={styles.statCard(colors.white, selectedCard === 'daysotr', true)}
            onClick={() => handleCardClick('daysotr')}
          >
            <div style={styles.statIcon}>📅</div>
            <div style={styles.statValue()}>{stats.totalDaysOTR}</div>
            <div style={styles.statLabel}>Days OTR (YTD)</div>
          </div>
        </div>

        {/* Recent Loads or Empty State */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>📦 Recent Loads</span>
            <button style={styles.btn('secondary')} onClick={() => setActiveTab('loads')}>
              View All →
            </button>
          </div>
          {loads.length > 0 ? (
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
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📦</div>
              <h3 style={{ color: colors.white, marginBottom: 16, fontSize: 24 }}>No Loads Yet</h3>
              <p style={{ marginBottom: 32, fontSize: 16 }}>Start tracking your loads to see revenue and profit analytics here.</p>
              <button style={styles.btn('primary')} onClick={() => { setActiveTab('loads'); }}>
                ➕ Add Your First Load
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFuelLog = () => (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>⛽ Fuel Log</h1>
        <p style={styles.pageSubtitle}>Track fuel purchases to calculate MPG and fuel costs</p>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard()}>
          <div style={styles.statIcon}>⛽</div>
          <div style={styles.statValue()}>{formatNumber(stats.totalFuelGallons)}</div>
          <div style={styles.statLabel}>Total Gallons</div>
        </div>
        <div style={styles.statCard(colors.orange)}>
          <div style={styles.statIcon}>💵</div>
          <div style={styles.statValue(colors.orange)}>{formatCurrency(stats.totalFuelCost)}</div>
          <div style={styles.statLabel}>Total Fuel Cost</div>
        </div>
        <div style={styles.statCard()}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statValue()}>{formatCurrency(stats.avgFuelPrice)}</div>
          <div style={styles.statLabel}>Avg Price/Gallon</div>
        </div>
        <div style={styles.statCard(colors.green)}>
          <div style={styles.statIcon}>🚛</div>
          <div style={styles.statValue(colors.green)}>{stats.avgMPG.toFixed(2)}</div>
          <div style={styles.statLabel}>Average MPG</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>Fuel Entries</span>
          <button style={styles.btn('primary')} onClick={() => { setEditingFuel(null); setShowFuelModal(true); }}>
            ➕ Add Fuel Entry
          </button>
        </div>
        
        {fuelEntries.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>State</th>
                  <th style={styles.th}>Location</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Gallons</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>$/Gallon</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Odometer</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fuelEntries.slice().reverse().map(entry => (
                  <tr key={entry.id}>
                    <td style={styles.td}>{entry.date}</td>
                    <td style={styles.td}>
                      <span style={{ background: colors.orange, padding: '6px 14px', borderRadius: 6, fontWeight: 600 }}>{entry.state}</span>
                    </td>
                    <td style={styles.td}>{entry.location}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{formatNumber(entry.gallons, 1)}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(entry.pricePerGal)}</td>
                    <td style={{ ...styles.td, textAlign: 'right', color: colors.orange, fontWeight: 600 }}>{formatCurrency(entry.gallons * entry.pricePerGal)}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{formatNumber(entry.odometer)}</td>
                    <td style={styles.td}>
                      <button style={{ ...styles.btn('secondary'), padding: '10px 20px' }} onClick={() => { setEditingFuel(entry); setShowFuelModal(true); }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>⛽</div>
            <h3 style={{ color: colors.white, marginBottom: 16, fontSize: 24 }}>No Fuel Entries Yet</h3>
            <p style={{ marginBottom: 32, fontSize: 16 }}>Track your fuel purchases to calculate your fleet MPG and fuel costs.</p>
            <button style={styles.btn('primary')} onClick={() => { setEditingFuel(null); setShowFuelModal(true); }}>
              ➕ Add Fuel Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderLoads = () => (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>📦 Load Tracker</h1>
        <p style={styles.pageSubtitle}>Track revenue, expenses, and profitability for each load</p>
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
          <div style={styles.statIcon}>📈</div>
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
          <span>All Loads ({loads.length})</span>
          <button style={styles.btn('primary')} onClick={() => { setEditingLoad(null); setShowLoadModal(true); }}>
            ➕ Add Load
          </button>
        </div>

        {loads.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Load #</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Route</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Miles</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Revenue</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Expenses</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Profit</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>$/Mile</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loads.slice().reverse().map(load => {
                  const rev = load.lineHaul + load.fsc + load.other;
                  const exp = load.fuelCost + load.tolls + load.scales + load.parking + load.lumper;
                  const profit = rev - exp;
                  const totalMiles = load.loadedMiles + load.deadhead;
                  const rpm = totalMiles > 0 ? profit / totalMiles : 0;
                  return (
                    <tr key={load.id}>
                      <td style={styles.td}>{load.loadNum}</td>
                      <td style={styles.td}>{load.date}</td>
                      <td style={styles.td}>{load.origin} → {load.dest}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{formatNumber(load.loadedMiles)} <span style={{ color: colors.gray500 }}>+ {load.deadhead} DH</span></td>
                      <td style={{ ...styles.td, textAlign: 'right', color: colors.green }}>{formatCurrency(rev)}</td>
                      <td style={{ ...styles.td, textAlign: 'right', color: colors.orange }}>{formatCurrency(exp)}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600, color: profit >= 0 ? colors.green : colors.red }}>{formatCurrency(profit)}</td>
                      <td style={{ ...styles.td, textAlign: 'right', color: rpm >= 1.50 ? colors.green : colors.orange }}>{formatCurrency(rpm)}</td>
                      <td style={styles.td}>
                        <button style={{ ...styles.btn('secondary'), padding: '10px 20px' }} onClick={() => { setEditingLoad(load); setShowLoadModal(true); }}>Edit</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📦</div>
            <h3 style={{ color: colors.white, marginBottom: 16, fontSize: 24 }}>No Loads Yet</h3>
            <p style={{ marginBottom: 32, fontSize: 16 }}>Start tracking your loads to calculate revenue and profit per mile.</p>
            <button style={styles.btn('primary')} onClick={() => { setEditingLoad(null); setShowLoadModal(true); }}>
              ➕ Add Your First Load
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCPM = () => {
    const handleChange = (field, value) => {
      setCpmData({ ...cpmData, [field]: parseFloat(value) || 0 });
    };

    const costItems = [
      { key: 'fuel', label: 'Fuel', icon: '⛽' },
      { key: 'maintenance', label: 'Maintenance & Repairs', icon: '🔧' },
      { key: 'insurance', label: 'Insurance', icon: '🛡️' },
      { key: 'truckPayment', label: 'Truck Payment', icon: '🚛' },
      { key: 'tolls', label: 'Tolls', icon: '🛣️' },
      { key: 'permits', label: 'Permits & Licenses', icon: '📋' },
      { key: 'parking', label: 'Parking', icon: '🅿️' },
      { key: 'communication', label: 'Phone/ELD', icon: '📱' },
      { key: 'lumper', label: 'Lumper Fees', icon: '📦' },
      { key: 'scales', label: 'Scale Fees', icon: '⚖️' },
      { key: 'other', label: 'Other', icon: '📝' },
    ];

    return (
      <div>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>🧮 Cost Per Mile Calculator</h1>
          <p style={styles.pageSubtitle}>Calculate your true operating cost per mile to price loads profitably</p>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard(colors.orange)}>
            <div style={styles.statIcon}>🧮</div>
            <div style={styles.statValue(colors.orange)}>{formatCurrency(stats.cpm)}</div>
            <div style={styles.statLabel}>Cost Per Mile</div>
          </div>
          <div style={styles.statCard()}>
            <div style={styles.statIcon}>🛣️</div>
            <div style={styles.statValue()}>{formatNumber(cpmData.totalMiles)}</div>
            <div style={styles.statLabel}>Total Miles</div>
          </div>
          <div style={styles.statCard(colors.red)}>
            <div style={styles.statIcon}>💸</div>
            <div style={styles.statValue(colors.red)}>{formatCurrency(stats.totalOperatingCosts)}</div>
            <div style={styles.statLabel}>Total Operating Costs</div>
          </div>
          <div style={styles.statCard(colors.green)}>
            <div style={styles.statIcon}>🎯</div>
            <div style={styles.statValue(colors.green)}>{formatCurrency(stats.cpm * 1.2)}</div>
            <div style={styles.statLabel}>Min Rate (20% Profit)</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Monthly Operating Costs</div>
          
          <div style={{ marginBottom: 40 }}>
            <label style={styles.label}>Total Miles Driven (Monthly)</label>
            <input
              type="number"
              value={cpmData.totalMiles}
              onChange={(e) => handleChange('totalMiles', e.target.value)}
              style={{ ...styles.input, maxWidth: 320 }}
              placeholder="e.g., 8000"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28 }}>
            {costItems.map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <span style={{ fontSize: 28, width: 40 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <label style={{ ...styles.label, marginBottom: 8 }}>{item.label}</label>
                  <input
                    type="number"
                    value={cpmData[item.key]}
                    onChange={(e) => handleChange(item.key, e.target.value)}
                    style={styles.input}
                    placeholder="0.00"
                  />
                </div>
                <div style={{ color: colors.gray500, fontSize: 14, minWidth: 90, textAlign: 'right' }}>
                  {cpmData.totalMiles > 0 ? formatCurrency(cpmData[item.key] / cpmData.totalMiles) : '$0.00'}/mi
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...styles.card, background: `linear-gradient(135deg, ${colors.orange}, ${colors.orangeDark})` }}>
          <h3 style={{ color: colors.white, marginBottom: 20, fontSize: 22 }}>💡 Understanding Your Cost Per Mile</h3>
          <p style={{ color: colors.white, opacity: 0.9, lineHeight: 1.9, fontSize: 16 }}>
            Your cost per mile is <strong style={{ color: colors.white }}>{formatCurrency(stats.cpm)}</strong>. This means you must 
            charge at least this amount per mile just to break even. To make a profit, aim for rates 
            of <strong style={{ color: colors.white }}>{formatCurrency(stats.cpm * 1.2)}</strong> per mile (20% profit margin) 
            or higher. Any load paying less than {formatCurrency(stats.cpm)}/mile is losing you money!
          </p>
        </div>
      </div>
    );
  };

  const renderIFTA = () => {
    const totalTaxDue = iftaData.reduce((sum, row) => {
      const calc = calculateIFTA(row.state, row.miles, row.fuelPurchased);
      return sum + calc.taxDue;
    }, 0);

    const handleIftaChange = (index, field, value) => {
      const newData = [...iftaData];
      newData[index] = { ...newData[index], [field]: parseFloat(value) || 0 };
      setIftaData(newData);
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
            <div style={{ display: 'flex', gap: 16 }}>
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
                ➕ Add State
              </button>
            </div>
          </div>
          
          {iftaData.length > 0 ? (
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
                          <span style={{ background: colors.orange, padding: '8px 16px', borderRadius: 8, fontWeight: 600 }}>{row.state}</span>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <input
                            type="number"
                            value={row.miles}
                            onChange={(e) => handleIftaChange(idx, 'miles', e.target.value)}
                            style={{ ...styles.input, width: 120, textAlign: 'right' }}
                          />
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right', color: colors.gray400 }}>{formatNumber(calc.taxableGallons, 2)}</td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <input
                            type="number"
                            value={row.fuelPurchased}
                            onChange={(e) => handleIftaChange(idx, 'fuelPurchased', e.target.value)}
                            style={{ ...styles.input, width: 120, textAlign: 'right' }}
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
                          <button style={{ ...styles.btn('secondary'), padding: '10px 20px', background: 'rgba(239,68,68,0.2)' }} onClick={() => removeState(row.state)}>
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
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, fontSize: 22, color: totalTaxDue >= 0 ? colors.red : colors.green }}>
                      {totalTaxDue >= 0 ? formatCurrency(totalTaxDue) : `(${formatCurrency(Math.abs(totalTaxDue))})`}
                    </td>
                    <td style={styles.td}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <h3 style={{ color: colors.white, marginBottom: 16, fontSize: 24 }}>No States Added</h3>
              <p style={{ marginBottom: 32, fontSize: 16 }}>Add states you've driven through to calculate your IFTA tax liability.</p>
              <button style={styles.btn('primary')} onClick={() => setShowIftaModal(true)}>
                ➕ Add Your First State
              </button>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        {iftaData.length > 0 && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <button style={styles.btn('primary')} onClick={exportIFTAtoPDF}>
              📄 Export PDF
            </button>
            <button style={styles.btn('primary')} onClick={exportIFTAtoCSV}>
              📊 Export XLS/CSV
            </button>
            <button style={styles.btn('secondary')} onClick={() => window.print()}>
              🖨️ Print
            </button>
          </div>
        )}
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
                          style={{ ...styles.input, width: 100, textAlign: 'center' }}
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
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, fontSize: 22, color: colors.green }}>{formatCurrency(stats.totalPerDiem)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, fontSize: 22, color: colors.orange }}>{formatCurrency(stats.estimatedTaxSavings)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...styles.card, background: `linear-gradient(135deg, ${colors.navy}, ${colors.navyDark})` }}>
          <h3 style={{ color: colors.white, marginBottom: 24, fontSize: 22 }}>💡 Per Diem Tips</h3>
          <ul style={{ color: colors.gray300, lineHeight: 2.4, marginLeft: 28, fontSize: 16 }}>
            <li>The IRS allows truck drivers to deduct <strong style={{ color: colors.orange }}>$69/day</strong> for 2025 when away from home overnight</li>
            <li>Only <strong style={{ color: colors.orange }}>80%</strong> of this amount is deductible, so your actual deduction is <strong style={{ color: colors.green }}>$55.20/day</strong></li>
            <li>This can significantly reduce your taxable income and save thousands in taxes</li>
            <li>Keep a log of your travel days - odometer readings, locations visited</li>
            <li>You don't need receipts for per diem, but you must have documentation of travel days</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>⚙️ Settings</h1>
        <p style={styles.pageSubtitle}>Configure your BalanceBooks Trucking preferences</p>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>About BalanceBooks Trucking</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <BalanceBooksLogo size={72} />
          <div>
            <h3 style={{ color: colors.white, margin: 0, fontSize: 26 }}>BalanceBooks <span style={{ color: colors.orange }}>Trucking</span></h3>
            <p style={{ color: colors.gray400, margin: '10px 0 0', fontSize: 15 }}>Version 1.0.0 • Owner-Operator Edition</p>
          </div>
        </div>
        <div style={{ background: colors.navyDark, borderRadius: 16, padding: 28, marginBottom: 28 }}>
          <p style={{ color: colors.gray300, lineHeight: 1.9, margin: 0, fontSize: 15 }}>
            BalanceBooks Trucking is a privacy-first financial management application designed specifically for owner-operators. 
            All your data stays on your device - we never upload or store your information on external servers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ background: colors.green, color: colors.white, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>🔒 100% Offline</span>
          <span style={{ background: colors.teal, color: colors.white, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>🛡️ Privacy-First</span>
          <span style={{ background: colors.orange, color: colors.white, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>🚛 Built for Truckers</span>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Data Management</div>
        <p style={{ color: colors.gray400, marginBottom: 32, fontSize: 15 }}>Export or clear your data. Exports can be used to backup your information.</p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <button style={styles.btn('primary')} onClick={() => {
            const data = { fuelEntries, loads, cpmData, perDiemData, iftaData, exportDate: new Date().toISOString() };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `balancebooks-trucking-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            💾 Export All Data
          </button>
          <button style={{ ...styles.btn('secondary'), background: 'rgba(239,68,68,0.2)' }} onClick={() => {
            if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
              setFuelEntries([]);
              setLoads([]);
              setCpmData({ totalMiles: 0, fuel: 0, maintenance: 0, insurance: 0, truckPayment: 0, tolls: 0, permits: 0, parking: 0, communication: 0, lumper: 0, scales: 0, other: 0 });
              setPerDiemData(perDiemData.map(m => ({ ...m, days: 0 })));
              setIftaData([]);
            }
          }}>
            🗑️ Clear All Data
          </button>
        </div>
      </div>
    </div>
  );

  // ========== MODALS ==========

  const FuelModal = () => {
    const [form, setForm] = useState(editingFuel || {
      date: new Date().toISOString().split('T')[0],
      state: 'TX',
      location: '',
      gallons: '',
      pricePerGal: '',
      odometer: ''
    });

    const handleSubmit = () => {
      const entry = {
        ...form,
        id: editingFuel?.id || Date.now(),
        gallons: parseFloat(form.gallons) || 0,
        pricePerGal: parseFloat(form.pricePerGal) || 0,
        odometer: parseFloat(form.odometer) || 0
      };
      
      if (editingFuel) {
        setFuelEntries(fuelEntries.map(e => e.id === entry.id ? entry : e));
      } else {
        setFuelEntries([...fuelEntries, entry]);
      }
      setShowFuelModal(false);
      setEditingFuel(null);
    };

    return (
      <div style={styles.modal} onClick={() => setShowFuelModal(false)}>
        <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 36, fontSize: 28 }}>{editingFuel ? 'Edit' : 'Add'} Fuel Entry</h2>
          
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>State</label>
              <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={styles.input}>
                {Object.keys(iftaTaxRates).sort().map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
              <label style={styles.label}>Location</label>
              <input type="text" placeholder="e.g., Dallas - Loves #405" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Gallons</label>
              <input type="number" step="0.01" value={form.gallons} onChange={e => setForm({ ...form, gallons: e.target.value })} style={styles.input} placeholder="180" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Price/Gallon</label>
              <input type="number" step="0.001" value={form.pricePerGal} onChange={e => setForm({ ...form, pricePerGal: e.target.value })} style={styles.input} placeholder="3.45" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Odometer</label>
              <input type="number" value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} style={styles.input} placeholder="125000" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
            <button style={styles.btn('primary')} onClick={handleSubmit}>{editingFuel ? 'Update' : 'Add'} Entry</button>
            <button style={styles.btn('secondary')} onClick={() => setShowFuelModal(false)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  const LoadModal = () => {
    const [form, setForm] = useState(editingLoad || {
      loadNum: `${new Date().getFullYear()}-${String(loads.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      origin: '',
      dest: '',
      loadedMiles: '',
      deadhead: '0',
      lineHaul: '',
      fsc: '',
      other: '0',
      fuelCost: '',
      tolls: '0',
      scales: '12',
      parking: '0',
      lumper: '0'
    });

    const handleSubmit = () => {
      const load = {
        ...form,
        id: editingLoad?.id || Date.now(),
        loadedMiles: parseFloat(form.loadedMiles) || 0,
        deadhead: parseFloat(form.deadhead) || 0,
        lineHaul: parseFloat(form.lineHaul) || 0,
        fsc: parseFloat(form.fsc) || 0,
        other: parseFloat(form.other) || 0,
        fuelCost: parseFloat(form.fuelCost) || 0,
        tolls: parseFloat(form.tolls) || 0,
        scales: parseFloat(form.scales) || 0,
        parking: parseFloat(form.parking) || 0,
        lumper: parseFloat(form.lumper) || 0
      };
      
      if (editingLoad) {
        setLoads(loads.map(l => l.id === load.id ? load : l));
      } else {
        setLoads([...loads, load]);
      }
      setShowLoadModal(false);
      setEditingLoad(null);
    };

    return (
      <div style={styles.modal} onClick={() => setShowLoadModal(false)}>
        <div style={{ ...styles.modalContent, maxWidth: 760 }} onClick={e => e.stopPropagation()}>
          <h2 style={{ color: colors.white, marginBottom: 36, fontSize: 28 }}>{editingLoad ? 'Edit' : 'Add'} Load</h2>
          
          <h4 style={{ color: colors.gray400, marginBottom: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px' }}>Load Details</h4>
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

          <h4 style={{ color: colors.green, marginBottom: 20, marginTop: 36, fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px' }}>Revenue</h4>
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

          <h4 style={{ color: colors.orange, marginBottom: 20, marginTop: 36, fontSize: 13, textTransform: 'uppercase', letterSpacing: '1px' }}>Expenses</h4>
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

          <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
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
          <h2 style={{ color: colors.white, marginBottom: 36, fontSize: 28 }}>Add State</h2>
          <div style={styles.formGroup}>
            <label style={styles.label}>Select State</label>
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} style={styles.input}>
              <option value="">Select a state...</option>
              {availableStates.map(s => <option key={s} value={s}>{s} (${iftaTaxRates[s].toFixed(3)}/gal)</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 40 }}>
            <button style={styles.btn('primary')} onClick={() => {
              if (selectedState) {
                setIftaData([...iftaData, { state: selectedState, miles: 0, fuelPurchased: 0 }]);
                setShowIftaModal(false);
              }
            }}>Add State</button>
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
          <BalanceBooksLogo size={sidebarCollapsed ? 40 : 48} />
          {!sidebarCollapsed && (
            <div>
              <div style={styles.logoText}>
                Balance<span style={{ color: colors.orange }}>Books</span>
              </div>
              <div style={styles.logoSubtext}>Trucking</div>
            </div>
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
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              {!sidebarCollapsed && item.label}
            </li>
          ))}
        </ul>
        {!sidebarCollapsed && (
          <div style={{ padding: '28px', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto' }}>
            <div style={{ fontSize: 13, color: colors.gray500, textAlign: 'center', lineHeight: 1.7 }}>
              🔒 100% Offline<br />🛡️ Privacy-First
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
