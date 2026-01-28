/**
 * BalanceBooks Trucking - Pay Calculation Utilities
 * Handles driver pay calculations for different payment types
 */

/**
 * Payment type constants
 */
export const PAY_TYPES = {
  PER_MILE: 'per_mile',
  PERCENTAGE: 'percentage',
  FLAT_RATE: 'flat_rate'
};

/**
 * Deduction type constants
 */
export const DEDUCTION_TYPES = {
  FUEL_ADVANCE: 'fuel_advance',
  CASH_ADVANCE: 'cash_advance',
  INSURANCE: 'insurance',
  ESCROW: 'escrow',
  ELD: 'eld',
  PARKING: 'parking',
  OTHER: 'other'
};

/**
 * Calculate driver pay for a single load
 * @param {Object} load - Load data
 * @param {Object} driver - Driver data with paymentType and payRate
 * @returns {number} Driver pay amount
 */
export function calculateLoadPay(load, driver) {
  if (!load || !driver) return 0;

  const { paymentType, payRate } = driver;
  const loadedMiles = parseFloat(load.loadedMiles) || 0;
  const deadheadMiles = parseFloat(load.deadheadMiles) || 0;
  const totalMiles = loadedMiles + deadheadMiles;
  const grossRevenue = parseFloat(load.rate) || 0;

  switch (paymentType) {
    case PAY_TYPES.PER_MILE:
      // Pay = Total Miles × Rate per Mile
      return totalMiles * parseFloat(payRate);

    case PAY_TYPES.PERCENTAGE:
      // Pay = Gross Revenue × Percentage
      return grossRevenue * (parseFloat(payRate) / 100);

    case PAY_TYPES.FLAT_RATE:
      // Pay = Fixed amount per load
      return parseFloat(payRate);

    default:
      return 0;
  }
}

/**
 * Calculate fuel advance deduction
 * @param {Array} fuelEntries - Fuel entries for the period
 * @param {number} advanceRate - Percentage of fuel to deduct (0-100)
 * @returns {number} Fuel advance amount
 */
export function calculateFuelAdvance(fuelEntries, advanceRate) {
  if (!fuelEntries || !advanceRate) return 0;

  const totalFuel = fuelEntries
    .filter(entry => entry.isFuelAdvance !== false) // Include by default
    .reduce((sum, entry) => {
      const amount = parseFloat(entry.totalAmount) || (parseFloat(entry.gallons) * parseFloat(entry.pricePerGallon)) || 0;
      return sum + amount;
    }, 0);

  return totalFuel * (parseFloat(advanceRate) / 100);
}

/**
 * Calculate weekly deductions prorated for pay period
 * @param {number} weeklyAmount - Weekly deduction amount
 * @param {Date|string} periodStart - Period start date
 * @param {Date|string} periodEnd - Period end date
 * @returns {number} Prorated deduction amount
 */
export function calculateProratedDeduction(weeklyAmount, periodStart, periodEnd) {
  if (!weeklyAmount) return 0;

  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const weeks = days / 7;

  return parseFloat(weeklyAmount) * weeks;
}

/**
 * Generate a complete pay statement
 * @param {Object} params - Statement parameters
 * @returns {Object} Complete pay statement
 */
