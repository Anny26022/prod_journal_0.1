import React, { createContext, useContext, useState } from "react";
import { supabase, SINGLE_USER_ID } from '../utils/supabaseClient';

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

  // Supabase helpers for global filter
  async function fetchGlobalFilter() {
    const { data, error } = await supabase
      .from('global_filters')
      .select('filter')
      .eq('id', SINGLE_USER_ID)
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching global filter:', error);
    }
    return data;
  }

  async function upsertGlobalFilter(filterObj: GlobalFilter) {
    const { error } = await supabase
      .from('global_filters')
      .upsert({ id: SINGLE_USER_ID, filter: filterObj }, { onConflict: 'id' });
    if (error) console.error('Supabase upsert error:', error);
  }

  React.useEffect(() => {
    fetchGlobalFilter().then((row) => {
      if (row && row.filter) {
        setFilter(row.filter);
      }
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    if (!loading) {
      upsertGlobalFilter(filter);
    }
  }, [filter, loading]);

  return (
    <GlobalFilterContext.Provider value={{ filter, setFilter }}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = () => useContext(GlobalFilterContext); 