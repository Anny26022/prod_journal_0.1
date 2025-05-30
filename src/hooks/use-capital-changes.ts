import React from 'react';
import { CapitalChange, MonthlyCapital } from '../types/trade';
import { generateId } from '../utils/helpers';

const CAPITAL_CHANGES_STORAGE_KEY = 'capital_changes';

const loadCapitalChanges = (): CapitalChange[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const saved = localStorage.getItem(CAPITAL_CHANGES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading capital changes from localStorage:', error);
    return [];
  }
};

export const useCapitalChanges = (trades: any[], portfolioSize: number) => {
  const [capitalChanges, setCapitalChanges] = React.useState<CapitalChange[]>([]);
  const [monthlyCapital, setMonthlyCapital] = React.useState<MonthlyCapital[]>([]);

  // Load capital changes from localStorage
  React.useEffect(() => {
    const loadedChanges = loadCapitalChanges();
    setCapitalChanges(loadedChanges);
  }, []);

  // Save capital changes to localStorage
  React.useEffect(() => {
    if (capitalChanges.length > 0) {
      try {
        localStorage.setItem(CAPITAL_CHANGES_STORAGE_KEY, JSON.stringify(capitalChanges));
      } catch (error) {
        console.error('Error saving capital changes to localStorage:', error);
      }
    }
  }, [capitalChanges]);

  // Calculate monthly capital data
  React.useEffect(() => {
    // Group trades and capital changes by month
    const monthlyData: Record<string, {
      trades: any[];
      changes: CapitalChange[];
      date: Date;
    }> = {};

    // Process trades
    trades.forEach(trade => {
      const date = new Date(trade.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { trades: [], changes: [], date };
      }
      monthlyData[key].trades.push(trade);
    });

    // Process capital changes
    capitalChanges.forEach(change => {
      const date = new Date(change.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { trades: [], changes: [], date };
      }
      monthlyData[key].changes.push(change);
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort();

    // Find the first month with a trade
    const firstTradeMonthKey = sortedMonths.find(key => monthlyData[key].trades.length > 0);
    let runningCapital = portfolioSize;
    if (firstTradeMonthKey) {
      // Sum all deposits/withdrawals before the first trade month
      const firstTradeDate = monthlyData[firstTradeMonthKey].date;
      const priorChanges = capitalChanges.filter(c => new Date(c.date) < firstTradeDate);
      const priorDeposits = priorChanges.filter(c => c.type === 'deposit').reduce((sum, c) => sum + c.amount, 0);
      const priorWithdrawals = priorChanges.filter(c => c.type === 'withdrawal').reduce((sum, c) => sum + Math.abs(c.amount), 0);
      runningCapital = portfolioSize + priorDeposits - priorWithdrawals;
    }

    const monthlyCapitalData = sortedMonths.map(monthKey => {
      const { trades, changes, date } = monthlyData[monthKey];
      // Calculate deposits and withdrawals for this month
      const deposits = changes
        .filter(c => c.type === 'deposit')
        .reduce((sum, c) => sum + c.amount, 0);
      const withdrawals = changes
        .filter(c => c.type === 'withdrawal')
        .reduce((sum, c) => sum + Math.abs(c.amount), 0);

      // For months with no trades, starting capital is zero
      let startingCapital = 0;
      if (trades.length > 0) {
        // Apply deposits/withdrawals BEFORE calculating starting capital for the month
        runningCapital = runningCapital + deposits - withdrawals;
        startingCapital = runningCapital;
      } else {
        // Still update runningCapital for months with only capital changes
        runningCapital = runningCapital + deposits - withdrawals;
      }

      // Calculate P/L
      const pl = trades.reduce((sum, t) => sum + (t.plRs || 0), 0);

      // Update running capital after P/L (only if there are trades)
      if (trades.length > 0) {
        runningCapital = runningCapital + pl;
      }

      return {
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        startingCapital,
        deposits,
        withdrawals,
        pl,
        finalCapital: runningCapital
      };
    });

    setMonthlyCapital(monthlyCapitalData);
  }, [trades, capitalChanges, portfolioSize]);

  const addCapitalChange = (change: Omit<CapitalChange, 'id'>) => {
    const newChange = {
      ...change,
      id: generateId()
    };
    setCapitalChanges(prev => [...prev, newChange]);
  };

  const updateCapitalChange = (updatedChange: CapitalChange) => {
    setCapitalChanges(prev => 
      prev.map(change => 
        change.id === updatedChange.id ? updatedChange : change
      )
    );
  };

  const deleteCapitalChange = (id: string) => {
    setCapitalChanges(prev => prev.filter(change => change.id !== id));
  };

  return {
    capitalChanges,
    monthlyCapital,
    addCapitalChange,
    updateCapitalChange,
    deleteCapitalChange
  };
}; 