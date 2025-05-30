import React, { createContext, useContext, useState } from "react";

export type FilterType = "all" | "week" | "month" | "fy" | "cy" | "custom";
export interface GlobalFilter {
  type: FilterType;
  startDate?: Date;
  endDate?: Date;
  year?: number;
  month?: number; // 0-11
  fyStartYear?: number;
}

const defaultFilter: GlobalFilter = { type: "all" };

const GlobalFilterContext = createContext<{
  filter: GlobalFilter;
  setFilter: React.Dispatch<React.SetStateAction<GlobalFilter>>;
}>({
  filter: defaultFilter,
  setFilter: () => {},
});

export const GlobalFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const LOCAL_STORAGE_KEY = 'global_filter';
  const [filter, setFilter] = useState<GlobalFilter>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // fallback to default if corrupted
        }
      }
    }
    return defaultFilter;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filter));
    } catch (e) {
      // ignore
    }
  }, [filter]);

  return (
    <GlobalFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = () => useContext(GlobalFilterContext); 