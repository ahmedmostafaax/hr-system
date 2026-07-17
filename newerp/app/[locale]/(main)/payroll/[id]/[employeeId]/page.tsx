"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  TrendingUp,
  TrendingDown,
  Printer,
  Banknote,
} from "lucide-react";
import {
  RoleGuard,
  LoadingPage,
  ErrorPage,
} from "@/components/shared";
import {
  payrollRunService,
  payrollDetailService,
  type PayrollRun,
  type PayrollDetail,
} from "../../service";

const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCurrency(value: number | null | undefined, isAr: boolean) {
  return num(value).toLocaleString(isAr ? "ar-EG" : "en-US");
}

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function monthLabel(month: number, monthNames: string[]) {
  return monthNames[(month ?? 1) - 1] ?? String(month ?? "");
}

function LineItem({
  label,
  value,
  isAr,
  highlight,
}: {
  label: string;
  value: number;
  isAr: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 ${isAr ? "flex-row-reverse" : ""}`}
    >
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`text-sm font-semibold ${highlight ? "text-emerald-700" : "text-slate-800"}`}
      >
        {formatCurrency(value, isAr)} EGP
      </span>
    </div>
  );
}

export default function PayrollEmployeeSlipPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const payrollRunId = params?.id as string;
  const employeeId = params?.employeeId as string;
  const isAr = locale === "ar";

  const [run, setRun] = useState<PayrollRun | null>(null);
  const [detail, setDetail] = useState<PayrollDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNames = isAr ? MONTHS_AR : MONTHS_EN;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [runData, detailData] = await Promise.all([
        payrollRunService.getById(payrollRunId),
        payrollDetailService.getByEmployeeAndRun(employeeId, payrollRunId),
      ]);
      setRun(runData);
      setDetail(detailData);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Failed to load payslip");
    } finally {
      setLoading(false);
    }
  }, [payrollRunId, employeeId]);

  useEffect(() => {
    if (payrollRunId && employeeId) fetchData();
  }, [payrollRunId, employeeId, fetchData]);

  if (loading) {
    return (
      <RoleGuard permission="read:payroll">
        <LoadingPage variant="detail" />
      </RoleGuard>
    );
  }

  if (error || !detail || !run) {
    return (
      <RoleGuard permission="read:payroll">
        <ErrorPage
          title={isAr ? "تعذّر تحميل كشف الراتب" : "Failed to load payslip"}
          message={error ?? undefined}
          onRetry={fetchData}
          backHref={`/${locale}/payroll/${payrollRunId}`}
          backLabel={isAr ? "العودة للتفاصيل" : "Back to run details"}
        />
      </RoleGuard>
    );
  }

  const employeeName =
    detail.Employee?.full_name ?? detail.employee?.full_name ?? "—";
  const employeeCode = detail.Employee?.code ?? detail.employee?.code ?? "";
  const periodLabel = isAr
    ? `${monthLabel(run.month, monthNames)} ${run.year}`
    : `${monthLabel(run.month, monthNames)} ${run.year}`;

  const totalAllowances = Math.max(
    0,
    num(detail.total_earnings) -
      num(detail.base_salary) -
      num(detail.overtime_pay) -
      num(detail.total_bonuses)
  );

  return (
    <RoleGuard permission="read:payroll">
      <div className="p-6 max-w-3xl mx-auto print:p-0">
        <div className={`flex items-center justify-between mb-6 print:hidden ${isAr ? "flex-row-reverse" : ""}`}>
          <Link
            href={`/${locale}/payroll/${payrollRunId}`}
            className={`inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors ${isAr ? "flex-row-reverse" : ""}`}
          >
            <ArrowLeft className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
            {isAr ? "العودة لتفاصيل الدورة" : "Back to run details"}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors ${isAr ? "flex-row-reverse" : ""}`}
          >
            <Printer className="w-4 h-4" />
            {isAr ? "طباعة" : "Print"}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden print:shadow-none print:border-0">
          <div className="bg-gradient-to-l from-indigo-600 to-indigo-700 px-6 py-8 text-white print:bg-indigo-700">
            <div className={`flex items-start justify-between ${isAr ? "flex-row-reverse" : ""}`}>
              <div className={isAr ? "text-right" : "text-left"}>
                <p className="text-indigo-200 text-sm mb-1">
                  {isAr ? "كشف راتب" : "Payslip"}
                </p>
                <h1 className="text-2xl font-bold">{periodLabel}</h1>
              </div>
              <Banknote className="w-10 h-10 text-indigo-300 opacity-80" />
            </div>
          </div>

          <div className="p-6 border-b border-slate-100">
            <div className={`flex items-center gap-4 ${isAr ? "flex-row-reverse" : ""}`}>
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
                <User className="w-7 h-7 text-indigo-600" />
              </div>
              <div className={isAr ? "text-right" : "text-left"}>
                <h2 className="text-xl font-bold text-slate-800">{employeeName}</h2>
                {employeeCode && (
                  <p className="text-sm text-slate-500">
                    {isAr ? "كود الموظف:" : "Employee Code:"} {employeeCode}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <section>
              <div className={`flex items-center gap-2 mb-3 ${isAr ? "flex-row-reverse" : ""}`}>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800">
                  {isAr ? "الاستحقاقات" : "Earnings"}
                </h3>
              </div>
              <div className="rounded-xl bg-slate-50/80 px-4 py-1">
                <LineItem
                  label={isAr ? "الراتب الأساسي" : "Base Salary"}
                  value={detail.base_salary}
                  isAr={isAr}
                />
                <LineItem
                  label={isAr ? "البدلات" : "Allowances"}
                  value={totalAllowances}
                  isAr={isAr}
                />
                <LineItem
                  label={isAr ? "العمل الإضافي" : "Overtime"}
                  value={detail.overtime_pay}
                  isAr={isAr}
                />
                <LineItem
                  label={isAr ? "المكافآت" : "Bonuses"}
                  value={detail.total_bonuses}
                  isAr={isAr}
                />
                <LineItem
                  label={isAr ? "إجمالي الاستحقاقات" : "Total Earnings"}
                  value={detail.total_earnings}
                  isAr={isAr}
                  highlight
                />
              </div>
            </section>

            <section>
              <div className={`flex items-center gap-2 mb-3 ${isAr ? "flex-row-reverse" : ""}`}>
                <TrendingDown className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-slate-800">
                  {isAr ? "الاستقطاعات" : "Deductions"}
                </h3>
              </div>
              <div className="rounded-xl bg-slate-50/80 px-4 py-1">
                <LineItem
                  label={isAr ? "تأمين الموظف" : "Employee Insurance"}
                  value={detail.insurance_employee}
                  isAr={isAr}
                />
                <LineItem
                  label={isAr ? "خصم القروض" : "Loan Deduction"}
                  value={detail.loan_deduction}
                  isAr={isAr}
                />
                <LineItem
                  label={
                    isAr
                      ? `خصم الغياب (${detail.absence_days} ${isAr ? "يوم" : "days"})`
                      : `Absence Deduction (${detail.absence_days} days)`
                  }
                  value={detail.absence_deduction}
                  isAr={isAr}
                />
                <LineItem
                  label={isAr ? "إجمالي الاستقطاعات" : "Total Deductions"}
                  value={detail.total_deductions}
                  isAr={isAr}
                  highlight
                />
              </div>
            </section>
          </div>

          <div className="px-6 pb-8">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-6 py-5 text-center">
              <p className="text-sm text-emerald-700 mb-1">
                {isAr ? "صافي الراتب" : "Net Salary"}
              </p>
              <p className="text-3xl font-bold text-emerald-800">
                {formatCurrency(detail.net_salary, isAr)} EGP
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
