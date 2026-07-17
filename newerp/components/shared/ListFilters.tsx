"use client";

import { useMemo } from "react";
import { RotateCcw } from "lucide-react";
import { SearchableSelect, type SelectOption } from "@/components/ui/SearchableSelect";

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: "select" | "number" | "text";
  options?: SelectOption[];
  placeholder?: string;
  minWidth?: string;
}

interface ListFiltersProps {
  fields: FilterFieldConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  isAr?: boolean;
}

export function ListFilters({
  fields,
  values,
  onChange,
  onReset,
  isAr = true,
}: ListFiltersProps) {
  const hasActiveFilters = useMemo(
    () => Object.values(values).some((v) => v !== ""),
    [values]
  );

  return (
    <div className="mb-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-700">
          {isAr ? "تصفية النتائج" : "Filters"}
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isAr ? "مسح الفلاتر" : "Clear filters"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {fields.map((field) => (
          <div
            key={field.key}
            className="flex flex-col gap-1.5"
            style={{ minWidth: field.minWidth }}
          >
            <label className="text-xs font-semibold text-slate-500">{field.label}</label>
            {field.type === "select" ? (
              <SearchableSelect
                options={field.options ?? []}
                value={values[field.key] ?? ""}
                onChange={(val) => onChange(field.key, String(val))}
                allowClear
                clearLabel={isAr ? "الكل" : "All"}
                placeholder={field.placeholder ?? (isAr ? "الكل" : "All")}
                searchPlaceholder={isAr ? "بحث..." : "Search..."}
              />
            ) : (
              <input
                type={field.type}
                value={values[field.key] ?? ""}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
