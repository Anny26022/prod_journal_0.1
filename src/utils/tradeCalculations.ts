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

export function calcStockMove(
  avgEntry: number, 
  avgExit: number, 
  cmp: number, 
  openQty: number, 
  exitedQty: number,
  positionStatus: 'Open' | 'Closed' | 'Partial',
  buySell: 'Buy' | 'Sell' = 'Buy'
): number {
  if (!avgEntry) return 0;
  const totalQty = openQty + exitedQty;
  if (totalQty === 0) return 0;

  let movePercentage = 0;

  if (positionStatus === 'Open') {
    // For open positions, use CMP for the entire position
    if (!cmp) return 0;
    movePercentage = ((cmp - avgEntry) / avgEntry) * 100;
  } else if (positionStatus === 'Closed') {
    // For closed positions, use actual exit prices
    if (!avgExit) return 0;
    movePercentage = ((avgExit - avgEntry) / avgEntry) * 100;
  } else if (positionStatus === 'Partial') {
    // For partial positions, calculate weighted average of realized and unrealized moves
    if (!cmp || !avgExit) return 0;
    
    const realizedMove = ((avgExit - avgEntry) / avgEntry) * 100;
    const unrealizedMove = ((cmp - avgEntry) / avgEntry) * 100;
    
    // Calculate weighted average based on quantities
    movePercentage = (
      (realizedMove * exitedQty + unrealizedMove * openQty) / totalQty
    );
  }

  // Invert the percentage for Sell trades
  return buySell === 'Sell' ? -movePercentage : movePercentage;
}

export function calcRewardRisk(
  target: number,
  entry: number,
  sl: number,
  positionStatus: 'Open' | 'Closed' | 'Partial',
  avgExit: number = 0,
  openQty: number = 0,
  exitedQty: number = 0,
  buySell: 'Buy' | 'Sell' = 'Buy'
): number {
  if (!entry || !sl) return 0;
  
  const totalQty = openQty + exitedQty;
  if (totalQty === 0) return 0;

  // Calculate risk (always positive)
  const risk = Math.abs(entry - sl);
  if (risk === 0) return 0;

  let reward = 0;
  
  if (positionStatus === 'Open') {
    // For open positions, use target price for potential reward
    reward = buySell === 'Buy' ? target - entry : entry - target;
  } else if (positionStatus === 'Closed') {
    // For closed positions, use actual average exit price
    reward = buySell === 'Buy' ? avgExit - entry : entry - avgExit;
  } else if (positionStatus === 'Partial') {
    // For partial positions, calculate weighted average of realized and potential reward
    const realizedReward = buySell === 'Buy' ? avgExit - entry : entry - avgExit;
    const potentialReward = buySell === 'Buy' ? target - entry : entry - target;
    
    reward = (realizedReward * exitedQty + potentialReward * openQty) / totalQty;
  }

  // Return absolute R:R ratio
  return Math.abs(reward / risk);
}

interface TradeLeg {
  entryDate: string;
  exitDate?: string | null;
  quantity: number;
}

/**
 * Calculate weighted average holding days for a trade with multiple entries and exits
 * @param trades - Array of trade legs with entryDate, exitDate, and quantity
 * @returns Weighted average holding days across all legs
 */
function calculateWeightedHoldingDays(trades: TradeLeg[]): number {
  if (!trades.length) return 0;
  
  let totalDays = 0;
  let totalQuantity = 0;
  
  for (const trade of trades) {
    if (!trade.entryDate) continue;
    
    const entryDate = new Date(trade.entryDate);
    if (isNaN(entryDate.getTime())) continue;
    
    const exitDate = trade.exitDate ? new Date(trade.exitDate) : new Date();
    if (trade.exitDate && isNaN(exitDate.getTime())) continue;
    
    // Normalize dates to start of day
    entryDate.setHours(0, 0, 0, 0);
    exitDate.setHours(0, 0, 0, 0);
    
    const daysHeld = Math.max(1, Math.ceil((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)));
    totalDays += daysHeld * trade.quantity;
    totalQuantity += trade.quantity;
  }
  
  return totalQuantity > 0 ? Math.round(totalDays / totalQuantity) : 0;
}

