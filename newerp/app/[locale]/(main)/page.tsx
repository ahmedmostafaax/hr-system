"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  ArrowDownCircle,
  Shield,
  Users,
  CalendarCheck,
  Palmtree,
  FileText,
  Plus,
  CheckCircle2,
  Loader2,
  BarChart3,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { ApprovalBadge } from "@/components/shared";
import Loading from "@/components/ui/Loading";
import { AttendanceQrScannerButton } from "@/components/attendance/AttendanceQrScanner";
import { PayrollRunStepper } from "@/components/payroll/PayrollRunStepper";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import {
  payrollRunService,
  reportsService,
  employeeLoanService,
  leaveRequestService,
  journalEntryService,
} from "@/lib/services";
import type { EmployeeLoan, LeaveRequest, PayrollRun } from "@/lib/services/entities";

const MONTHS_AR = [
  "ينا", "فبر", "مار", "أبر", "ماي", "يون",
  "يول", "أغس", "سبت", "أكت", "نوف", "ديس",
];

interface PayrollCostRow {
  department_name?: string;
  "Employee.Department.name"?: string;
  total_net_payouts?: number | string;
  total_base_salaries?: number | string;
  total_allowances?: number | string;
  total_bonuses?: number | string;
  total_earnings?: number | string;
  employee_count?: number;
}

interface DeductionsData {
  total_deductions?: number | string;
  breakdown?: {
    insurance_deductions?: number | string;
    loan_deductions?: number | string;
    absence_deductions?: number | string;
    late_deductions?: number | string;
  };
}

interface KpiData {
  total_employees?: number;
  average_net_salary?: number | string;
  total_absence_days?: number | string;
}

interface YearlyTrendPoint {
  month: string;
  totalPayroll: number;
  avgSalary: number;
  employees: number;
}

interface HrStats {
  employeeCount: number;
  pendingLeaves: number;
  recentAbsences: number;
  averageAge?: number;
  averageSalary?: number;
  activeContracts?: number;
  averageTenureYears?: number;
  experienceRecords?: number;
  minAge?: number;
  maxAge?: number;
  minSalary?: number;
  maxSalary?: number;
  genderDistribution?: { gender: string; count: number }[];
  departmentDistribution?: { department_name: string; count: number }[];
  maritalDistribution?: { marital_status: string; count: number }[];
}

interface AccountingStats {
  journalCount: number;
}

function formatMoney(value: unknown) {
  const n = parseFloat(String(value ?? 0));
  if (isNaN(n)) return "—";
  return `${n.toLocaleString("ar-EG", { maximumFractionDigits: 0 })} ج.م`;
}

function runLabel(run: PayrollRun) {
  return `${MONTHS_AR[run.month - 1] ?? run.month} ${run.year}`;
}

function deptName(row: PayrollCostRow) {
  return row.department_name ?? row["Employee.Department.name"] ?? "غير محدد";
}