export function generatePayStatement({
  driver,
  loads,
  fuelEntries,
  periodStart,
  periodEnd,
  additionalDeductions = []
}) {
  // Calculate earnings from loads
  const loadDetails = loads.map(load => {
    const driverPay = calculateLoadPay(load, driver);
    return {
      loadId: load.id,
      loadNumber: load.loadNumber || 'N/A',
      date: load.date,
      origin: load.stops?.[0]?.location || load.origin || 'Unknown',
      destination: load.stops?.[load.stops?.length - 1]?.location || load.destination || 'Unknown',
      loadedMiles: parseFloat(load.loadedMiles) || 0,
      deadheadMiles: parseFloat(load.deadheadMiles) || 0,
      totalMiles: (parseFloat(load.loadedMiles) || 0) + (parseFloat(load.deadheadMiles) || 0),
      grossPay: parseFloat(load.rate) || 0,
      driverPay: driverPay
    };
  });

  const totalMiles = loadDetails.reduce((sum, l) => sum + l.totalMiles, 0);
  const totalGrossPay = loadDetails.reduce((sum, l) => sum + l.grossPay, 0);
  const totalDriverPay = loadDetails.reduce((sum, l) => sum + l.driverPay, 0);

  // Calculate deductions
  const deductions = [];

  // Fuel advance
  if (driver.fuelAdvanceRate && driver.fuelAdvanceRate > 0) {
    const fuelAdvance = calculateFuelAdvance(fuelEntries, driver.fuelAdvanceRate);
    if (fuelAdvance > 0) {
      deductions.push({
        type: DEDUCTION_TYPES.FUEL_ADVANCE,
        description: `Fuel Advance (${driver.fuelAdvanceRate}%)`,
        amount: fuelAdvance
      });
    }
  }

  // Insurance
  if (driver.insuranceDeduction && driver.insuranceDeduction > 0) {
    const insurance = calculateProratedDeduction(driver.insuranceDeduction, periodStart, periodEnd);
    deductions.push({
      type: DEDUCTION_TYPES.INSURANCE,
      description: 'Insurance',
      amount: insurance
    });
  }

  // Additional deductions
  additionalDeductions.forEach(ded => {
    deductions.push({
      type: ded.type || DEDUCTION_TYPES.OTHER,
      description: ded.description,
      amount: parseFloat(ded.amount) || 0
    });
  });

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const netPay = totalDriverPay - totalDeductions;

  // Build statement
  return {
    id: `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    driverId: driver.id,
    driverName: `${driver.firstName} ${driver.lastName}`,
    periodStart,
    periodEnd,
    status: 'draft',
    paymentType: driver.paymentType,
    payRate: driver.payRate,
    // Earnings
    loads: loadDetails,
    loadCount: loadDetails.length,
    totalMiles,
    totalGrossPay,
    totalDriverPay,
    // Deductions
    deductions,
    totalDeductions,
    // Net
    netPay,
    // Fuel summary
    fuelSummary: {
      transactions: fuelEntries.length,
      gallons: fuelEntries.reduce((sum, f) => sum + (parseFloat(f.gallons) || 0), 0),
      amount: fuelEntries.reduce((sum, f) => sum + (parseFloat(f.totalAmount) || (parseFloat(f.gallons) * parseFloat(f.pricePerGallon)) || 0), 0)
    },
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paidAt: null,
    notes: ''
  };
}

/**
 * Get pay type display name
 */
export function getPayTypeLabel(payType) {
  switch (payType) {
    case PAY_TYPES.PER_MILE:
      return 'Per Mile';
    case PAY_TYPES.PERCENTAGE:
      return 'Percentage';
    case PAY_TYPES.FLAT_RATE:
      return 'Flat Rate';
    default:
      return 'Unknown';
  }
}

/**
 * Format pay rate for display
 */
export function formatPayRate(payType, payRate) {
  const rate = parseFloat(payRate) || 0;
  switch (payType) {
    case PAY_TYPES.PER_MILE:
      return `$${rate.toFixed(2)}/mi`;
    case PAY_TYPES.PERCENTAGE:
      return `${rate}%`;
    case PAY_TYPES.FLAT_RATE:
      return `$${rate.toFixed(2)}/load`;
    default:
      return rate.toString();
  }
}

/**
 * Calculate driver statistics
 */
export function calculateDriverStats(driver, loads, fuelEntries) {
  const driverLoads = loads.filter(l => l.driverId === driver.id);
  const driverFuel = fuelEntries.filter(f => f.driverId === driver.id);

  const totalMiles = driverLoads.reduce((sum, l) => {
    return sum + (parseFloat(l.loadedMiles) || 0) + (parseFloat(l.deadheadMiles) || 0);
  }, 0);

  const totalRevenue = driverLoads.reduce((sum, l) => sum + (parseFloat(l.rate) || 0), 0);
  const totalFuelGallons = driverFuel.reduce((sum, f) => sum + (parseFloat(f.gallons) || 0), 0);
  const totalFuelCost = driverFuel.reduce((sum, f) => {
    return sum + (parseFloat(f.totalAmount) || (parseFloat(f.gallons) * parseFloat(f.pricePerGallon)) || 0);
  }, 0);

  const avgMPG = totalFuelGallons > 0 ? totalMiles / totalFuelGallons : 0;
  const revenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;

  return {
    totalLoads: driverLoads.length,
    totalMiles,
    totalRevenue,
    totalFuelGallons,
    totalFuelCost,
    avgMPG,
    revenuePerMile,
    fuelCostPerMile: totalMiles > 0 ? totalFuelCost / totalMiles : 0
  };
}

/**
 * Calculate truck statistics  
 */
export function calculateTruckStats(truck, loads, fuelEntries) {
  const truckLoads = loads.filter(l => l.truckId === truck.id);
  const truckFuel = fuelEntries.filter(f => f.truckId === truck.id);

  const totalMiles = truckLoads.reduce((sum, l) => {
    return sum + (parseFloat(l.loadedMiles) || 0) + (parseFloat(l.deadheadMiles) || 0);
  }, 0);

  const totalRevenue = truckLoads.reduce((sum, l) => sum + (parseFloat(l.rate) || 0), 0);
  const totalFuelGallons = truckFuel.reduce((sum, f) => sum + (parseFloat(f.gallons) || 0), 0);
  const totalFuelCost = truckFuel.reduce((sum, f) => {
    return sum + (parseFloat(f.totalAmount) || (parseFloat(f.gallons) * parseFloat(f.pricePerGallon)) || 0);
  }, 0);

  const actualMPG = totalFuelGallons > 0 ? totalMiles / totalFuelGallons : 0;
  const mpgVariance = truck.targetMPG ? ((actualMPG - truck.targetMPG) / truck.targetMPG) * 100 : 0;

  return {
    totalLoads: truckLoads.length,
    totalMiles,
    totalRevenue,
    totalFuelGallons,
    totalFuelCost,
    actualMPG,
    targetMPG: truck.targetMPG || 0,
    mpgVariance,
    costPerMile: totalMiles > 0 ? totalFuelCost / totalMiles : 0
  };
}

export default {
  PAY_TYPES,
  DEDUCTION_TYPES,
  calculateLoadPay,
  calculateFuelAdvance,
  calculateProratedDeduction,
  generatePayStatement,
  getPayTypeLabel,
  formatPayRate,
  calculateDriverStats,
  calculateTruckStats
};
