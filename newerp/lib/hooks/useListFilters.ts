"use client";

import { useCallback, useMemo, useState } from "react";

export function useListFilters<T extends Record<string, string>>(initial: T) {
  const [filters, setFilters] = useState<T>(initial);

  const setFilter = useCallback((key: keyof T, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initial);
  }, [initial]);

  const apiParams = useMemo(() => {
    const params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== "" && value !== undefined && value !== null) {
        params[key] = value;
      }
    }
    return params;
  }, [filters]);

  return { filters, setFilter, resetFilters, apiParams };
}
