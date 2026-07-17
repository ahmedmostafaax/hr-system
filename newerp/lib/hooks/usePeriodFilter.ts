"use client";

import { useCallback, useMemo, useState } from "react";

export type PeriodScope = "month" | "year";

export function usePeriodFilter(initialScope: PeriodScope = "month") {
  const now = new Date();
  const [scope, setScope] = useState<PeriodScope>(initialScope);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const apiParams = useMemo(
    () => ({
      period: scope,
      year,
      ...(scope === "month" ? { month } : {}),
    }),
    [scope, month, year]
  );

  const reset = useCallback(() => {
    const d = new Date();
    setScope("month");
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  }, []);

  return {
    scope,
    setScope,
    month,
    setMonth,
    year,
    setYear,
    apiParams,
    reset,
  };
}
