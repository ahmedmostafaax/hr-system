"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export interface ColumnDef<T> {
  key: string | keyof T;
  label: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

export interface DynamicTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  loadingMessage?: string;
  onRowClick?: (row: T) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  tableName?: string;
  isRtl?: boolean;
  onAddClick?: () => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  filterLabel?: string;
}

export default function DynamicTable<T extends { id?: number | string }>({
  data,
  columns,
  loading = false,
  error = null,
  emptyMessage,
  loadingMessage,
  onRowClick,
  onSearch,
  searchPlaceholder,
  tableName,
  isRtl,
  onAddClick,
  pagination,
  filterLabel,
}: DynamicTableProps<T>) {
  const t = useTranslations("common.table");
  const tPagination = useTranslations("common.pagination");
  const params = useParams();
  
  const rtl = isRtl !== undefined ? isRtl : params?.locale === "ar";
  
  const finalEmptyMessage = emptyMessage || t('emptyMessage');
  const finalLoadingMessage = loadingMessage || t('loadingMessage');
  const finalFilterLabel = filterLabel || t('filterLabel');

  const showHeader = tableName || onSearch !== undefined;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-100 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]" dir={rtl ? "rtl" : "ltr"}>
      
      {/* Header Section */}
      {showHeader && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-8 py-7">
          {tableName && (
            <div className="flex items-center gap-3">
              <div className="h-7 w-[5px] rounded-full bg-[#6366f1]" />
              <h3 className="text-[18px] font-bold text-gray-800 tracking-tight">
                {tableName}
              </h3>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-2 font-semibold text-sm transition-all shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {finalFilterLabel}
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`px-8 py-3.5 text-start text-xs font-bold text-gray-500 tracking-wider uppercase ${col.className || ""}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                   <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                   <p className="mt-2 text-sm text-gray-500">{finalLoadingMessage}</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <p className="text-sm font-medium text-red-500 bg-red-50 inline-block px-4 py-2 rounded-lg">{error}</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-slate-100 shadow-inner">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-slate-900 text-lg font-bold">{finalEmptyMessage}</p>
                      <p className="text-slate-500 text-sm mt-1 font-medium">{t('addFirstItem')}</p>
                    </div>
                    {onAddClick && (
                      <button
                        onClick={onAddClick}
                        className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-95"
                      >
                        {t('addNew')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  onClick={() => onRowClick?.(row)}
                  className={`group transition-all duration-200 border-b border-gray-50 last:border-0 ${
                    onRowClick ? "cursor-pointer hover:bg-[#F5F7FA]" : ""
                  } ${index % 2 === 1 ? "bg-[#F8F9FC]" : "bg-white"}`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`px-8 py-6 text-[14.5px] text-gray-600 font-medium whitespace-nowrap ${col.className || ""}`}
                    >
                      {col.render ? col.render(row) : (row[col.key as keyof T] as React.ReactNode) || "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-4 border-t border-gray-100 bg-gray-50/30">
          <div className="text-[13px] text-gray-500 font-medium">
             {tPagination('showing')} <span className="text-gray-900 font-bold">{pagination.currentPage}</span> {tPagination('of')} <span className="text-gray-900 font-bold">{pagination.totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-gray-700 text-[13px] font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
            >
              {tPagination('previous')}
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-gray-700 text-[13px] font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
            >
              {tPagination('next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}