"use client";

import React, { useState, useEffect } from "react";
import { SearchableSelect, type SelectOption } from "./SearchableSelect";

export type FieldType = "text" | "select" | "searchable-select" | "multi-select" | "number" | "email" | "password" | "checkbox" | "date" | "time" | "textarea";

export type Option = SelectOption;

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: Option[]; // required for 'select'
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  hint?: string; // New: helpful description
  disabled?: boolean;
}

export interface DynamicFormProps {
  fields: FieldDef[];
  onSubmit: (data: Record<string, any>) => void;
  className?: string;
  error?: string | null;
  success?: string | null;
  children?: React.ReactNode;
}

export default function DynamicForm({
  fields,
  onSubmit,
  className = "",
  error,
  success,
  children,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Initialize default values
  useEffect(() => {
    const initialData: Record<string, any> = {};
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue;
      } else {
        initialData[field.name] = field.type === "checkbox" ? false : field.type === "multi-select" ? [] : "";
      }
    });
    setFormData(initialData);
  }, [fields]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {fields.map((field) => (
          <div key={field.name} className={`flex flex-col gap-1.5 ${field.type === "checkbox" || field.type === "multi-select" ? "sm:col-span-2" : ""}`}>
            {field.type !== "checkbox" && field.label && (
              <label className="font-semibold text-slate-700 whitespace-nowrap flex items-center">
                {field.label.includes("(اختياري)") ? (
                  <>
                    <span>{field.label.replace("(اختياري)", "").trim()}</span>
                    <span className="text-xs text-slate-400 font-normal mx-1">(اختياري)</span>
                  </>
                ) : field.label.toLowerCase().includes("(optional)") ? (
                  <>
                    <span>{field.label.replace(/\(optional\)/i, "").trim()}</span>
                    <span className="text-xs text-slate-400 font-normal mx-1">(Optional)</span>
                  </>
                ) : (
                  <span>{field.label}</span>
                )}
                {field.required && <span className="text-red-500 mx-1">*</span>}
              </label>
            )}

            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                id={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                placeholder={field.placeholder}
                disabled={field.disabled}
                rows={4}
                className={`px-3 py-2 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all w-full placeholder:text-slate-400 resize-none ${field.disabled ? "opacity-60 bg-slate-100 cursor-not-allowed" : ""}`}
              />
            ) : field.type === "searchable-select" || field.type === "select" ? (
              <SearchableSelect
                options={field.options ?? []}
                value={formData[field.name]}
                onChange={(val) => setFormData((prev) => ({ ...prev, [field.name]: val }))}
                disabled={field.disabled}
                placeholder={field.placeholder || `اختر ${field.label}`}
              />
            ) : field.type === "multi-select" ? (
              <div className="flex flex-wrap items-center gap-2 mt-1 w-full" dir="rtl">
                {field.options?.map((opt) => {
                  const isSelected = Array.isArray(formData[field.name]) && formData[field.name].includes(opt.value);
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => {
                        const currentArray = Array.isArray(formData[field.name]) ? formData[field.name] : [];
                        let newArray;
                        if (currentArray.includes(opt.value)) {
                          newArray = currentArray.filter((v: any) => v !== opt.value);
                        } else {
                          newArray = [...currentArray, opt.value];
                        }
                        setFormData((prev) => ({ ...prev, [field.name]: newArray }));
                      }}
                      className={`flex-1 min-w-[60px] sm:min-w-0 px-3 py-2 text-sm font-semibold rounded-lg border transition-all active:scale-95 ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            ) : field.type === "checkbox" ? (
              <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 bg-slate-50/30">
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-slate-800">{field.label}</span>
                  {field.hint && <span className="text-[11px] text-slate-500 mt-0.5">{field.hint}</span>}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name={field.name}
                    checked={!!formData[field.name]}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:inset-s-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            ) : (
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder}
                disabled={field.disabled}
                className={`h-10 px-3 rounded-lg border border-slate-200 bg-white text-[14px] text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all w-full placeholder:text-slate-400 ${field.disabled ? "opacity-60 bg-slate-100 cursor-not-allowed" : ""}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
        <div className="flex-1">
          {error && <p className="text-[13px] text-red-500 font-medium">{error}</p>}
          {success && <p className="text-[13px] text-green-600 font-medium">{success}</p>}
        </div>
        <div className="shrink-0">
          {children}
        </div>
      </div>
    </form>
  );
}
