"use client";

import Link from "next/link";
import { Check, Circle } from "lucide-react";
import type { PayrollRun } from "@/lib/services/entities";

const STEPS = [
  { key: "draft", ar: "مسودة / حساب", en: "Draft / Calculate" },
  { key: "confirmed", ar: "تأكيد", en: "Confirm" },
  { key: "paid", ar: "دفع", en: "Paid" },
] as const;

function completedSteps(status: PayrollRun["status"] | undefined): number {
  if (status === "paid") return 3;
  if (status === "confirmed") return 2;
  if (status === "draft") return 1;
  return 0;
}

interface PayrollRunStepperProps {
  run: PayrollRun | null;
  isAr?: boolean;
  periodLabel?: string;
  createHref?: string;
  detailHref?: string;
  className?: string;
}

export function PayrollRunStepper({
  run,
  isAr = true,
  periodLabel,
  createHref,
  detailHref,
  className = "",
}: PayrollRunStepperProps) {
  const done = run ? completedSteps(run.status) : 0;

  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white p-5 shadow-sm ${className}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-800">
            {isAr ? "مسار دورة الرواتب الشهرية" : "Monthly payroll workflow"}
          </p>
          {periodLabel && (
            <p className="mt-0.5 text-xs text-slate-500">{periodLabel}</p>
          )}
        </div>
        {run && detailHref ? (
          <Link
            href={detailHref}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            {isAr ? "فتح تفاصيل الدورة ←" : "Open run details →"}
          </Link>
        ) : run ? (
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {isAr ? `دورة #${run.id}` : `Run #${run.id}`}
          </span>
        ) : createHref ? (
          <Link
            href={createHref}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            {isAr ? "+ إنشاء دورة لهذا الشهر" : "+ Create run for this month"}
          </Link>
        ) : null}
      </div>

      <div className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isDone = done >= stepNum;
          const isCurrent = run && done === stepNum;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.key} className="flex flex-1 items-center min-w-0">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : isCurrent
                        ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={`text-center text-xs font-semibold leading-tight max-w-[88px] ${
                    isDone ? "text-emerald-700" : isCurrent ? "text-indigo-700" : "text-slate-400"
                  }`}
                >
                  {isAr ? step.ar : step.en}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`mx-1 mb-6 h-1 flex-1 rounded-full ${
                    done > stepNum ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {!run && (
        <p className="mt-3 text-center text-sm text-slate-500">
          {isAr
            ? "لم تُنشأ دورة رواتب لهذا الشهر بعد"
            : "No payroll run for this month yet"}
        </p>
      )}
    </div>
  );
}
