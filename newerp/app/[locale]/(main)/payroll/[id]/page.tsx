"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Wallet } from "lucide-react";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  StatusBadge,
  LoadingPage,
  ErrorPage,
  ConfirmDialog,
} from "@/components/shared";
import { PayrollRunActions } from "@/components/payroll/PayrollRunActions";
import { PayrollRunStepper } from "@/components/payroll/PayrollRunStepper";
import type { DataTableColumn } from "@/components/shared";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import {
  payrollRunService,
  payrollDetailService,
  type PayrollRun,
  type PayrollDetail,
} from "../service";

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

function employeeName(row: PayrollDetail) {
  return row.Employee?.full_name ?? row.employee?.full_name ?? "—";
}

function totalAllowances(row: PayrollDetail) {
  const explicit =
    num((row as PayrollDetail & { total_allowances?: number }).total_allowances);
  if (explicit > 0) return explicit;

  return Math.max(
    0,
    num(row.total_earnings) -
      num(row.base_salary) -
      num(row.overtime_pay) -
      num(row.total_bonuses)
  );
}

export default function PayrollRunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const id = params?.id as string;
  const isAr = locale === "ar";
  const user = getUser();
  const canManage = user && can(user.role, "manage:payroll");

  const [run, setRun] = useState<PayrollRun | null>(null);
  const [details, setDetails] = useState<PayrollDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const monthNames = isAr ? MONTHS_AR : MONTHS_EN;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [runData, detailsRes] = await Promise.all([
        payrollRunService.getById(id),
        payrollDetailService.getByRunId(id, { limit: 1000 }),
      ]);
      setRun(detailsRes.payroll_run ?? runData);
      setDetails(Array.isArray(detailsRes.data) ? detailsRes.data : []);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Failed to load payroll run");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const totals = useMemo(
    () => ({
      count: details.length,
      net: details.reduce((sum, d) => sum + num(d.net_salary), 0),
    }),
    [details]
  );

  const handleRecalculate = async () => {
    if (!run || run.status !== "draft") return;
    setRecalculating(true);
    try {
      await payrollRunService.recalculate(run.id);
      notify.success(isAr ? "تم إعادة الحساب" : "Recalculated successfully");
      await fetchData();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setRecalculating(false);
    }
  };

  const handleConfirm = async () => {
    if (!run || run.status !== "draft") return;
    setConfirming(true);
    try {
      await payrollRunService.update(run.id, { status: "confirmed" });
      notify.success(isAr ? "تم تأكيد دورة الرواتب" : "Payroll run confirmed");
      await fetchData();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setConfirming(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!run || run.status !== "confirmed") return;
    setActionBusy(true);
    try {
      await payrollRunService.update(run.id, { status: "paid" });
      notify.success(isAr ? "تم تسجيل الدفع" : "Payroll marked as paid");
      await fetchData();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!run) return;
    setActionBusy(true);
    try {
      await payrollRunService.delete(run.id);
      notify.success(isAr ? "تم حذف دورة الرواتب" : "Payroll run deleted");
      router.push(`/${locale}/payroll`);
    } catch (err) {
      notify.handleApiError(err as { message?: string });
      setActionBusy(false);
    }
  };

  const busy = actionBusy || recalculating || confirming;

  const columns: DataTableColumn<PayrollDetail>[] = [
    {
      key: "employee",
      label: isAr ? "الموظف" : "Employee",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{employeeName(row)}</span>
          <span className="text-xs text-slate-400">
            {row.Employee?.code ?? row.employee?.code ?? ""}
          </span>
        </div>
      ),
    },
    {
      key: "base_salary",
      label: isAr ? "الراتب الأساسي" : "Base Salary",
      render: (row) => `${formatCurrency(row.base_salary, isAr)} EGP`,
    },
    {
      key: "total_allowances",
      label: isAr ? "البدلات" : "Allowances",
      render: (row) => `${formatCurrency(totalAllowances(row), isAr)} EGP`,
    },
    {
      key: "total_bonuses",
      label: isAr ? "المكافآت" : "Bonuses",
      render: (row) => `${formatCurrency(row.total_bonuses, isAr)} EGP`,
    },
    {
      key: "insurance_employee",
      label: isAr ? "التأمين" : "Insurance",
      render: (row) => `${formatCurrency(row.insurance_employee, isAr)} EGP`,
    },
    {
      key: "loan_deduction",
      label: isAr ? "القروض" : "Loans",
      render: (row) => `${formatCurrency(row.loan_deduction, isAr)} EGP`,
    },
    {
      key: "absence_deduction",
      label: isAr ? "الغياب" : "Absence",
      render: (row) => `${formatCurrency(row.absence_deduction, isAr)} EGP`,
    },
    {
      key: "net_salary",
      label: isAr ? "صافي الراتب" : "Net Salary",
      render: (row) => (
        <span className="font-bold text-emerald-700">
          {formatCurrency(row.net_salary, isAr)} EGP
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <RoleGuard permission="read:payroll">
        <LoadingPage variant="detail" />
      </RoleGuard>
    );
  }

  if (error || !run) {
    return (
      <RoleGuard permission="read:payroll">
        <ErrorPage
          title={isAr ? "تعذّر تحميل دورة الرواتب" : "Failed to load payroll run"}
          message={error ?? undefined}
          onRetry={fetchData}
          backHref={`/${locale}/payroll`}
          backLabel={isAr ? "العودة للقائمة" : "Back to list"}
        />
      </RoleGuard>
    );
  }

  const title = isAr
    ? `رواتب ${monthLabel(run.month, monthNames)} ${run.year}`
    : `Payroll ${monthLabel(run.month, monthNames)} ${run.year}`;

  return (
    <RoleGuard permission="read:payroll">
      <div className="p-6">
        <Link
          href={`/${locale}/payroll`}
          className={`inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors ${isAr ? "flex-row-reverse" : ""}`}
        >
          <ArrowLeft className={`w-4 h-4 ${isAr ? "rotate-180" : ""}`} />
          {isAr ? "العودة لدورات الرواتب" : "Back to payroll runs"}
        </Link>

        <PageHeader
          title={title}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "دورات الرواتب" : "Payroll Runs", href: `/${locale}/payroll` },
            { label: title },
          ]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
              <StatusBadge status={run.status} />
              <span className="text-sm text-slate-500">
                {isAr ? "حالة الدورة" : "Run Status"}
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
              <Users className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="text-xs text-slate-500">{isAr ? "عدد الموظفين" : "Employees"}</p>
                <p className="text-xl font-bold text-slate-800">{totals.count}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
              <Wallet className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-xs text-slate-500">
                  {isAr ? "إجمالي الصافي" : "Total Net"}
                </p>
                <p className="text-xl font-bold text-emerald-700">
                  {formatCurrency(totals.net, isAr)} EGP
                </p>
              </div>
            </div>
          </div>
        </div>

        <PayrollRunStepper
          className="mb-6"
          run={run}
          isAr={isAr}
          periodLabel={title}
        />

        {canManage && (
          <PayrollRunActions
            className="mb-6"
            run={run}
            isAr={isAr}
            canManage={canManage}
            recalculating={recalculating}
            confirming={confirming}
            actionBusy={actionBusy}
            onRecalculate={() => void handleRecalculate()}
            onConfirm={() => void handleConfirm()}
            onMarkPaid={() => void handleMarkPaid()}
            onDelete={() => setDeleteOpen(true)}
          />
        )}

        <DataTable
          columns={columns}
          exportFetcher={async () => details}
          exportFilename="payroll-details"
          data={details}
          rowKey={(row) => row.employee_id}
          emptyMessage={isAr ? "لا توجد تفاصيل رواتب" : "No payroll details found"}
          onRowClick={(row) =>
            router.push(`/${locale}/payroll/${id}/${row.employee_id}`)
          }
        />
        <ConfirmDialog
          open={deleteOpen}
          title={isAr ? "حذف دورة الرواتب" : "Delete payroll run"}
          description={
            isAr
              ? `هل أنت متأكد من حذف دورة ${title}؟ لا يمكن التراجع.`
              : `Delete ${title}? This cannot be undone.`
          }
          confirmLabel={isAr ? "حذف" : "Delete"}
          loading={busy}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteOpen(false)}
        />
      </div>
    </RoleGuard>
  );
}
