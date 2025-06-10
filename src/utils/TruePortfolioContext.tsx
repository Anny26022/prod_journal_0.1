import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { supabase, SINGLE_USER_ID } from './supabaseClient';

export interface YearlyStartingCapital {
  year: number;
  startingCapital: number;
  updatedAt: string;
}

export interface MonthlyStartingCapitalOverride {
  id: string;
  month: string; // Short month name like 'Jan', 'Feb'
  year: number;
  startingCapital: number;
  updatedAt: string;
}

export interface CapitalChange {
  id: string;
  date: string;
  amount: number;  // Positive for deposits, negative for withdrawals
  type: 'deposit' | 'withdrawal';
  description: string;
}

export interface MonthlyTruePortfolio {
  month: string;
  year: number;
  startingCapital: number;
  capitalChanges: number; // Net deposits - withdrawals for the month
  pl: number; // P&L from trades for the month
  finalCapital: number; // Starting + changes + P&L
}

interface TruePortfolioContextType {
  // Core functions
  getTruePortfolioSize: (month: string, year: number) => number;
  getLatestTruePortfolioSize: () => number;

  // Starting capital management
  yearlyStartingCapitals: YearlyStartingCapital[];
  setYearlyStartingCapital: (year: number, amount: number) => void;
  getYearlyStartingCapital: (year: number) => number;

  // Monthly starting capital overrides
  monthlyStartingCapitalOverrides: MonthlyStartingCapitalOverride[];
  setMonthlyStartingCapitalOverride: (month: string, year: number, amount: number) => void;
  removeMonthlyStartingCapitalOverride: (month: string, year: number) => void;
  getMonthlyStartingCapitalOverride: (month: string, year: number) => number | null;

  // Capital changes
  capitalChanges: CapitalChange[];
  addCapitalChange: (change: Omit<CapitalChange, 'id'>) => void;
  updateCapitalChange: (change: CapitalChange) => void;
  deleteCapitalChange: (id: string) => void;

  // Monthly calculations
  getMonthlyTruePortfolio: (month: string, year: number) => MonthlyTruePortfolio;
  getAllMonthlyTruePortfolios: () => MonthlyTruePortfolio[];

  // Backward compatibility
  portfolioSize: number; // Latest true portfolio size
}

const TruePortfolioContext = createContext<TruePortfolioContextType | undefined>(undefined);

// Supabase helpers
async function fetchYearlyStartingCapitals() {
  console.log('📥 Loading yearly starting capitals from Supabase...');
  const { data, error } = await supabase
    .from('yearly_starting_capitals')
    .select('capitals')
    .eq('id', SINGLE_USER_ID)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error fetching yearly starting capitals:', error);
  } else {
    console.log('✅ Yearly starting capitals loaded:', data?.capitals || []);
  }
  return data?.capitals || [];
}

async function upsertYearlyStartingCapitals(capitals: YearlyStartingCapital[]) {
  console.log('💾 Saving yearly starting capitals to Supabase:', capitals);
  const { error } = await supabase
    .from('yearly_starting_capitals')
    .upsert({ id: SINGLE_USER_ID, capitals }, { onConflict: 'id' });
  if (error) {
    console.error('❌ Supabase upsert error for yearly capitals:', error);
  } else {
    console.log('✅ Yearly starting capitals saved successfully');
  }
}

async function fetchCapitalChanges() {
  console.log('📥 Loading capital changes from Supabase...');
  const { data, error } = await supabase
    .from('capital_changes')
    .select('changes')
    .eq('id', SINGLE_USER_ID)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error fetching capital changes:', error);
  } else {
    console.log('✅ Capital changes loaded:', data?.changes || []);
  }
  return data?.changes || [];
}

async function upsertCapitalChanges(changes: CapitalChange[]) {
  console.log('💾 Saving capital changes to Supabase:', changes);
  const { error } = await supabase
    .from('capital_changes')
    .upsert({ id: SINGLE_USER_ID, changes }, { onConflict: 'id' });
  if (error) {
    console.error('❌ Supabase upsert error for capital changes:', error);
  } else {
    console.log('✅ Capital changes saved successfully');
  }
}

