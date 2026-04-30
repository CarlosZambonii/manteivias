import { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { startOfMonth, parseISO, format } from 'date-fns';

/**
 * Returns months that have data in a given table/field, sorted descending.
 * Always includes the current month even if empty.
 */
export const useAvailableMonths = (table, dateField, staticFilters = {}) => {
  const [months, setMonths] = useState([new Date()]);

  useEffect(() => {
    const fetch = async () => {
      let query = supabase
        .from(table)
        .select(dateField)
        .not(dateField, 'is', null);

      Object.entries(staticFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) query = query.eq(key, value);
      });

      const { data, error } = await query;
      if (error || !data) return;

      const uniqueKeys = [
        ...new Set(
          data.map(r => {
            try { return format(startOfMonth(parseISO(r[dateField])), 'yyyy-MM'); }
            catch { return null; }
          }).filter(Boolean)
        )
      ].sort((a, b) => b.localeCompare(a));

      const currentKey = format(startOfMonth(new Date()), 'yyyy-MM');
      if (!uniqueKeys.includes(currentKey)) uniqueKeys.unshift(currentKey);

      setMonths(uniqueKeys.map(k => new Date(`${k}-15`)));
    };

    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, dateField]);

  return months;
};
