"use client";

import { useEffect, useRef, useState } from "react";
import {
  useForm,
  UseFormRegister,
  Resolver,
  UseFormWatch,
  UseFormSetValue,
  Control,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { z } from "zod";
import { notify } from "@/lib/toast";
import { SearchableSelect, type SelectOption } from "@/components/ui/SearchableSelect";

export type FormFieldType =
  | "text"
  | "number"
  | "email"
  | "password"
  | "date"
  | "time"
  | "textarea"
  | "select"
  | "checkbox";

export interface FormFieldConfig {
  name: string;
  label: string;
  type?: FormFieldType;
  placeholder?: string;
  options?: SelectOption[];
  disabled?: boolean;
  readOnly?: boolean;
  min?: string;
  max?: string;
  minFromField?: string;
  colSpan?: number;
}

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  entityName?: string;
  schema: z.ZodTypeAny;
  defaultValues?: Record<string, unknown>;
  fields: FormFieldConfig[];
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  createTitle?: string;
  editTitle?: string;
  createSuccessMessage?: string;
  editSuccessMessage?: string;
  renderAfterFields?: (ctx: {
    watch: UseFormWatch<Record<string, unknown>>;
    setValue: UseFormSetValue<Record<string, unknown>>;
  }) => React.ReactNode;
  onWatch?: (
    values: Record<string, unknown>,
    helpers: { setValue: UseFormSetValue<Record<string, unknown>> }
  ) => void;
}

function renderField(
  field: FormFieldConfig,
  register: UseFormRegister<Record<string, unknown>>,
  control: Control<Record<string, unknown>>,
  watch: UseFormWatch<Record<string, unknown>>,
  error?: string
) {
  const baseClass = `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-colors ${
    error
      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
  } ${field.readOnly ? "bg-slate-50 text-slate-700 cursor-not-allowed" : ""}`;

  if (field.type === "textarea") {
    return (
      <textarea
        {...register(field.name)}
        placeholder={field.placeholder}
        disabled={field.disabled}
        rows={3}
        className={`${baseClass} resize-none`}
      />
    );
  }

  if (field.type === "select") {
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: formField }) => (
          <SearchableSelect
            options={field.options ?? []}
            value={formField.value as string | number}
            onChange={formField.onChange}
            disabled={field.disabled}
            placeholder={field.placeholder ?? "— اختر —"}
          />
        )}
      />
    );
  }

  if (field.type === "checkbox") {
    return (
      <input
        type="checkbox"
        {...register(field.name)}
        disabled={field.disabled}
        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
      />
    );
  }

  return (
    <input
      type={field.type === "time" ? "time" : field.type || "text"}
      {...register(field.name)}
      placeholder={field.placeholder}
      disabled={field.disabled}
      readOnly={field.readOnly}
      min={
        field.minFromField
          ? (watch(field.minFromField) as string | undefined) || field.min
          : field.min
      }
      max={field.max}
      className={baseClass}
    />
  );
}

export function FormModal({
  isOpen,
  onClose,
  mode,
  entityName = "السجل",
  schema,
  defaultValues,
  fields,
  onSubmit,
  createTitle,
  editTitle,
  createSuccessMessage,
  editSuccessMessage,
  renderAfterFields,
  onWatch,
}: FormModalProps) {
  const submitLock = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(
      schema as Parameters<typeof zodResolver>[0]
    ) as Resolver<Record<string, unknown>>,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues);
    }
  }, [isOpen, defaultValues, reset]);

  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const daysCount = watch("days_count");

  useEffect(() => {
    if (!isOpen || !onWatch) return;
    onWatch(
      { start_date: startDate, end_date: endDate, days_count: daysCount },
      { setValue }
    );
  }, [isOpen, onWatch, setValue, startDate, endDate, daysCount]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const title =
    mode === "create"
      ? createTitle ?? `إضافة ${entityName}`
      : editTitle ?? `تعديل ${entityName}`;

  const submit = handleSubmit(async (data) => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    try {
      await onSubmit(data);
      const message =
        mode === "create"
          ? createSuccessMessage ?? "تم الإضافة بنجاح"
          : editSuccessMessage ?? "تم التحديث بنجاح";
      notify.success(message);
      onClose();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
      throw err;
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  });

  const isBusy = isSubmitting || submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        dir="rtl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(e).catch(() => {
              /* errors handled inside submit */
            });
          }}
          className="p-6 max-h-[75vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field) => {
              const fieldError = errors[field.name]?.message as string | undefined;

              return (
                <div
                  key={field.name}
                  className={`flex flex-col gap-1.5 ${
                    field.colSpan === 2 || field.type === "textarea" || field.type === "checkbox"
                      ? "sm:col-span-2"
                      : ""
                  } ${field.type === "checkbox" ? "flex-row items-center gap-3" : ""}`}
                >
                  {field.type !== "checkbox" && (
                    <label className="text-sm font-semibold text-slate-700">
                      {field.label}
                    </label>
                  )}
                  {renderField(field, register, control, watch, fieldError)}
                  {field.type === "checkbox" && (
                    <label className="text-sm font-semibold text-slate-700">
                      {field.label}
                    </label>
                  )}
                  {fieldError && (
                    <p className="text-xs text-red-500 font-medium">{fieldError}</p>
                  )}
                </div>
              );
            })}
          </div>

          {renderAfterFields?.({ watch, setValue })}

          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="px-4 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium transition-colors disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "create" ? "إضافة" : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
