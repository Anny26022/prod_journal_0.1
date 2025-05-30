import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PriceTick, fetchPriceTicks, getTodayMarketOpen, isMarketOpen } from '../utils/priceTickApi';
import { isWeekend } from 'date-fns';

interface ProcessedTick extends Omit<PriceTick, 'dateTime'> {
  dateTime: string;
  timestamp: number;
}

export const usePriceTicks = (symbol: string) => {
  const [priceTicks, setPriceTicks] = useState<ProcessedTick[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const processTicks = useCallback((data: any): ProcessedTick[] => {
    if (!data?.data?.ticks?.[symbol]) return [];
    
    return data.data.ticks[symbol].map((tick: any) => ({
      dateTime: tick[0],
      timestamp: new Date(tick[0]).getTime(),
      open: tick[1],
      high: tick[2],
      low: tick[3],
      close: tick[4],
      volume: tick[5],
      dayVolume: tick[6]
    }));
  }, [symbol]);

  // Fetch data for the current market session
  const fetchTicks = useCallback(async (fromDate?: Date, toDate?: Date) => {
    if (!symbol || !isMounted.current) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchPriceTicks(symbol, fromDate, toDate);
      const processed = processTicks(data);
      
      if (isMounted.current) {
        setPriceTicks(processed);
        setLastUpdated(new Date());
      }
      
      return processed;
    } catch (err) {
      if (isMounted.current) {
        console.error('Error in usePriceTicks:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch price ticks'));
      }
      return [];
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [symbol, processTicks]);

  // Start polling at 1-minute intervals during market hours
  const startPolling = useCallback(() => {
    // Don't poll on weekends
    if (isWeekend(new Date())) {
      return;
    }
    
    // Initial fetch with today's market open time
    fetchTicks(getTodayMarketOpen(), new Date());
    
    // Set up polling
    pollingIntervalRef.current = setInterval(() => {
      if (isMarketOpen()) {
        fetchTicks(getTodayMarketOpen(), new Date());
      }
    }, 60000); // 1 minute
    
    return () => {
      stopPolling();
    };
  }, [symbol, fetchTicks]);
  
  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Initialize and clean up
  useEffect(() => {
    isMounted.current = true;
    startPolling();
    
    return () => {
      isMounted.current = false;
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Function to refresh data
  const refresh = useCallback((fromDate?: Date, toDate?: Date) => {
    return fetchTicks(fromDate, toDate);
  }, [fetchTicks]);

  // Get the latest price
  const latestPrice = useMemo(() => {
    if (priceTicks.length === 0) return null;
    return priceTicks[priceTicks.length - 1];
  }, [priceTicks]);

  // Get price at a specific time
  const getPriceAtTime = useCallback((timestamp: Date): ProcessedTick | null => {
    if (priceTicks.length === 0) return null;
    
    const targetTime = timestamp.getTime();
    
    // Find the closest timestamp
    return priceTicks.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.timestamp - targetTime);
      const currDiff = Math.abs(curr.timestamp - targetTime);
      return prevDiff < currDiff ? prev : curr;
    });
  }, [priceTicks]);

  // Get price change percentage
  const priceChange = useMemo(() => {
    if (priceTicks.length < 2) return 0;
    const first = priceTicks[0].close;
    const last = priceTicks[priceTicks.length - 1].close;
    return ((last - first) / first) * 100;
  }, [priceTicks]);

  // Get today's market open time (9:15 AM IST)
  const getTodayMarketOpen = useCallback((): Date => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Market opens at 9:15 AM IST (UTC+5:30)
    today.setHours(9, 15, 0, 0);
    return today;
  }, []);

  return {
    priceTicks,
    latestPrice,
    loading,
    error,
    lastUpdated,
    priceChange,
    refresh,
    getPriceAtTime,
    isMarketOpen: isMarketOpen()
  };
};
