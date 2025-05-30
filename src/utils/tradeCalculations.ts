// Trade calculation utilities

export function calcAvgEntry(entries: { price: number, qty: number }[]) {
  const totalQty = entries.reduce((sum, e) => sum + e.qty, 0);
  const totalValue = entries.reduce((sum, e) => sum + e.price * e.qty, 0);
  return totalQty ? totalValue / totalQty : 0;
}

export function calcPositionSize(avgEntry: number, totalQty: number) {
  return avgEntry * totalQty;
}

export function calcAllocation(positionSize: number, portfolioSize: number) {
  return portfolioSize ? (positionSize / portfolioSize) * 100 : 0;
}

export function calcSLPercent(sl: number, entry: number): number {
  if (!entry || !sl) return 0;
  return Math.abs(((entry - sl) / entry) * 100);
}

export function calcOpenQty(initialQty: number, p1Qty: number, p2Qty: number, exitedQty: number) {
  return initialQty + p1Qty + p2Qty - exitedQty;
}

export function calcExitedQty(...exitQtys: number[]) {
  return exitQtys.reduce((sum, qty) => sum + qty, 0);
}

export function calcAvgExitPrice(exits: { price: number, qty: number }[]) {
  const totalQty = exits.reduce((sum, e) => sum + e.qty, 0);
  const totalValue = exits.reduce((sum, e) => sum + e.price * e.qty, 0);
  return totalQty ? totalValue / totalQty : 0;
}

export function calcStockMove(avgExit: number, avgEntry: number) {
  return avgExit - avgEntry;
}

export function calcRewardRisk(target: number, entry: number, sl: number) {
  return (entry - sl) !== 0 ? (target - entry) / (entry - sl) : 0;
}

export function calcHoldingDays(entryDate: string, exitDate: string) {
  const start = new Date(entryDate);
  const end = new Date(exitDate);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calcRealisedAmount(exitedQty: number, avgExit: number) {
  return exitedQty * avgExit;
}

export function calcPLRs(realisedAmount: number, positionSize: number) {
  return realisedAmount - positionSize;
}

export function calcPFImpact(plRs: number, portfolioValue: number) {
  return portfolioValue ? (plRs / portfolioValue) * 100 : 0;
}

export function calcCummPf(pfImpacts: number[]) {
  return pfImpacts.reduce((sum, pf) => sum + pf, 0);
}

export function calcOpenHeat(trades: any[], portfolioSize: number) {
  if (!portfolioSize || !trades || trades.length === 0) return 0;
  const totalRisk = trades
    .filter(t => t.positionStatus === 'Open')
    .reduce((sum, t) => {
      const entryPrice = t.avgEntry || t.entry || 0;
      const stop = t.tsl || t.sl || 0;
      const qty = t.openQty || 0;
      if (!entryPrice || !stop || !qty) return sum;
      // If stop is at or above entry, no open risk
      if (stop >= entryPrice) return sum;
      // For both Buy and Sell, risk is entry - stop (if stop < entry)
      const risk = (entryPrice - stop) * qty;
      return sum + Math.max(0, risk);
    }, 0);
  return (totalRisk / portfolioSize) * 100;
}

// XIRR calculation helper functions
function daysToYears(days: number): number {
  return days / 365;
}

function calculateNPV(rate: number, dates: Date[], cashFlows: number[]): number {
  return cashFlows.reduce((npv, cashFlow, i) => {
    const yearFraction = daysToYears((dates[i].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24));
    return npv + cashFlow / Math.pow(1 + rate, yearFraction);
  }, 0);
}

function calculateXIRR(dates: Date[], cashFlows: number[], guess = 0.1): number {
  const EPSILON = 0.0000001;
  const MAX_ITERATIONS = 100;
  
  // Check if we have valid inputs
  if (dates.length !== cashFlows.length || dates.length < 2) {
    return 0;
  }
  
  // Verify that we have at least one positive and one negative cash flow
  const hasPositive = cashFlows.some(cf => cf > 0);
  const hasNegative = cashFlows.some(cf => cf < 0);
  if (!hasPositive || !hasNegative) {
    return 0;
  }

  let rate = guess;
  
  // Newton's method implementation
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const npv = calculateNPV(rate, dates, cashFlows);
    
    if (Math.abs(npv) < EPSILON) {
      return rate;
    }
    
    // Calculate derivative of NPV
    const derivative = cashFlows.reduce((sum, cashFlow, j) => {
      const yearFraction = daysToYears((dates[j].getTime() - dates[0].getTime()) / (1000 * 60 * 60 * 24));
      return sum - yearFraction * cashFlow / Math.pow(1 + rate, yearFraction + 1);
    }, 0);
    
    // Update rate using Newton's method
    const newRate = rate - npv / derivative;
    
    if (Math.abs(newRate - rate) < EPSILON) {
      return newRate;
    }
    
    rate = newRate;
  }
  
  return rate;
}

export function calcXIRR(
  startDate: Date,
  startingCapital: number,
  endDate: Date,
  endingCapital: number,
  capitalChanges: { date: Date; amount: number }[]
): number {
  // Sort all cash flows by date
  const allFlows = [
    { date: startDate, amount: -startingCapital }, // Initial investment is negative
    ...capitalChanges,
    { date: endDate, amount: endingCapital } // Final value is positive
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  const dates = allFlows.map(flow => flow.date);
  const cashFlows = allFlows.map(flow => flow.amount);

  return calculateXIRR(dates, cashFlows) * 100; // Convert to percentage
} 