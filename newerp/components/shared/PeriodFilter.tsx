"use client";

import { CalendarDays } from "lucide-react";
import { monthLabel, yearOptions } from "@/lib/constants/period";
import type { PeriodScope } from "@/lib/hooks/usePeriodFilter";

interface PeriodFilterProps {
  scope: PeriodScope;
  month: number;
  year: number;
  onScopeChange: (scope: PeriodScope) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onAnyChange?: () => void;
  isAr?: boolean;
  className?: string;
}

export function PeriodFilter({
  scope,
  month,
  year,
  onScopeChange,
  onMonthChange,
  onYearChange,
  onAnyChange,
  isAr = true,
  className = "",
}: PeriodFilterProps) {
  const years = yearOptions(6);

  const handleScope = (next: PeriodScope) => {
    onScopeChange(next);
    onAnyChange?.();
  };

  const handleMonth = (next: number) => {
    onMonthChange(next);
    onAnyChange?.();
  };

  const handleYear = (next: number) => {
    onYearChange(next);
    onAnyChange?.();
  };

  return (
    <div
      className={`flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 text-indigo-500">
        <CalendarDays className="h-5 w-5" />
        <span className="text-sm font-bold text-slate-700">
          {isAr ? "الفترة" : "Period"}
        </span>
      </div>

      <div className="flex rounded-lg border border-slate-200 p-0.5">
        <button
          type="button"
          onClick={() => handleScope("month")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            scope === "month"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "شهري" : "Monthly"}
        </button>
        <button
          type="button"
          onClick={() => handleScope("year")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            scope === "year"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "سنوي" : "Yearly"}
        </button>
      </div>

      {scope === "month" && (
        <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
          {isAr ? "الشهر" : "Month"}
          <select
            value={month}
            onChange={(e) => handleMonth(Number(e.target.value))}
            className="h-10 min-w-[140px] rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {monthLabel(m, isAr)}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        {isAr ? "السنة" : "Year"}
        <select
          value={year}
          onChange={(e) => handleYear(Number(e.target.value))}
          className="h-10 min-w-[100px] rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>

      <p className="mb-1 text-xs text-slate-500">
        {scope === "month"
          ? isAr
            ? `عرض بيانات ${monthLabel(month, isAr)} ${year}`
            : `Showing ${monthLabel(month, isAr)} ${year}`
          : isAr
            ? `عرض بيانات سنة ${year}`
            : `Showing year ${year}`}
      </p>
    </div>
  );
}
