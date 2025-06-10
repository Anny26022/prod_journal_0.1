import React, { createContext, useContext, useState, useMemo } from "react";

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
  const [filter, setFilter] = useState<GlobalFilter>({ type: 'all' });
  const [loading, setLoading] = React.useState(true);

  // localStorage helpers for global filter
  function fetchGlobalFilter() {
    try {
      const stored = localStorage.getItem('globalFilter');
      return stored ? { filter: JSON.parse(stored) } : null;
    } catch (error) {
      console.error('Error fetching global filter:', error);
      return null;
    }
  }

  function saveGlobalFilter(filterObj: GlobalFilter) {
    try {
      localStorage.setItem('globalFilter', JSON.stringify(filterObj));
    } catch (error) {
      console.error('localStorage save error:', error);
    }
  }

  React.useEffect(() => {
    const row = fetchGlobalFilter();
    if (row && row.filter) {
      setFilter(row.filter);
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!loading) {
      saveGlobalFilter(filter);
    }
  }, [filter, loading]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    filter,
    setFilter
  }), [filter, setFilter]);

  return (
    <GlobalFilterContext.Provider value={contextValue}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = () => useContext(GlobalFilterContext); 