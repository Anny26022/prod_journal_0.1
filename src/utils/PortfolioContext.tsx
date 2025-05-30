import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface PortfolioContextType {
  portfolioSize: number;
  setPortfolioSize: (size: number) => void;
}

const PORTFOLIO_SIZE_KEY = 'portfolioSize';
const DEFAULT_PORTFOLIO_SIZE = 1000000; // Default 10 lakh

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const [portfolioSize, setPortfolioSizeState] = useState<number>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PORTFOLIO_SIZE_KEY);
      return saved ? Number(saved) : DEFAULT_PORTFOLIO_SIZE;
    }
    return DEFAULT_PORTFOLIO_SIZE;
  });

  // Update localStorage when portfolioSize changes
  useEffect(() => {
    localStorage.setItem(PORTFOLIO_SIZE_KEY, portfolioSize.toString());
  }, [portfolioSize]);

  // Wrapper function to update both state and localStorage
  const setPortfolioSize = (size: number) => {
    setPortfolioSizeState(size);
  };

  return (
    <PortfolioContext.Provider value={{ portfolioSize, setPortfolioSize }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within a PortfolioProvider");
  return ctx;
};