function sumNetPayouts(rows: PayrollCostRow[]) {
  return rows.reduce((sum, row) => {
    const net = row.total_net_payouts ?? row.total_earnings;
    if (net != null) return sum + parseFloat(String(net));
    const base = parseFloat(String(row.total_base_salaries ?? 0));
    const allow = parseFloat(String(row.total_allowances ?? 0));
    const bonus = parseFloat(String(row.total_bonuses ?? 0));
    return sum + base + allow + bonus;
  }, 0);
}

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: ComponentType<{ size?: number }>;
  color: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div className={`p-3 rounded-xl ${color} text-white shadow-md shrink-0`}>
          <Icon size={22} />
        </div>
        <div className="flex-1 text-right min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{title}</p>
          <p className="text-xl font-black text-slate-800 mt-1 truncate">{value}</p>
          {subValue && (
            <p className="text-xs text-slate-500 font-medium mt-1">{subValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;

  const user = getUser();
  const role = user?.role;
  const isAdmin = role === "SUPER-ADMIN" || role === "ADMIN";
  const isEmployee = role === "EMPLOYEE";
  const canDashboard = !!user && can(user.role, "read:dashboard");
  const canReports = !!user && (isAdmin || can(user.role, "read:reports"));
  const canPayroll = !!user && (isAdmin || can(user.role, "read:payroll"));
  const canPayrollStats = canPayroll;
  const canManagePayroll = !!user && (isAdmin || can(user.role, "manage:payroll"));
  const canHr = !!user && (isAdmin || role === "HR");
  const canHrDashboard = !!user && (isAdmin || role === "HR" || can(user.role, "read:employees"));
  const canApproveLoans = !!user && can(user.role, "approve:loans");
  const canManageLeaves = !!user && can(user.role, "manage:leaves");
  const canManageAttendance = !!user && can(user.role, "manage:attendance");
  const canJournals = !!user && (isAdmin || can(user.role, "manage:journalEntries"));

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(String(now.getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(now.getFullYear()));

  const [loading, setLoading] = useState(true);
  const [latestRun, setLatestRun] = useState<PayrollRun | null>(null);
  const [payrollRows, setPayrollRows] = useState<PayrollCostRow[]>([]);
  const [deductions, setDeductions] = useState<DeductionsData | null>(null);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [yearlyTrend, setYearlyTrend] = useState<YearlyTrendPoint[]>([]);
  const [hrStats, setHrStats] = useState<HrStats | null>(null);
  const [accountingStats, setAccountingStats] = useState<AccountingStats | null>(null);
  const [pendingLoans, setPendingLoans] = useState<EmployeeLoan[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchPendingLoans = useCallback(async () => {
    if (!canApproveLoans) return;
    const res = await employeeLoanService.getAll({
      limit: 5,
      approval_status: "pending",
      sort: "date",
    });
    setPendingLoans(res.data);
  }, [canApproveLoans]);

  const fetchPendingLeaves = useCallback(async () => {
    if (!canManageLeaves) return;
    const res = await leaveRequestService.getAll({
      limit: 5,
      status: "pending",
      sort: "date",
    });
    setPendingLeaves(res.data);
  }, [canManageLeaves]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    if (canPayrollStats) {
      setLatestRun(null);
      setPayrollRows([]);
      setDeductions(null);
      setKpis(null);
      setYearlyTrend([]);
    }
    try {
      let run: PayrollRun | null = null;

      if (canPayrollStats) {
        const runQuery: Record<string, unknown> = {
          page: 1,
          limit: 1,
          sort: "period",
        };
        if (filterMonth) runQuery.month = Number(filterMonth);
        if (filterYear) runQuery.year = Number(filterYear);

        const runsRes = await payrollRunService.getAll(runQuery);
        run = runsRes.data[0] ?? null;

        setLatestRun(run);
      }

      const tasks: Promise<void>[] = [];

      if (canPayrollStats && run) {
        tasks.push(
          (async () => {
            const [cost, ded, kpi] = await Promise.all([
              reportsService.payrollCost(run!.id),
              reportsService.deductions(run!.id),
              reportsService.kpis(run!.id),
            ]);
            setPayrollRows(Array.isArray(cost) ? cost : cost ? [cost] : []);
            setDeductions(ded);
            setKpis(kpi);

            if (canReports) {
              const runsRes = await payrollRunService.getAll({
                page: 1,
                limit: 12,
                sort: "period",
              });
              const runs = [...runsRes.data].reverse().slice(-12);
              const trend = await Promise.all(
                runs.map(async (r) => {
                  try {
                    const [costData, kpiData] = await Promise.all([
                      reportsService.payrollCost(r.id),
                      reportsService.kpis(r.id),
                    ]);
                    const rows = Array.isArray(costData) ? costData : costData ? [costData] : [];
                    return {
                      month: runLabel(r),
                      totalPayroll: sumNetPayouts(rows),
                      avgSalary: parseFloat(String(kpiData?.average_net_salary ?? 0)),
                      employees: kpiData?.total_employees ?? 0,
                    };
                  } catch {
                    return {
                      month: runLabel(r),
                      totalPayroll: 0,
                      avgSalary: 0,
                      employees: 0,
                    };
                  }
                })
              );
              setYearlyTrend(trend);
            } else {
              setYearlyTrend([]);
            }
          })()
        );
      } else if (canPayrollStats) {
        setPayrollRows([]);
        setDeductions(null);
        setKpis(null);
        setYearlyTrend([]);
      }

      if (canHrDashboard) {
        tasks.push(
          (async () => {
            const hrData = await reportsService.hrStats();
            setHrStats({
              employeeCount: hrData?.total_employees ?? 0,
              pendingLeaves: hrData?.pending_leaves ?? 0,
              recentAbsences: hrData?.total_absences ?? 0,
              averageAge: hrData?.average_age,
              averageSalary: hrData?.average_salary,
              activeContracts: hrData?.active_contracts,
              averageTenureYears: hrData?.average_tenure_years,
              experienceRecords: hrData?.experience_records,
              minAge: hrData?.min_age,
              maxAge: hrData?.max_age,
              minSalary: hrData?.min_salary,
              maxSalary: hrData?.max_salary,
              genderDistribution: hrData?.gender_distribution ?? [],
              departmentDistribution: hrData?.department_distribution ?? [],
              maritalDistribution: hrData?.marital_distribution ?? [],
            });
          })()
        );
      }

      if (canJournals) {
        tasks.push(
          (async () => {
            const res = await journalEntryService.getAll({ limit: 1 });
            setAccountingStats({
              journalCount: res.meta?.pagination?.totalItems ?? res.data.length,
            });
          })()
        );
      }

      if (canApproveLoans) tasks.push(fetchPendingLoans());
      if (canManageLeaves) tasks.push(fetchPendingLeaves());

      await Promise.all(tasks);
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setLoading(false);
    }
  }, [
    canPayrollStats,
    canReports,
    canHrDashboard,
    canJournals,
    canApproveLoans,
    canManageLeaves,
    filterMonth,
    filterYear,
    fetchPendingLoans,
    fetchPendingLeaves,
  ]);

  useEffect(() => {
    if (isEmployee) {
      router.replace(`/${locale}/my/profile`);
    }
  }, [isEmployee, locale, router]);

  useEffect(() => {
    if (isEmployee || !canDashboard) return;
    loadDashboard();
  }, [loadDashboard, isEmployee, canDashboard]);

  const payrollChartData = useMemo(
    () =>
      payrollRows.map((row) => ({
        name: deptName(row),
        cost: parseFloat(String(row.total_net_payouts ?? row.total_earnings ?? 0)) ||
          parseFloat(String(row.total_base_salaries ?? 0)) +
            parseFloat(String(row.total_allowances ?? 0)) +
            parseFloat(String(row.total_bonuses ?? 0)),
      })),
    [payrollRows]
  );

  const totalPayroll = useMemo(() => sumNetPayouts(payrollRows), [payrollRows]);

  const handleApproveLoan = async (id: number) => {
    setActionLoading(id);
    try {
      await employeeLoanService.update(id, { approval_status: "approved" });
      notify.success("تم اعتماد السلفة/القرض");
      await fetchPendingLoans();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveLeave = async (id: number) => {
    setActionLoading(id);
    try {
      await leaveRequestService.update(id, { status: "approved" });
      notify.success("تم اعتماد طلب الإجازة");
      await fetchPendingLeaves();
      if (canHr && hrStats) {
        setHrStats({ ...hrStats, pendingLeaves: Math.max(0, hrStats.pendingLeaves - 1) });
      }
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setActionLoading(null);
    }
  };

  const showHrAnalytics = canHrDashboard && !!hrStats;
  const genderChartData = useMemo(
    () =>
      (hrStats?.genderDistribution ?? []).map((g) => ({
        name: g.gender === "M" ? "ذكر" : g.gender === "F" ? "أنثى" : g.gender,
        count: g.count,
      })),
    [hrStats?.genderDistribution]
  );
  const deptChartData = useMemo(
    () =>
      (hrStats?.departmentDistribution ?? []).map((d) => ({
        name: d.department_name,
        count: d.count,
      })),
    [hrStats?.departmentDistribution]
  );

  if (isEmployee) return null;

  if (loading) return <Loading className="min-h-screen" />;

  if (!canDashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-red-500 font-medium">
        ليس لديك صلاحية لعرض لوحة التحكم
      </div>
    );
  }

  const showPayrollEmpty = canPayrollStats && !latestRun;
  const showAccountingKpis = canPayrollStats && latestRun;
  const showHrKpis = canHr && !canPayrollStats;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/60 min-h-screen" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            لوحة التحكم
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {isAdmin
              ? "نظرة شاملة على الموارد البشرية والمحاسبة"
              : canHr && !canReports
                ? "متابعة الموظفين والإجازات والغياب"
                : "متابعة الرواتب والقيود المحاسبية"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canManageAttendance && (
            <AttendanceQrScannerButton isAr={locale !== "en"} />
          )}
        {canPayrollStats && (
          <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
            <BarChart3 size={16} className="text-indigo-600 shrink-0" />
            <label className="text-sm text-slate-600">
              الشهر
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="ms-2 rounded-lg border border-slate-200 px-2 py-1 text-sm font-semibold"
              >
                {MONTHS_AR.map((label, i) => (
                  <option key={label} value={i + 1}>{label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              السنة
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="ms-2 rounded-lg border border-slate-200 px-2 py-1 text-sm font-semibold"
              >
                {Array.from({ length: 8 }, (_, i) => now.getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            {latestRun && (
              <>
                <span className="text-sm font-bold text-slate-700">
                  دورة: {runLabel(latestRun)} · #{latestRun.id}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    latestRun.status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : latestRun.status === "confirmed"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {latestRun.status}
                </span>
              </>
            )}
          </div>
        )}
        </div>
      </div>

      {canPayrollStats && (
        <PayrollRunStepper
          run={latestRun}
          isAr={locale !== "en"}
          periodLabel={
            latestRun
              ? runLabel(latestRun)
              : `${MONTHS_AR[Number(filterMonth) - 1] ?? filterMonth} ${filterYear}`
          }
          createHref={
            canManagePayroll ? `/${locale}/payroll` : undefined
          }
          detailHref={
            latestRun ? `/${locale}/payroll/${latestRun.id}` : undefined
          }
        />
      )}

      {/* Empty state — no payroll runs */}
      {showPayrollEmpty && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet size={32} className="text-indigo-500" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">لا توجد دورات رواتب بعد</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            ابدأ بإنشاء أول دورة رواتب لعرض مؤشرات الأداء والتقارير المالية على لوحة التحكم.
          </p>
          {canManagePayroll ? (
            <Link
              href={`/${locale}/payroll`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-indigo-200"
            >
              <Plus size={18} />
              إنشاء أول دورة رواتب
            </Link>
          ) : (
            <p className="text-sm text-slate-400 flex items-center justify-center gap-2">
              <AlertCircle size={16} />
              تواصل مع المحاسبة لإنشاء دورة الرواتب
            </p>
          )}
        </div>
      )}

      {/* KPI Cards — Accounting */}
      {showAccountingKpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            title="إجمالي الرواتب"
            value={formatMoney(totalPayroll)}
            subValue={`دورة ${runLabel(latestRun!)}`}
            icon={Wallet}
            color="bg-indigo-600"
          />
          <StatCard
            title="متوسط الراتب"
            value={formatMoney(kpis?.average_net_salary)}
            subValue={`${kpis?.total_employees ?? 0} موظف`}
            icon={TrendingUp}
            color="bg-emerald-500"
          />
          <StatCard
            title="إجمالي الخصومات"
            value={formatMoney(deductions?.total_deductions)}
            subValue="خصومات الشهر الحالي"
            icon={ArrowDownCircle}
            color="bg-rose-500"
          />
          <StatCard
            title="إجمالي التأمينات"
            value={formatMoney(deductions?.breakdown?.insurance_deductions)}
            subValue="استقطاعات التأمين (موظف)"
            icon={Shield}
            color="bg-violet-500"
          />
        </div>
      )}

      {/* تفصيل الخصومات */}
      {showAccountingKpis && deductions?.breakdown && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="خصم التأمينات"
            value={formatMoney(deductions.breakdown.insurance_deductions)}
            subValue="حصة الموظف"
            icon={Shield}
            color="bg-violet-600"
          />
          <StatCard
            title="خصم السلف والقروض"
            value={formatMoney(deductions.breakdown.loan_deductions)}
            subValue="استقطاعات القروض"
            icon={ArrowDownCircle}
            color="bg-amber-600"
          />
          <StatCard
            title="خصم الغياب"
            value={formatMoney(deductions.breakdown.absence_deductions)}
            subValue="استقطاعات الغياب"
            icon={CalendarCheck}
            color="bg-rose-600"
          />
        </div>
      )}

      {/* KPI Cards — HR analytics */}
      {showHrAnalytics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="عدد الموظفين"
              value={String(hrStats!.employeeCount)}
              subValue={`${hrStats!.activeContracts ?? 0} عقد نشط`}
              icon={Users}
              color="bg-indigo-600"
            />
            <StatCard
              title="متوسط العمر"
              value={`${hrStats!.averageAge ?? 0} سنة`}
              subValue={`من ${hrStats!.minAge ?? 0} إلى ${hrStats!.maxAge ?? 0}`}
              icon={TrendingUp}
              color="bg-sky-500"
            />
            <StatCard
              title="متوسط المرتب"
              value={formatMoney(hrStats!.averageSalary)}
              subValue={`${formatMoney(hrStats!.minSalary)} - ${formatMoney(hrStats!.maxSalary)}`}
              icon={Wallet}
              color="bg-emerald-500"
            />
            <StatCard
              title="متوسط مدة الخدمة"
              value={`${hrStats!.averageTenureYears ?? 0} سنة`}
              subValue={`${hrStats!.experienceRecords ?? 0} سجل خبرة`}
              icon={FileText}
              color="bg-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              title="إجازات معلّقة"
              value={String(hrStats!.pendingLeaves)}
              subValue="بانتظار الاعتماد"
              icon={Palmtree}
              color="bg-amber-500"
            />
            <StatCard
              title="سجلات الغياب"
              value={String(hrStats!.recentAbsences)}
              subValue="إجمالي الغيابات"
              icon={CalendarCheck}
              color="bg-rose-500"
            />
            <StatCard
              title="العقود النشطة"
              value={String(hrStats!.activeContracts ?? 0)}
              subValue="عقود عمل سارية"
              icon={FileText}
              color="bg-cyan-600"
            />
            <StatCard
              title="سجلات الخبرة"
              value={String(hrStats!.experienceRecords ?? 0)}
              subValue="خبرات سابقة مسجّلة"
              icon={BookOpen}
              color="bg-slate-700"
            />
          </div>

          {(genderChartData.length > 0 || deptChartData.length > 0) && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {genderChartData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 mb-4">توزيع الموظفين حسب الجنس</h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={genderChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {deptChartData.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 mb-4">الموظفون حسب القسم</h3>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Accounting journal stat for Admin/Accounting */}
      {canJournals && accountingStats && (
        <div className="bg-gradient-to-l from-slate-900 to-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">القيود المحاسبية</p>
              <p className="text-2xl font-black">{accountingStats.journalCount} قيد</p>
            </div>
          </div>
          <Link
            href={`/${locale}/journalEntries`}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors border border-white/20"
          >
            عرض القيود →
          </Link>
        </div>
      )}

      {/* Charts */}
      {showAccountingKpis && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-1">تكلفة الرواتب بالأقسام</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">توزيع صافي الرواتب حسب القسم</p>
            {payrollChartData.length === 0 ? (
              <p className="text-slate-400 text-center py-16">لا توجد بيانات لهذه الدورة</p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      formatter={(v) => [formatMoney(v), "التكلفة"]}
                      contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)" }}
                    />
                    <Bar dataKey="cost" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-1">KPIs السنوية</h3>
            <p className="text-xs text-slate-400 font-medium mb-6">اتجاه الرواتب ومتوسط الراتب عبر الدورات</p>
            {yearlyTrend.length === 0 ? (
              <p className="text-slate-400 text-center py-16">لا توجد بيانات كافية للرسم</p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      hide
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)" }}
                      formatter={(v, name) => [
                        formatMoney(v),
                        name === "totalPayroll" ? "إجمالي الرواتب" : "متوسط الراتب",
                      ]}
                    />
                    <Legend
                      formatter={(v) => (v === "totalPayroll" ? "إجمالي الرواتب" : "متوسط الراتب")}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="totalPayroll"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#6366f1" }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="avgSalary"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick action tables */}
      {(canApproveLoans || canManageLeaves) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {canApproveLoans && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-800">سلف في الانتظار</h3>
                  <p className="text-xs text-slate-400 mt-0.5">آخر 5 طلبات تحتاج اعتماد</p>
                </div>
                <Link
                  href={`/${locale}/employeeLoan?approval_status=pending`}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  عرض الكل
                </Link>
              </div>
              {pendingLoans.length === 0 ? (
                <p className="text-slate-400 text-center py-10 text-sm">لا توجد سلف معلّقة 🎉</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {pendingLoans.map((loan) => (
                    <div
                      key={loan.id}
                      className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">
                          {loan.Employee?.full_name ?? loan.employee?.full_name ?? `موظف #${loan.employee_id}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {loan.type === "loan" ? "قرض" : "سلفة"} · {formatMoney(loan.amount)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ApprovalBadge status={loan.approval_status} />
                        <button
                          type="button"
                          disabled={actionLoading === loan.id}
                          onClick={() => handleApproveLoan(loan.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {actionLoading === loan.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          اعتماد
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {canManageLeaves && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-800">إجازات معلّقة</h3>
                  <p className="text-xs text-slate-400 mt-0.5">آخر 5 طلبات بانتظار الاعتماد</p>
                </div>
                <Link
                  href={`/${locale}/leave_requests`}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  عرض الكل
                </Link>
              </div>
              {pendingLeaves.length === 0 ? (
                <p className="text-slate-400 text-center py-10 text-sm">لا توجد إجازات معلّقة 🎉</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {pendingLeaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">
                          {leave.Employee?.full_name ?? leave.employee?.full_name ?? `موظف #${leave.employee_id}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {leave.LeaveType?.name ?? leave.leave_type?.name ?? "إجازة"} · {leave.days_count} يوم
                          · {leave.start_date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <ApprovalBadge status={leave.status} />
                        <button
                          type="button"
                          disabled={actionLoading === leave.id}
                          onClick={() => handleApproveLeave(leave.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {actionLoading === leave.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={14} />
                          )}
                          اعتماد
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {canPayroll && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/payroll`)}
            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all text-right"
          >
            <Wallet size={20} className="text-indigo-600 mb-2" />
            <p className="font-bold text-slate-800 text-sm">الرواتب</p>
          </button>
        )}
        {canReports && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/reports`)}
            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all text-right"
          >
            <BarChart3 size={20} className="text-emerald-600 mb-2" />
            <p className="font-bold text-slate-800 text-sm">التقارير</p>
          </button>
        )}
        {canHr && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/employees`)}
            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all text-right"
          >
            <Users size={20} className="text-sky-600 mb-2" />
            <p className="font-bold text-slate-800 text-sm">الموظفون</p>
          </button>
        )}
        {canJournals && (
          <button
            type="button"
            onClick={() => router.push(`/${locale}/journalEntries`)}
            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all text-right"
          >
            <BookOpen size={20} className="text-violet-600 mb-2" />
            <p className="font-bold text-slate-800 text-sm">القيود</p>
          </button>
        )}
      </div>
    </div>
  );
}
