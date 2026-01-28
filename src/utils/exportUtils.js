/**
 * BalanceBooks Trucking - Export Utilities
 * Functions for exporting data to CSV, Excel, and PDF
 */

/**
 * Download a file to the user's computer
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert array of objects to CSV string
 */
function objectsToCSV(data, columns) {
  if (!data || data.length === 0) return '';

  const headers = columns.map(col => col.label || col.key);
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      
      // Apply formatter if provided
      if (col.format) {
        value = col.format(value, item);
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }
      
      // Convert to string and escape quotes
      value = String(value).replace(/"/g, '""');
      
      // Wrap in quotes if contains comma, newline, or quote
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        value = `"${value}"`;
      }
      
      return value;
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export data to CSV file
 */
export function exportToCSV(data, columns, filename = 'export.csv') {
  const csv = objectsToCSV(data, columns);
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export data to Excel-compatible CSV (with BOM for proper encoding)
 */
export function exportToExcelCSV(data, columns, filename = 'export.csv') {
  const csv = objectsToCSV(data, columns);
  const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  downloadFile(bom + csv, filename, 'text/csv;charset=utf-8;');
}

// ============ FUEL EXPORT ============

export const fuelExportColumns = [
  { key: 'date', label: 'Date' },
  { key: 'location', label: 'Location' },
  { key: 'state', label: 'State' },
  { key: 'gallons', label: 'Gallons', format: (v) => parseFloat(v).toFixed(2) },
  { key: 'pricePerGallon', label: 'Price/Gal', format: (v) => '$' + parseFloat(v).toFixed(3) },
  { key: 'totalAmount', label: 'Total', format: (v, row) => {
    const total = v || (parseFloat(row.gallons) * parseFloat(row.pricePerGallon));
    return '$' + parseFloat(total).toFixed(2);
  }},
  { key: 'odometer', label: 'Odometer' },
  { key: 'driverName', label: 'Driver', format: (v, row) => row.driverName || '' },
  { key: 'truckUnit', label: 'Truck', format: (v, row) => row.truckUnit || '' }
];

export function exportFuelToCSV(fuelEntries, filename = 'BalanceBooks-Fuel-Log.csv') {
  exportToExcelCSV(fuelEntries, fuelExportColumns, filename);
}

// ============ IFTA EXPORT ============

export const iftaExportColumns = [
  { key: 'quarter', label: 'Quarter' },
  { key: 'state', label: 'State' },
  { key: 'miles', label: 'Miles', format: (v) => parseFloat(v).toFixed(0) },
  { key: 'gallons', label: 'Gallons', format: (v) => parseFloat(v).toFixed(2) },
  { key: 'mpg', label: 'MPG', format: (v, row) => {
    const mpg = parseFloat(row.gallons) > 0 ? parseFloat(row.miles) / parseFloat(row.gallons) : 0;
    return mpg.toFixed(2);
  }},
  { key: 'taxRate', label: 'Tax Rate', format: (v) => '$' + parseFloat(v).toFixed(4) },
  { key: 'taxableGallons', label: 'Taxable Gallons', format: (v) => parseFloat(v).toFixed(2) },
  { key: 'taxOwed', label: 'Tax Owed', format: (v) => '$' + parseFloat(v).toFixed(2) }
];

export function exportIFTAToCSV(iftaData, filename = 'BalanceBooks-IFTA-Report.csv') {
  exportToExcelCSV(iftaData, iftaExportColumns, filename);
}

// ============ LOADS EXPORT ============

export const loadsExportColumns = [
  { key: 'date', label: 'Date' },
  { key: 'loadNumber', label: 'Load #' },
  { key: 'origin', label: 'Origin', format: (v, row) => row.stops?.[0]?.location || '' },
  { key: 'destination', label: 'Destination', format: (v, row) => row.stops?.[row.stops?.length - 1]?.location || '' },
  { key: 'rate', label: 'Rate', format: (v) => '$' + parseFloat(v).toFixed(2) },
  { key: 'loadedMiles', label: 'Loaded Miles' },
  { key: 'deadheadMiles', label: 'Deadhead Miles' },
  { key: 'totalMiles', label: 'Total Miles', format: (v, row) => {
    return (parseFloat(row.loadedMiles) || 0) + (parseFloat(row.deadheadMiles) || 0);
  }},
  { key: 'rpm', label: '$/Mile', format: (v, row) => {
    const miles = (parseFloat(row.loadedMiles) || 0) + (parseFloat(row.deadheadMiles) || 0);
    const rpm = miles > 0 ? parseFloat(row.rate) / miles : 0;
    return '$' + rpm.toFixed(2);
  }},
  { key: 'driverName', label: 'Driver' },
  { key: 'truckUnit', label: 'Truck' },
  { key: 'status', label: 'Status' }
];

export function exportLoadsToCSV(loads, filename = 'BalanceBooks-Loads.csv') {
  exportToExcelCSV(loads, loadsExportColumns, filename);
}

// ============ EXPENSES EXPORT ============

export const expensesExportColumns = [
  { key: 'date', label: 'Date' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', format: (v) => '$' + parseFloat(v).toFixed(2) },
  { key: 'vendor', label: 'Vendor' },
  { key: 'truckUnit', label: 'Truck' },
  { key: 'notes', label: 'Notes' }
];

export function exportExpensesToCSV(expenses, filename = 'BalanceBooks-Expenses.csv') {
  exportToExcelCSV(expenses, expensesExportColumns, filename);
}

// ============ DRIVERS EXPORT ============

export const driversExportColumns = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'licenseNumber', label: 'License #' },
  { key: 'licenseState', label: 'License State' },
  { key: 'hireDate', label: 'Hire Date' },
  { key: 'status', label: 'Status' },
  { key: 'paymentType', label: 'Pay Type' },
  { key: 'payRate', label: 'Pay Rate' }
];

export function exportDriversToCSV(drivers, filename = 'BalanceBooks-Drivers.csv') {
  exportToExcelCSV(drivers, driversExportColumns, filename);
}

// ============ PAY STATEMENT EXPORT ============

/**
 * Generate pay statement as formatted text (for PDF/print)
 */
export function generatePayStatementText(statement, companyInfo = {}) {
  const formatCurrency = (v) => '$' + parseFloat(v).toFixed(2);
  const formatDate = (d) => new Date(d).toLocaleDateString();
  
  let text = '';
  
  // Header
  text += '═'.repeat(60) + '\n';
  text += `${companyInfo.name || 'COMPANY NAME'}\n`;
  text += `${companyInfo.address || ''}\n`;
  text += `${companyInfo.phone || ''}\n`;
  text += '═'.repeat(60) + '\n\n';
  
  // Statement Info
  text += 'DRIVER PAY STATEMENT\n';
  text += '─'.repeat(40) + '\n';
  text += `Driver: ${statement.driverName}\n`;
  text += `Period: ${formatDate(statement.periodStart)} - ${formatDate(statement.periodEnd)}\n`;
  text += `Statement #: ${statement.id}\n`;
  text += `Status: ${statement.status.toUpperCase()}\n\n`;
  
  // Earnings
  text += 'EARNINGS\n';
  text += '─'.repeat(40) + '\n';
  
  statement.loads.forEach((load, i) => {
    text += `${i + 1}. ${load.loadNumber || 'Load'} - ${formatDate(load.date)}\n`;
    text += `   ${load.origin} → ${load.destination}\n`;
    text += `   ${load.totalMiles} mi | Gross: ${formatCurrency(load.grossPay)} | Pay: ${formatCurrency(load.driverPay)}\n\n`;
  });
  
  text += '─'.repeat(40) + '\n';
  text += `Total Loads: ${statement.loadCount}\n`;
  text += `Total Miles: ${statement.totalMiles.toLocaleString()}\n`;
  text += `Total Driver Pay: ${formatCurrency(statement.totalDriverPay)}\n\n`;
  
  // Deductions
  if (statement.deductions.length > 0) {
    text += 'DEDUCTIONS\n';
    text += '─'.repeat(40) + '\n';
    
    statement.deductions.forEach(ded => {
      text += `${ded.description}: -${formatCurrency(ded.amount)}\n`;
    });
    
    text += '─'.repeat(40) + '\n';
    text += `Total Deductions: -${formatCurrency(statement.totalDeductions)}\n\n`;
  }
  
  // Net Pay
  text += '═'.repeat(40) + '\n';
  text += `NET PAY: ${formatCurrency(statement.netPay)}\n`;
  text += '═'.repeat(40) + '\n\n';
  
  // Fuel Summary
  if (statement.fuelSummary && statement.fuelSummary.transactions > 0) {
    text += 'FUEL SUMMARY\n';
    text += '─'.repeat(40) + '\n';
    text += `Transactions: ${statement.fuelSummary.transactions}\n`;
    text += `Gallons: ${statement.fuelSummary.gallons.toFixed(1)}\n`;
    text += `Total: ${formatCurrency(statement.fuelSummary.amount)}\n\n`;
  }
  
  // Footer
  text += '\n' + '─'.repeat(60) + '\n';
  text += `Generated: ${new Date().toLocaleString()}\n`;
  text += 'BalanceBooks Trucking\n';
  
  return text;
}

/**
 * Export pay statement to text file (can be printed)
 */
export function exportPayStatementToText(statement, companyInfo, filename) {
  const text = generatePayStatementText(statement, companyInfo);
  const defaultFilename = `PayStatement-${statement.driverName.replace(/\s+/g, '_')}-${statement.periodEnd}.txt`;
  downloadFile(text, filename || defaultFilename, 'text/plain;charset=utf-8;');
}

// ============ BULK EXPORT ============

/**
 * Export selected items from any data type
 */
export function exportSelectedToCSV(data, selectedIds, columns, filename) {
  const selectedData = data.filter(item => selectedIds.has(item.id));
  exportToExcelCSV(selectedData, columns, filename);
}

// ============ IFTA REPORT GENERATOR ============

/**
 * Generate formatted IFTA report
 */
export function generateIFTAReport(iftaData, quarter, year) {
  // Group by state
  const stateData = {};
  iftaData.forEach(entry => {
    if (!stateData[entry.state]) {
      stateData[entry.state] = { miles: 0, gallons: 0, taxRate: entry.taxRate || 0 };
    }
    stateData[entry.state].miles += parseFloat(entry.miles) || 0;
    stateData[entry.state].gallons += parseFloat(entry.gallons) || 0;
  });

  // Calculate totals and tax
  const totalMiles = Object.values(stateData).reduce((sum, s) => sum + s.miles, 0);
  const totalGallons = Object.values(stateData).reduce((sum, s) => sum + s.gallons, 0);
  const overallMPG = totalGallons > 0 ? totalMiles / totalGallons : 0;

  const report = Object.entries(stateData).map(([state, data]) => {
    const taxableGallons = overallMPG > 0 ? data.miles / overallMPG : 0;
    const netTaxableGallons = taxableGallons - data.gallons;
    const taxOwed = netTaxableGallons * data.taxRate;

    return {
      state,
      miles: data.miles,
      gallons: data.gallons,
      taxRate: data.taxRate,
      taxableGallons,
      netTaxableGallons,
      taxOwed
    };
  }).sort((a, b) => a.state.localeCompare(b.state));

  return {
    quarter,
    year,
    states: report,
    summary: {
      totalMiles,
      totalGallons,
      overallMPG,
      totalTaxOwed: report.reduce((sum, s) => sum + s.taxOwed, 0)
    }
  };
}

export default {
  exportToCSV,
  exportToExcelCSV,
  exportFuelToCSV,
  exportIFTAToCSV,
  exportLoadsToCSV,
  exportExpensesToCSV,
  exportDriversToCSV,
  exportPayStatementToText,
  exportSelectedToCSV,
  generateIFTAReport,
  fuelExportColumns,
  iftaExportColumns,
  loadsExportColumns,
  expensesExportColumns,
  driversExportColumns
};
