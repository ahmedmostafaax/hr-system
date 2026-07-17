"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Loader2,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import { exportTableToExcel } from "@/lib/utils/exportExcel";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
  render?: (row: T) => React.ReactNode;
  /** Plain value for Excel export (overrides key lookup). */
  exportValue?: (row: T) => string | number | null | undefined;
  /** Dot path for Excel export, e.g. Employee.full_name */
  exportKey?: string;
}

export type RowActionType = "view" | "edit" | "delete";

export interface RowAction<T> {
  type: RowActionType;
  label?: string;
  permission?: Permission;
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
}

export interface DataTablePagination {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T extends { id?: number | string }> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  pagination?: DataTablePagination;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchDebounce?: number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
  onRowClick?: (row: T) => void;
  actions?: RowAction<T>[];
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };
  onExport?: () => void;
  exportLabel?: string;
  /** Fetch all rows using current list filters (for Excel export). */
  exportFetcher?: () => Promise<T[]>;
  exportFilename?: string;
  rowKey?: (row: T, index: number) => string | number;
}

function TableSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-gray-50">
          {Array.from({ length: cols }).map((__, ci) => (
            <td key={ci} className="px-6 py-4">
              <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  loading = false,
  error = null,
  pagination,
  searchPlaceholder = "بحث...",
  onSearch,
  searchDebounce = 400,
  sortField,
  sortDirection = "asc",
  onSort,
  onRowClick,
  actions,
  emptyMessage = "لا توجد بيانات",
  emptyAction,
  onExport,
  exportLabel,
  exportFetcher,
  exportFilename = "export",
  rowKey,
}: DataTableProps<T>) {
  const params = useParams();
  const isRtl = params?.locale === "ar";
  const user = getUser();

  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleColumns = useMemo(() => columns, [columns]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (!onSearch) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(value.trim()), searchDebounce);
    },
    [onSearch, searchDebounce]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
    : 1;

  const actionIcon = (type: RowActionType) => {
    switch (type) {
      case "view":
        return <Eye className="w-4 h-4" />;
      case "edit":
        return <Pencil className="w-4 h-4" />;
      case "delete":
        return <Trash2 className="w-4 h-4" />;
    }
  };

  const actionClass = (type: RowActionType) => {
    switch (type) {
      case "view":
        return "hover:text-indigo-600 hover:bg-indigo-50";
      case "edit":
        return "hover:text-blue-600 hover:bg-blue-50";
      case "delete":
        return "hover:text-red-600 hover:bg-red-50";
    }
  };

  const hasActions = actions && actions.length > 0;
  const colCount = visibleColumns.length + (hasActions ? 1 : 0);

  const resolvedExportLabel =
    exportLabel ?? (isRtl ? "تصدير Excel" : "Export Excel");

  const handleExport = useCallback(async () => {
    if (onExport) {
      onExport();
      return;
    }
    if (!exportFetcher) return;

    setExporting(true);
    try {
      const rows = await exportFetcher();
      if (!rows.length) {
        notify.error(isRtl ? "لا توجد بيانات للتصدير" : "No data to export");
        return;
      }
      await exportTableToExcel({
        rows,
        columns: visibleColumns,
        filename: exportFilename,
        sheetName: exportFilename,
        isAr: isRtl,
      });
      notify.success(
        isRtl
          ? `تم تصدير ${rows.length} سجل إلى Excel`
          : `Exported ${rows.length} rows to Excel`
      );
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setExporting(false);
    }
  }, [
    onExport,
    exportFetcher,
    visibleColumns,
    exportFilename,
    isRtl,
  ]);

  const showExport = !!(onExport || exportFetcher);

  return (
    <div
      className="w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {(onSearch || showExport) && (
        <div
          className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 ${isRtl ? "sm:flex-row-reverse" : ""}`}
        >
          {onSearch && (
            <div className="relative flex-1 max-w-md">
              <Search
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none ${isRtl ? "right-3" : "left-3"}`}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={`w-full h-10 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${isRtl ? "pr-10 pl-3" : "pl-10 pr-3"}`}
              />
            </div>
          )}

          {showExport && (
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60 ${isRtl ? "flex-row-reverse" : ""}`}
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {resolvedExportLabel}
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {visibleColumns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-6 py-3 text-start text-xs font-bold text-gray-500 uppercase tracking-wider ${col.className || ""}`}
                >
                  {col.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-indigo-600 transition-colors ${isRtl ? "flex-row-reverse" : ""}`}
                    >
                      {col.label}
                      {sortField === col.key &&
                        (sortDirection === "asc" ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ))}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {hasActions && (
                <th className="px-6 py-3 text-start text-xs font-bold text-gray-500 uppercase w-28">
                  إجراءات
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <TableSkeleton cols={colCount} />
            ) : error ? (
              <tr>
                <td colSpan={colCount} className="py-16 text-center">
                  <p className="text-sm font-medium text-red-500 bg-red-50 inline-block px-4 py-2 rounded-lg">
                    {error}
                  </p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100">
                      <Search className="w-7 h-7" />
                    </div>
                    <p className="text-slate-700 font-semibold">{emptyMessage}</p>
                    {emptyAction && (
                      <button
                        type="button"
                        onClick={emptyAction.onClick}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        {emptyAction.label}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = rowKey?.(row, index) ?? row.id ?? index;
                const visibleActions =
                  actions?.filter(
                    (a) =>
                      (!a.permission || (user && can(user.role, a.permission))) &&
                      !a.hidden?.(row)
                  ) ?? [];

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors border-b border-gray-50 last:border-0 ${
                      onRowClick ? "cursor-pointer hover:bg-slate-50" : ""
                    } ${index % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        style={col.width ? { width: col.width } : undefined}
                        className={`px-6 py-4 text-sm text-gray-600 font-medium ${col.className || ""}`}
                      >
                        {col.render
                          ? col.render(row)
                          : ((row as Record<string, unknown>)[col.key] as React.ReactNode) ??
                            "—"}
                      </td>
                    ))}

                    {hasActions && (
                      <td className="px-6 py-4">
                        <div
                          className={`flex items-center gap-1 ${isRtl ? "flex-row-reverse justify-end" : ""}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {visibleActions.map((action) => (
                            <button
                              key={action.type}
                              type="button"
                              title={action.label}
                              onClick={() => action.onClick(row)}
                              className={`flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 transition-colors ${actionClass(action.type)}`}
                            >
                              {actionIcon(action.type)}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div
          className={`flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30 text-sm ${isRtl ? "flex-row-reverse" : ""}`}
        >
          <span className="text-slate-500">
            صفحة{" "}
            <span className="font-bold text-slate-800">{pagination.page}</span> من{" "}
            <span className="font-bold text-slate-800">{totalPages}</span>
            {" · "}
            <span className="text-slate-400">({pagination.total} سجل)</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