async function fetchMonthlyStartingCapitalOverrides() {
  console.log('📥 Loading monthly starting capital overrides from Supabase...');
  const { data, error } = await supabase
    .from('monthly_starting_capital_overrides')
    .select('overrides')
    .eq('id', SINGLE_USER_ID)
    .single();
  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error fetching monthly starting capital overrides:', error);
  } else {
    console.log('✅ Monthly starting capital overrides loaded:', data?.overrides || []);
  }
  return data?.overrides || [];
}

async function upsertMonthlyStartingCapitalOverrides(overrides: MonthlyStartingCapitalOverride[]) {
  console.log('💾 Saving monthly starting capital overrides to Supabase:', overrides);
  const { error } = await supabase
    .from('monthly_starting_capital_overrides')
    .upsert({ id: SINGLE_USER_ID, overrides }, { onConflict: 'id' });
  if (error) {
    console.error('❌ Supabase upsert error for monthly overrides:', error);
  } else {
    console.log('✅ Monthly starting capital overrides saved successfully');
  }
}

export const TruePortfolioProvider = ({ children }: { children: ReactNode }) => {
  const [yearlyStartingCapitals, setYearlyStartingCapitals] = useState<YearlyStartingCapital[]>([]);
  const [capitalChanges, setCapitalChanges] = useState<CapitalChange[]>([]);
  const [monthlyStartingCapitalOverrides, setMonthlyStartingCapitalOverrides] = useState<MonthlyStartingCapitalOverride[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from Supabase and localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from Supabase first
        const [capitals, changes, overrides] = await Promise.all([
          fetchYearlyStartingCapitals(),
          fetchCapitalChanges(),
          fetchMonthlyStartingCapitalOverrides()
        ]);

        if (Array.isArray(capitals) && capitals.length > 0) {
          setYearlyStartingCapitals(capitals);
        } else {
          // Fallback to localStorage
          const localCapitals = localStorage.getItem('yearlyStartingCapitals');
          if (localCapitals) {
            try {
              const parsed = JSON.parse(localCapitals);
              if (Array.isArray(parsed)) {
                setYearlyStartingCapitals(parsed);
              }
            } catch (e) {
              console.warn('Failed to parse localStorage yearlyStartingCapitals');
            }
          }
        }

        if (Array.isArray(changes) && changes.length > 0) {
          setCapitalChanges(changes);
        } else {
          // Fallback to localStorage
          const localChanges = localStorage.getItem('capitalChanges');
          if (localChanges) {
            try {
              const parsed = JSON.parse(localChanges);
              if (Array.isArray(parsed)) {
                setCapitalChanges(parsed);
              }
            } catch (e) {
              console.warn('Failed to parse localStorage capitalChanges');
            }
          }
        }

        if (Array.isArray(overrides) && overrides.length > 0) {
          setMonthlyStartingCapitalOverrides(overrides);
        } else {
          // Fallback to localStorage
          const localOverrides = localStorage.getItem('monthlyStartingCapitalOverrides');
          if (localOverrides) {
            try {
              const parsed = JSON.parse(localOverrides);
              if (Array.isArray(parsed)) {
                setMonthlyStartingCapitalOverrides(parsed);
              }
            } catch (e) {
              console.warn('Failed to parse localStorage monthlyStartingCapitalOverrides');
            }
          }
        }
      } catch (error) {
        console.error('Error loading true portfolio data:', error);
        // Load from localStorage as fallback
        try {
          const localCapitals = localStorage.getItem('yearlyStartingCapitals');
          const localChanges = localStorage.getItem('capitalChanges');
          const localOverrides = localStorage.getItem('monthlyStartingCapitalOverrides');

          if (localCapitals) {
            const parsed = JSON.parse(localCapitals);
            if (Array.isArray(parsed)) setYearlyStartingCapitals(parsed);
          }

          if (localChanges) {
            const parsed = JSON.parse(localChanges);
            if (Array.isArray(parsed)) setCapitalChanges(parsed);
          }

          if (localOverrides) {
            const parsed = JSON.parse(localOverrides);
            if (Array.isArray(parsed)) setMonthlyStartingCapitalOverrides(parsed);
          }
        } catch (e) {
          console.warn('Failed to load from localStorage fallback');
        }
      } finally {
        setHydrated(true);
      }
    };

    loadData();
  }, []);

  // Save to Supabase and localStorage when data changes
  useEffect(() => {
    if (hydrated) {
      // Save to Supabase
      upsertYearlyStartingCapitals(yearlyStartingCapitals);
      // Also save to localStorage as backup
      try {
        localStorage.setItem('yearlyStartingCapitals', JSON.stringify(yearlyStartingCapitals));
      } catch (error) {
        console.warn('Failed to save yearlyStartingCapitals to localStorage:', error);
      }
    }
  }, [yearlyStartingCapitals, hydrated]);

  useEffect(() => {
    if (hydrated) {
      // Save to Supabase
      upsertCapitalChanges(capitalChanges);
      // Also save to localStorage as backup
      try {
        localStorage.setItem('capitalChanges', JSON.stringify(capitalChanges));
      } catch (error) {
        console.warn('Failed to save capitalChanges to localStorage:', error);
      }
    }
  }, [capitalChanges, hydrated]);

  useEffect(() => {
    if (hydrated) {
      // Save to Supabase
      upsertMonthlyStartingCapitalOverrides(monthlyStartingCapitalOverrides);
      // Also save to localStorage as backup
      try {
        localStorage.setItem('monthlyStartingCapitalOverrides', JSON.stringify(monthlyStartingCapitalOverrides));
      } catch (error) {
        console.warn('Failed to save monthlyStartingCapitalOverrides to localStorage:', error);
      }
    }
  }, [monthlyStartingCapitalOverrides, hydrated]);

  const setYearlyStartingCapital = useCallback((year: number, amount: number) => {
    setYearlyStartingCapitals(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(item => item.year === year);
      
      const newCapital = {
        year,
        startingCapital: amount,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        updated[existingIndex] = newCapital;
      } else {
        updated.push(newCapital);
      }
      
      return updated.sort((a, b) => a.year - b.year);
    });
  }, []);

  const getYearlyStartingCapital = useCallback((year: number): number => {
    const capital = yearlyStartingCapitals.find(item => item.year === year);
    return capital?.startingCapital || 0;
  }, [yearlyStartingCapitals]);

  const setMonthlyStartingCapitalOverride = useCallback((month: string, year: number, amount: number) => {
    const normalizedMonth = month.length > 3 ?
      ({ "January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr", "May": "May", "June": "Jun",
         "July": "Jul", "August": "Aug", "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec" }[month] || month) :
      month;

    setMonthlyStartingCapitalOverrides(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(item => item.month === normalizedMonth && item.year === year);

      const newOverride: MonthlyStartingCapitalOverride = {
        id: `${normalizedMonth}-${year}`,
        month: normalizedMonth,
        year,
        startingCapital: amount,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        updated[existingIndex] = newOverride;
      } else {
        updated.push(newOverride);
      }

      return updated.sort((a, b) => a.year - b.year || a.month.localeCompare(b.month));
    });
  }, []);

  const removeMonthlyStartingCapitalOverride = useCallback((month: string, year: number) => {
    const normalizedMonth = month.length > 3 ?
      ({ "January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr", "May": "May", "June": "Jun",
         "July": "Jul", "August": "Aug", "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec" }[month] || month) :
      month;

    setMonthlyStartingCapitalOverrides(prev =>
      prev.filter(item => !(item.month === normalizedMonth && item.year === year))
    );
  }, []);

  const getMonthlyStartingCapitalOverride = useCallback((month: string, year: number): number | null => {
    const normalizedMonth = month.length > 3 ?
      ({ "January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr", "May": "May", "June": "Jun",
         "July": "Jul", "August": "Aug", "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec" }[month] || month) :
      month;

    const override = monthlyStartingCapitalOverrides.find(item => item.month === normalizedMonth && item.year === year);
    return override ? override.startingCapital : null;
  }, [monthlyStartingCapitalOverrides]);

  const addCapitalChange = useCallback((change: Omit<CapitalChange, 'id'>) => {
    const newChange = {
      ...change,
      id: `capital_${new Date().getTime()}_${Math.random()}`
    };
    
    setCapitalChanges(prev => [...prev, newChange]);
  }, []);

  const updateCapitalChange = useCallback((updatedChange: CapitalChange) => {
    setCapitalChanges(prev => 
      prev.map(change => 
        change.id === updatedChange.id ? updatedChange : change
      )
    );
  }, []);

  const deleteCapitalChange = useCallback((id: string) => {
    setCapitalChanges(prev => prev.filter(change => change.id !== id));
  }, []);

  // Helper function to get trades P&L for a specific month/year
  const getTradesPLForMonth = useCallback((month: string, year: number, trades: any[] = []): number => {
    if (!trades || trades.length === 0) return 0;

    return trades
      .filter(trade => {
        if (!trade.date) return false;
        const tradeDate = new Date(trade.date);
        const tradeMonth = tradeDate.toLocaleString('default', { month: 'short' });
        const tradeYear = tradeDate.getFullYear();
        return tradeMonth === month && tradeYear === year;
      })
      .reduce((sum, trade) => {
        // Use plRs if available, otherwise calculate basic P&L
        if (trade.plRs !== undefined && trade.plRs !== null) {
          return sum + trade.plRs;
        }
        // Fallback calculation for trades without plRs
        const exitedQty = trade.exitedQty || 0;
        const avgExitPrice = trade.avgExitPrice || 0;
        const avgEntry = trade.avgEntry || trade.entry || 0;
        if (exitedQty > 0 && avgExitPrice > 0 && avgEntry > 0) {
          const pl = trade.buySell === 'Buy'
            ? (avgExitPrice - avgEntry) * exitedQty
            : (avgEntry - avgExitPrice) * exitedQty;
          return sum + pl;
        }
        return sum;
      }, 0);
  }, []);

  // Helper function to get capital changes for a specific month/year
  const getCapitalChangesForMonth = useCallback((month: string, year: number): number => {
    return capitalChanges
      .filter(change => {
        if (!change.date) return false;
        const changeDate = new Date(change.date);
        const changeMonth = changeDate.toLocaleString('default', { month: 'short' });
        const changeYear = changeDate.getFullYear();
        return changeMonth === month && changeYear === year;
      })
      .reduce((sum, change) => {
        return sum + (change.type === 'deposit' ? change.amount : -change.amount);
      }, 0);
  }, [capitalChanges]);

  // Helper function to normalize month names
  const normalizeMonth = useCallback((month: string): string => {
    // If it's already a short month name, return as is
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (shortMonths.includes(month)) {
      return month;
    }

    // Convert full month names to short month names
    const monthMap: Record<string, string> = {
      "January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr",
      "May": "May", "June": "Jun", "July": "Jul", "August": "Aug",
      "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec"
    };

    return monthMap[month] || month;
  }, []);

  // Core function to calculate monthly true portfolio with memoization
  const calculateMonthlyTruePortfolio = useCallback((month: string, year: number, trades: any[] = [], memo: Map<string, MonthlyTruePortfolio> = new Map()): MonthlyTruePortfolio => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Normalize the month name
    const normalizedMonth = normalizeMonth(month);
    const monthIndex = months.indexOf(normalizedMonth);

    if (monthIndex === -1) {
      console.warn(`Invalid month: ${month} (normalized: ${normalizedMonth}). Expected one of: ${months.join(', ')}`);
      throw new Error(`Invalid month: ${month}. Expected short month names like 'Jan', 'Feb', etc.`);
    }

    const key = `${normalizedMonth}-${year}`;
    if (memo.has(key)) {
      return memo.get(key)!;
    }

    let startingCapital = 0;

    // Check for monthly starting capital override first
    const override = getMonthlyStartingCapitalOverride(normalizedMonth, year);
    if (override !== null) {
      startingCapital = override;
    } else if (normalizedMonth === 'Jan') {
      // January: Use yearly starting capital
      startingCapital = getYearlyStartingCapital(year);
    } else {
      // Other months: Get final capital from previous month
      const prevMonthIndex = monthIndex - 1;
      const prevMonth = months[prevMonthIndex];
      const prevMonthData = calculateMonthlyTruePortfolio(prevMonth, year, trades, memo);
      startingCapital = prevMonthData.finalCapital;
    }

    // Get capital changes for this month
    const capitalChangesAmount = getCapitalChangesForMonth(normalizedMonth, year);

    // Revised starting capital = original starting capital + capital changes
    const revisedStartingCapital = startingCapital + capitalChangesAmount;

    // Get P&L for this month
    const pl = getTradesPLForMonth(normalizedMonth, year, trades);

    // Final capital = revised starting capital + P&L
    const finalCapital = revisedStartingCapital + pl;

    const result: MonthlyTruePortfolio = {
      month: normalizedMonth, // Always return normalized month name
      year,
      startingCapital: revisedStartingCapital, // This is the revised starting capital
      capitalChanges: capitalChangesAmount,
      pl,
      finalCapital
    };

    memo.set(key, result);
    return result;
  }, [getYearlyStartingCapital, getCapitalChangesForMonth, getTradesPLForMonth, normalizeMonth, getMonthlyStartingCapitalOverride]);

  // Public function to get monthly true portfolio
  const getMonthlyTruePortfolio = useCallback((month: string, year: number, trades: any[] = []): MonthlyTruePortfolio => {
    return calculateMonthlyTruePortfolio(month, year, trades);
  }, [calculateMonthlyTruePortfolio]);

  // Get true portfolio size for a specific month/year
  const getTruePortfolioSize = useCallback((month: string, year: number, trades: any[] = []): number => {
    try {
      const monthlyData = getMonthlyTruePortfolio(month, year, trades);
      return monthlyData.finalCapital;
    } catch (error) {
      console.warn(`Error getting true portfolio size for ${month} ${year}:`, error);
      return 100000; // Fallback value
    }
  }, [getMonthlyTruePortfolio]);

  // Get latest true portfolio size
  const getLatestTruePortfolioSize = useCallback((trades: any[] = []): number => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleString('default', { month: 'short' });
      const currentYear = currentDate.getFullYear();

      return getTruePortfolioSize(currentMonth, currentYear, trades);
    } catch (error) {
      console.warn('Error calculating latest true portfolio size:', error);
      return 100000; // Fallback value
    }
  }, [getTruePortfolioSize]);

  // Get all monthly true portfolios for a year or range
  const getAllMonthlyTruePortfolios = useCallback((trades: any[] = []): MonthlyTruePortfolio[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: MonthlyTruePortfolio[] = [];
    const memo = new Map<string, MonthlyTruePortfolio>();

    // Get all years that have starting capital or trades
    const yearsWithData = new Set<number>();

    // Add years from starting capitals
    yearlyStartingCapitals.forEach(capital => yearsWithData.add(capital.year));

    // Add years from trades
    trades.forEach(trade => {
      if (trade.date) {
        const tradeYear = new Date(trade.date).getFullYear();
        yearsWithData.add(tradeYear);
      }
    });

    // Add years from capital changes
    capitalChanges.forEach(change => {
      if (change.date) {
        const changeYear = new Date(change.date).getFullYear();
        yearsWithData.add(changeYear);
      }
    });

    // Sort years
    const sortedYears = Array.from(yearsWithData).sort();

    // Calculate for each month of each year using shared memo
    sortedYears.forEach(year => {
      months.forEach(month => {
        try {
          const monthlyData = calculateMonthlyTruePortfolio(month, year, trades, memo);
          result.push(monthlyData);
        } catch (error) {
          // Skip months with no data
        }
      });
    });

    return result;
  }, [yearlyStartingCapitals, capitalChanges, calculateMonthlyTruePortfolio]);

  // Backward compatibility - get current portfolio size
  const portfolioSize = React.useMemo(() => {
    try {
      return getLatestTruePortfolioSize();
    } catch (error) {
      console.warn('Error getting portfolio size:', error);
      return 100000; // Fallback value
    }
  }, [getLatestTruePortfolioSize]);

  // Only render children after hydration
  if (!hydrated) return null;

  return (
    <TruePortfolioContext.Provider
      value={{
        getTruePortfolioSize,
        getLatestTruePortfolioSize,
        yearlyStartingCapitals,
        setYearlyStartingCapital,
        getYearlyStartingCapital,
        monthlyStartingCapitalOverrides,
        setMonthlyStartingCapitalOverride,
        removeMonthlyStartingCapitalOverride,
        getMonthlyStartingCapitalOverride,
        capitalChanges,
        addCapitalChange,
        updateCapitalChange,
        deleteCapitalChange,
        getMonthlyTruePortfolio,
        getAllMonthlyTruePortfolios,
        portfolioSize
      }}
    >
      {children}
    </TruePortfolioContext.Provider>
  );
};

export const useTruePortfolio = (): TruePortfolioContextType => {
  const ctx = useContext(TruePortfolioContext);
  if (!ctx) throw new Error("useTruePortfolio must be used within a TruePortfolioProvider");
  return ctx;
};