/**
 * Calculate holding days between entry and exit dates, supporting multiple entries and exits
 * @param entryDate - Initial entry date in ISO format (YYYY-MM-DD)
 * @param exitDate - Final exit date in ISO format (YYYY-MM-DD) or null/undefined for open positions
 * @param pyramidDates - Array of additional entry dates (P1, P2, etc.) with quantities
 * @param exitDates - Array of exit dates (E1, E2, etc.) with quantities
 * @returns Weighted average holding days across all positions
 */
export function calcHoldingDays(
  entryDate: string, 
  exitDate?: string | null,
  pyramidDates: {date: string, qty: number}[] = [],
  exitDates: {date: string, qty: number}[] = []
): number {
  try {
    if (!entryDate) return 0;
    
    // Create trade legs for initial entry
    const tradeLegs: TradeLeg[] = [];
    
    // Add initial entry
    tradeLegs.push({
      entryDate,
      exitDate: exitDate || null,
      quantity: 1 // Base quantity, will be adjusted by pyramid entries
    });
    
    // Add pyramid entries
    for (const p of pyramidDates) {
      if (!p.date) continue;
      tradeLegs.push({
        entryDate: p.date,
        exitDate: exitDate || null,
        quantity: p.qty || 1
      });
    }
    
    // If we have exit dates, distribute them across the trade legs
    if (exitDates.length > 0) {
      // Sort exits by date to process first exit first
      const sortedExits = [...exitDates].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Distribute exits to trade legs (FIFO - First In First Out)
      let remainingExits = [...sortedExits];
      
      for (const leg of tradeLegs) {
        if (remainingExits.length === 0) break;
        
        const exit = remainingExits[0];
        leg.exitDate = exit.date;
        
        // Reduce the exit quantity from this leg's quantity
        const exitQty = Math.min(leg.quantity, exit.qty);
        exit.qty -= exitQty;
        
        // If this exit is fully used, remove it
        if (exit.qty <= 0) {
          remainingExits.shift();
        }
      }
    }
    
    return calculateWeightedHoldingDays(tradeLegs);
  } catch (error) {
    console.error('Error calculating holding days:', error);
    return 0;
  }
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

export function calcOpenHeat(
  trades: any[], 
  portfolioSize: number, // Keep for backward compatibility or default
  getPortfolioSize?: (month: string, year: number) => number // Pass the getPortfolioSize function
) {
  if (!trades || trades.length === 0) {
    console.log("[DEBUG] calcOpenHeat: No trades or empty trades array.");
    return 0;
  }
  
  console.log("[DEBUG] calcOpenHeat: Calculating total open heat for", trades.length, "trades.");
  
  // Sum the individual Open Heat for each open/partial trade
  const totalOpenHeatValue = trades
    .filter(t => t.positionStatus === 'Open' || t.positionStatus === 'Partial')
    .reduce((sum, trade) => {
      // Use the existing calcTradeOpenHeat logic which correctly uses the date-specific portfolio size
      const tradeHeat = calcTradeOpenHeat(trade, portfolioSize, getPortfolioSize);
      console.log("[DEBUG] calcOpenHeat: Trade", trade.name, "heat:", tradeHeat);
      return sum + tradeHeat;
    }, 0);

  console.log("[DEBUG] calcOpenHeat: Total Open Heat Value before return:", totalOpenHeatValue);
  return totalOpenHeatValue;
}

// Utility to calculate open heat for a single trade
function calcTradeOpenHeat(trade, defaultPortfolioSize, getPortfolioSize) {
  // Get the trade date and extract month/year
  const tradeDate = new Date(trade.date);
  const month = tradeDate.toLocaleString('default', { month: 'short' });
  const year = tradeDate.getFullYear();
  
  // Get the portfolio size for the specific month/year of the trade
  const monthlyPortfolioSize = getPortfolioSize ? getPortfolioSize(month, year) : undefined;
  const effectivePortfolioSize = monthlyPortfolioSize !== undefined ? monthlyPortfolioSize : defaultPortfolioSize;

  console.log(`[DEBUG] calcTradeOpenHeat for ${trade.name}: Month=${month}, Year=${year}, MonthlySize=${monthlyPortfolioSize}, DefaultSize=${defaultPortfolioSize}, EffectiveSize=${effectivePortfolioSize}`);

  const entryPrice = trade.avgEntry || trade.entry || 0;
  const sl = trade.sl || 0;
  const tsl = trade.tsl || 0;
  const qty = trade.openQty || 0;
  let stop = 0;
  if (tsl > 0 && sl > 0) {
    stop = tsl; // Both entered, use TSL
  } else if (tsl > 0) {
    stop = tsl; // Only TSL entered
  } else if (sl > 0) {
    stop = sl; // Only SL entered
  } else {
    stop = 0; // Neither entered
  }
  if (!entryPrice || !stop || !qty) {
    console.log(`[DEBUG] calcTradeOpenHeat for ${trade.name}: Zero entry, stop, or qty. Risk=0.`);
    return 0;
  }
  if (stop >= entryPrice) {
     console.log(`[DEBUG] calcTradeOpenHeat for ${trade.name}: Stop >= Entry. Risk=0.`);
     return 0;
  }
  const risk = (entryPrice - stop) * qty;
  console.log(`[DEBUG] calcTradeOpenHeat for ${trade.name}: Risk=${risk}, EffectiveSize=${effectivePortfolioSize}`);
  
  const heat = effectivePortfolioSize > 0 ? (Math.max(0, risk) / effectivePortfolioSize) * 100 : 0;
  console.log(`[DEBUG] calcTradeOpenHeat for ${trade.name}: Calculated Heat=${heat}`);
  return heat;
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

/**
 * Calculate unrealized P/L for the open quantity of a trade
 * @param avgEntry - average entry price
 * @param cmp - current market price
 * @param openQty - open quantity
 * @param buySell - 'Buy' or 'Sell'
 * @returns Unrealized P/L for the open quantity
 */
export function calcUnrealizedPL(avgEntry: number, cmp: number, openQty: number, buySell: 'Buy' | 'Sell'): number {
  if (!openQty || !avgEntry || !cmp) return 0;
  if (buySell === 'Buy') {
    return (cmp - avgEntry) * openQty;
  } else {
    return (avgEntry - cmp) * openQty;
  }
}

/**
 * Calculate realized P/L using FIFO logic for multiple entries and exits.
 * @param entries - Array of { price, qty } for each entry lot (in order)
 * @param exits - Array of { price, qty } for each exit lot (in order)
 * @param buySell - 'Buy' or 'Sell'
 * @returns Realized P/L for all exited quantity using FIFO
 */
export function calcRealizedPL_FIFO(
  entries: { price: number, qty: number }[],
  exits: { price: number, qty: number }[],
  buySell: 'Buy' | 'Sell'
): number {
  let entryLots = entries.map(e => ({ ...e })); // clone to avoid mutation
  let totalPL = 0;
  for (const exit of exits) {
    let remainingExitQty = exit.qty;
    while (remainingExitQty > 0 && entryLots.length > 0) {
      const lot = entryLots[0];
      const qtyToUse = Math.min(lot.qty, remainingExitQty);
      if (buySell === 'Buy') {
        totalPL += qtyToUse * (exit.price - lot.price);
      } else {
        totalPL += qtyToUse * (lot.price - exit.price);
      }
      lot.qty -= qtyToUse;
      remainingExitQty -= qtyToUse;
      if (lot.qty === 0) entryLots.shift();
    }
  }
  return totalPL;
}

interface EntryMove {
  entryPrice: number;
  qty: number;
  movePercent: number;
  description: string;
}

  export function calcIndividualMoves(
  entries: { price: number; qty: number; description?: string }[],
  cmp: number,
  avgExit: number,
  positionStatus: 'Open' | 'Closed' | 'Partial',
  buySell: 'Buy' | 'Sell' = 'Buy'
): EntryMove[] {
  // Filter out entries with no quantity or price
  const validEntries = entries.filter(e => e.price > 0 && e.qty > 0);
  
  return validEntries.map(entry => {
    let comparePrice = positionStatus === 'Open' ? cmp : avgExit;
    if (positionStatus === 'Partial') {
      // For partial positions, use both CMP and avgExit
      comparePrice = cmp || avgExit;
    }

    let movePercent = 0;
    if (comparePrice && entry.price) {
      movePercent = ((comparePrice - entry.price) / entry.price) * 100;
      // Invert the percentage for Sell trades
      if (buySell === 'Sell') {
        movePercent = -movePercent;
      }
    }

    return {
      entryPrice: entry.price,
      qty: entry.qty,
      movePercent,
      description: entry.description || `Entry at ₹${entry.price}`
    };
  });
}

/**
 * Calculate the weighted average Reward:Risk (R:R) for a trade, using per-entry breakdown and TSL/SL logic.
 * This matches the logic in trade-journal.tsx for consistency across analytics.
 */
import { Trade } from '../types/trade';
export function calcWeightedRewardRisk(trade: Trade): number {
  const entry = Number(trade.entry);
  const sl = Number(trade.sl);
  const tsl = Number(trade.tsl);
  const cmp = Number(trade.cmp);
  const avgExit = Number(trade.avgExitPrice);
  const buySell = trade.buySell;
  const positionStatus = trade.positionStatus;
  const exitedQty = Number(trade.exitedQty);
  const openQty = Number(trade.openQty);
  // Gather all entry lots
  const entries = [
    { label: 'Initial Entry', price: Number(trade.entry), qty: Number(trade.initialQty) },
    { label: 'Pyramid 1', price: Number(trade.pyramid1Price), qty: Number(trade.pyramid1Qty) },
    { label: 'Pyramid 2', price: Number(trade.pyramid2Price), qty: Number(trade.pyramid2Qty) }
  ].filter(e => e.price > 0 && e.qty > 0);
  const totalQtyAll = entries.reduce((sum, e) => sum + (e.qty || 0), 0);
  const entryBreakdown = entries.map(e => {
    // For initial entry, always use SL; for pyramids, use TSL if set and > 0, otherwise SL
    let stop;
    if (e.label === 'Initial Entry') {
      stop = sl;
    } else {
      stop = tsl > 0 ? tsl : sl;
    }
    const rawRisk = e.price - stop; // For Buy
    const risk = Math.abs(rawRisk); // For R:R calculation
    let reward = 0;
    if (positionStatus === 'Open') {
      reward = buySell === 'Buy' ? cmp - e.price : e.price - cmp;
    } else if (positionStatus === 'Closed') {
      reward = buySell === 'Buy' ? avgExit - e.price : e.price - avgExit;
    } else if (positionStatus === 'Partial') {
      const realizedReward = buySell === 'Buy' ? avgExit - e.price : e.price - avgExit;
      const potentialReward = buySell === 'Buy' ? cmp - e.price : e.price - cmp;
      reward = totalQtyAll > 0 ? ((realizedReward * exitedQty + potentialReward * openQty) / totalQtyAll) : 0;
    }
    const rrValue = risk !== 0 ? Math.abs(reward / risk) : 0;
    return {
      rrValue,
      qty: e.qty
    };
  });
  const weightedRR = totalQtyAll > 0
    ? entryBreakdown.reduce((sum, e) => sum + (e.rrValue * (e.qty || 0)), 0) / totalQtyAll
    : 0;
  return weightedRR;
} 