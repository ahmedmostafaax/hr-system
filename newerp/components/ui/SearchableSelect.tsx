"use client";

import React, { useEffect, useRef, useState } from "react";

export interface SelectOption {
  label: string;
  value: string | number;
  searchText?: string;
}

export interface SearchableSelectProps {
  options: SelectOption[];
  value?: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  className?: string;
  id?: string;
}

function normalizeSearch(text: string) {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}

function matchesOption(option: SelectOption, query: string) {
  const q = normalizeSearch(query);
  if (!q) return true;
  const haystack = normalizeSearch(
    `${option.label} ${option.searchText ?? ""} ${option.value}`
  );
  return haystack.includes(q);
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "— اختر —",
  searchPlaceholder = "بحث...",
  noResultsText = "لا توجد نتائج",
  disabled = false,
  allowClear = false,
  clearLabel = "الكل",
  className = "",
  id,
}: SearchableSelectProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((opt) => matchesOption(opt, search));

  const selectedLabel = options.find(
    (opt) => String(opt.value) === String(value ?? "")
  )?.label;

  const displayValue =
    value === "" || value === null || value === undefined
      ? allowClear
        ? clearLabel
        : null
      : selectedLabel;

  const openDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) setSearch("");
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <button
        id={id}
        type="button"
        onClick={openDropdown}
        disabled={disabled}
        className={`h-10 w-full px-3 rounded-lg border bg-white text-[14px] text-start outline-none transition-all flex items-center justify-between ${
          disabled
            ? "opacity-60 bg-slate-100 cursor-not-allowed border-slate-200"
            : isOpen
              ? "border-indigo-400 ring-2 ring-indigo-100"
              : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className={displayValue ? "text-slate-700 truncate" : "text-slate-400"}>
          {displayValue || placeholder}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <svg
                className="absolute start-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="w-full h-9 ps-8 pe-3 rounded-lg border border-slate-200 bg-slate-50 text-[13px] outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto">
            {allowClear && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`w-full text-start px-4 py-2.5 text-[13px] transition-colors ${
                  value === "" || value === null || value === undefined
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {clearLabel}
              </button>
            )}

            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">{noResultsText}</div>
            ) : (
              filtered.map((opt) => (
                <button
                  type="button"
                  key={String(opt.value)}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full text-start px-4 py-2.5 text-[13px] transition-colors flex items-center justify-between gap-2 ${
                    String(opt.value) === String(value ?? "")
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {String(opt.value) === String(value ?? "") && (
                    <svg
                      className="w-4 h-4 shrink-0 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
