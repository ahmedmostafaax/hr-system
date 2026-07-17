"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const confirmClass =
    variant === "warning"
      ? "bg-amber-500 hover:bg-amber-600"
      : "bg-red-600 hover:bg-red-700";

  const iconClass =
    variant === "warning"
      ? "bg-amber-100 text-amber-600"
      : "bg-red-100 text-red-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !loading && onCancel()}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconClass}`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          </div>

          {description && (
            <p className="text-slate-600 mb-6 text-[15px] leading-relaxed">{description}</p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${confirmClass}`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
