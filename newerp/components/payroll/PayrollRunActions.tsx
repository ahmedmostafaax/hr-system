"use client";

import {
  Banknote,
  CheckCircle,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { PayrollRun } from "@/lib/services/entities";

interface PayrollRunActionsProps {
  run: PayrollRun;
  isAr?: boolean;
  canManage?: boolean;
  recalculating?: boolean;
  confirming?: boolean;
  actionBusy?: boolean;
  onRecalculate?: () => void;
  onConfirm?: () => void;
  onMarkPaid?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function PayrollRunActions({
  run,
  isAr = true,
  canManage = false,
  recalculating = false,
  confirming = false,
  actionBusy = false,
  onRecalculate,
  onConfirm,
  onMarkPaid,
  onDelete,
  className = "",
}: PayrollRunActionsProps) {
  if (!canManage) return null;

  const btn =
    "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-sm ${className}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <span className="text-xs font-bold text-slate-500 me-2">
        {isAr ? "إجراءات الدورة:" : "Run actions:"}
      </span>

      {run.status === "draft" && (
        <>
          <button
            type="button"
            disabled={recalculating || confirming || actionBusy}
            onClick={onRecalculate}
            className={`${btn} bg-amber-500 text-white hover:bg-amber-600`}
          >
            {recalculating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isAr ? "إعادة حساب" : "Recalculate"}
          </button>
          <button
            type="button"
            disabled={recalculating || confirming || actionBusy}
            onClick={onConfirm}
            className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}
          >
            {confirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {isAr ? "تأكيد الدورة" : "Confirm"}
          </button>
        </>
      )}

      {run.status === "confirmed" && (
        <button
          type="button"
          disabled={actionBusy || confirming}
          onClick={onMarkPaid}
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          {actionBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Banknote className="h-4 w-4" />
          )}
          {isAr ? "تسجيل الدفع" : "Mark as paid"}
        </button>
      )}

      {run.status !== "paid" && (
        <button
          type="button"
          disabled={recalculating || confirming || actionBusy}
          onClick={onDelete}
          className={`${btn} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}
        >
          <Trash2 className="h-4 w-4" />
          {isAr ? "حذف الدورة" : "Delete run"}
        </button>
      )}

      {run.status === "paid" && (
        <p className="text-sm text-emerald-700 font-medium">
          {isAr ? "الدورة مكتملة — لا إجراءات متاحة" : "Run completed — no actions available"}
        </p>
      )}
    </div>
  );
}
