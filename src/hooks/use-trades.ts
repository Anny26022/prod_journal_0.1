import React from "react";
import { Trade } from "../types/trade";
import { mockTrades } from "../data/mock-trades";
import { usePortfolio } from "../utils/PortfolioContext";
import { useGlobalFilter } from "../context/GlobalFilterContext";
import { isInGlobalFilter } from "../utils/dateFilterUtils";

// Define SortDirection type compatible with HeroUI Table
type SortDirection = "ascending" | "descending";

export interface SortDescriptor {
  column?: React.Key; // Using React.Key for column to match HeroUI
  direction?: SortDirection;
}

// Key for localStorage
const STORAGE_KEY = 'trades_data';

const loadTrades = (): Trade[] => {
  if (typeof window === 'undefined') return mockTrades;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    // If localStorage is empty (user cleared data), do not return mock data
    return [];
  } catch (error) {
    console.error('Error loading trades from localStorage:', error);
    return mockTrades;
  }
};

export const useTrades = () => {
  const [trades, setTrades] = React.useState<Trade[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trades_searchQuery');
      return saved ? JSON.parse(saved) : "";
    }
    return "";
  });
  const [statusFilter, setStatusFilter] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trades_statusFilter');
      return saved ? JSON.parse(saved) : "";
    }
    return "";
  });
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trades_sortDescriptor');
      return saved ? JSON.parse(saved) : { column: "tradeNo", direction: "ascending" };
    }
    return { column: "tradeNo", direction: "ascending" };
  });
  const [visibleColumns, setVisibleColumns] = React.useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trades_visibleColumns');
      return saved ? JSON.parse(saved) : INITIAL_VISIBLE_COLUMNS;
    }
    return INITIAL_VISIBLE_COLUMNS;
  });
  const { portfolioSize } = usePortfolio();
  const { filter: globalFilter } = useGlobalFilter();

  // Load trades from localStorage on initial render
  React.useEffect(() => {
    const loadedTrades = loadTrades();
    setTrades(loadedTrades);
    setIsLoading(false);
  }, []);

  // Save trades to localStorage whenever they change
  React.useEffect(() => {
    if (trades.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
      } catch (error) {
        console.error('Error saving trades to localStorage:', error);
      }
    }
  }, [trades]);

  // Recalculate trades when portfolio size changes
  React.useEffect(() => {
    if (trades.length > 0) {
      setTrades(prevTrades => 
        prevTrades.map(trade => ({
          ...trade,
          // Recalculate fields that depend on portfolio size
          allocation: portfolioSize > 0 ? (trade.positionSize / portfolioSize) * 100 : 0,
          pfImpact: portfolioSize > 0 ? ((trade.plRs || 0) / portfolioSize) * 100 : 0
        }))
      );
    }
  }, [portfolioSize]);

  const addTrade = (trade: Trade) => {
    setTrades(prev => [trade, ...prev]);
  };

  const updateTrade = (updatedTrade: Trade) => {
    setTrades(prev => 
      prev.map(trade => 
        trade.id === updatedTrade.id ? updatedTrade : trade
      )
    );
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(trade => trade.id !== id));
  };

  const filteredTrades = React.useMemo(() => {
    let result = [...trades];
    
    // Apply global filter
    result = result.filter(trade => isInGlobalFilter(trade.date, globalFilter));
    
    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(trade => 
        trade.name.toLowerCase().includes(lowerQuery) ||
        trade.setup.toLowerCase().includes(lowerQuery) ||
        trade.tradeNo.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      result = result.filter(trade => trade.positionStatus === statusFilter);
    }
    
    // Apply sorting
    if (sortDescriptor.column && sortDescriptor.direction) {
      result.sort((a, b) => {
        const aValue = a[sortDescriptor.column as keyof Trade];
        const bValue = b[sortDescriptor.column as keyof Trade];
        
        let comparison = 0;
        // Handle different data types for sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          // Special handling for date strings if your date format is sortable as string
          if (sortDescriptor.column === 'date' || String(sortDescriptor.column).endsWith('Date')) {
            comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
          } else {
            comparison = aValue.localeCompare(bValue);
          }
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          comparison = (aValue === bValue) ? 0 : aValue ? -1 : 1; 
        } else {
          // Fallback for other types or mixed types (treat as strings)
          const StringA = String(aValue !== null && aValue !== undefined ? aValue : "");
          const StringB = String(bValue !== null && bValue !== undefined ? bValue : "");
          comparison = StringA.localeCompare(StringB);
        }
        
        return sortDescriptor.direction === "ascending" ? comparison : -comparison;
      });
    }
    
    return result;
  }, [trades, globalFilter, searchQuery, statusFilter, sortDescriptor]);

  React.useEffect(() => {
    localStorage.setItem('trades_searchQuery', JSON.stringify(searchQuery));
  }, [searchQuery]);
  React.useEffect(() => {
    localStorage.setItem('trades_statusFilter', JSON.stringify(statusFilter));
  }, [statusFilter]);
  React.useEffect(() => {
    localStorage.setItem('trades_sortDescriptor', JSON.stringify(sortDescriptor));
  }, [sortDescriptor]);
  React.useEffect(() => {
    localStorage.setItem('trades_visibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  return {
    trades: filteredTrades,
    addTrade,
    updateTrade,
    deleteTrade,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortDescriptor,
    setSortDescriptor,
    visibleColumns,
    setVisibleColumns
  };
};

// Define INITIAL_VISIBLE_COLUMNS here, as it's closely tied to the hook's state
const INITIAL_VISIBLE_COLUMNS = [
  "tradeNo", 
  "date", 
  "name", 
  "setup", 
  "buySell", 
  "entry", 
  "avgEntry",
  "sl",
  "slPercent",
  "tsl",
  "cmp",
  "initialQty",
  "pyramid1Price",
  "pyramid1Qty",
  "pyramid1Date",
  "pyramid2Price",
  "pyramid2Qty",
  "pyramid2Date",
  "positionSize", 
  "allocation",
  "exit1Price",
  "exit1Qty",
  "exit1Date",
  "exit2Price",
  "exit2Qty",
  "exit2Date",
  "exit3Price",
  "exit3Qty",
  "exit3Date",
  "openQty",
  "exitedQty",
  "avgExitPrice", 
  "stockMove",
  "openHeat",
  "rewardRisk",
  "holdingDays",
  "positionStatus",
  "realisedAmount",
  "plRs", 
  "pfImpact", 
  "cummPf",
  "planFollowed",
  "exitTrigger",
  "proficiencyGrowthAreas",
  "actions"
];
