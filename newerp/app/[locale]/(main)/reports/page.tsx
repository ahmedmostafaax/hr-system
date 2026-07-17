"use client";

import { notify } from "@/lib/toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
import {
  Users,
  CalendarCheck,
  ArrowDownCircle,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { RoleGuard, PageHeader } from "@/components/shared";
import Loading from "@/components/ui/Loading";
import { reportsService, payrollRunService } from "@/lib/services";
import type { PayrollRun } from "@/lib/services/entities";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

type TabId = "payroll" | "loans" | "deductions" | "kpis" | "yearly";

const TABS: { id: TabId; label: string }[] = [
  { id: "payroll", label: "تكلفة الرواتب" },
  { id: "loans", label: "السلف النشطة" },
  { id: "deductions", label: "الخصومات" },
  { id: "kpis", label: "KPIs شهرية" },
  { id: "yearly", label: "KPIs سنوية" },
];

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

interface PayrollCostRow {
  "Employee.Department.name"?: string;
  total_earnings?: string | number;
  net_salary?: string | number;
}

interface LoanRow {
  employee_name?: string;
  total_remaining_amount?: string | number;
  employee_id?: number;
}

interface DeductionRow {
  total_absence_deduction?: string | number;
  total_loan_deduction?: string | number;
}

interface KpiData {
  employee_count?: number;
  attendance_percentage?: number;
  absence_percentage?: number;
  loans_percentage?: number;
  deductions_percentage?: number;
  total_records?: number;
}

function formatNum(value: unknown) {
  const n = parseFloat(String(value ?? 0));
  return isNaN(n) ? "0" : n.toLocaleString("ar-EG", { maximumFractionDigits: 2 });
}

function runLabel(run: PayrollRun) {
  const month = MONTHS_AR[run.month - 1] ?? run.month;
  return `${month} ${run.year} (#${run.id})`;
}

export default function ReportsPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isAr = locale === "ar";

  const [activeTab, setActiveTab] = useState<TabId>("payroll");
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  const [payrollCost, setPayrollCost] = useState<PayrollCostRow[]>([]);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [deductions, setDeductions] = useState<DeductionRow[]>([]);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [yearlyKpis, setYearlyKpis] = useState<KpiData | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<
    { month: string; attendance: number; deductions: number; loans: number }[]
  >([]);

  useEffect(() => {
    payrollRunService
      .getAll({ limit: 100 })
      .then((res) => {
        const runs = res.data.sort((a, b) =>
          a.year !== b.year ? b.year - a.year : b.month - a.month
        );
        setPayrollRuns(runs);
        if (runs.length > 0) {
          setSelectedRunId(String(runs[0].id));
        }
      })
      .catch((err) => notify.handleApiError(err as { message?: string }))
      .finally(() => setLoading(false));
  }, []);

  const payrollChartData = useMemo(
    () =>
      payrollCost.map((row) => ({
        name: row["Employee.Department.name"] ?? "غير محدد",
        earnings: parseFloat(String(row.total_earnings ?? 0)),
        net: parseFloat(String(row.net_salary ?? 0)),
      })),
    [payrollCost]
  );

  const loadTabData = useCallback(async () => {
    setTabLoading(true);
    try {
      if (activeTab === "payroll" && selectedRunId) {
        const data = await reportsService.payrollCost(selectedRunId);
        setPayrollCost(Array.isArray(data) ? data : [data]);
      } else if (activeTab === "loans") {
        const data = await reportsService.loans();
        setLoans(Array.isArray(data) ? data : []);
      } else if (activeTab === "deductions" && selectedRunId) {
        const data = await reportsService.deductions(selectedRunId);
        setDeductions(Array.isArray(data) ? data : [data]);
      } else if (activeTab === "kpis" && selectedRunId) {
        const data = await reportsService.kpis(selectedRunId);
        setKpis(data);
      } else if (activeTab === "yearly") {
        const [yearly, ...monthlyResults] = await Promise.all([
          reportsService.yearlyKpis(),
          ...payrollRuns.map(async (run) => {
            const k = await reportsService.kpis(run.id);
            return {
              month: runLabel(run),
              attendance: k?.attendance_percentage ?? 0,
              deductions: k?.deductions_percentage ?? 0,
              loans: k?.loans_percentage ?? 0,
            };
          }),
        ]);
        setYearlyKpis(yearly);
        setMonthlyTrend(
          monthlyResults.reverse().slice(-12)
        );
      }
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setTabLoading(false);
    }
  }, [activeTab, selectedRunId, payrollRuns]);

  useEffect(() => {
    if (loading) return;
    if (activeTab !== "loans" && activeTab !== "yearly" && !selectedRunId) return;
    loadTabData();
  }, [activeTab, selectedRunId, loading, loadTabData]);

  const needsRunSelector = activeTab !== "loans" && activeTab !== "yearly";

  const payrollRunOptions = useMemo(
    () =>
      payrollRuns.map((run) => ({
        label: `${runLabel(run)} — ${run.status}`,
        value: run.id,
        searchText: `${run.month} ${run.year} ${run.status} ${run.id}`,
      })),
    [payrollRuns]
  );

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    icon: React.ComponentType<{ size?: number }>;
    color: string;
  }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${color} text-white`}>
          <Icon size={22} />
        </div>
        <div className="text-left">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {title}
          </span>
          <h2 className="text-2xl font-black text-slate-800">{value}</h2>
        </div>
      </div>
    </div>
  );

  if (loading) return <Loading className="min-h-screen" />;

  return (
    <RoleGuard permission="read:reports">
      <div className="p-6 space-y-6" dir="rtl">
        <PageHeader
          title={isAr ? "التقارير" : "Reports"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "التقارير" : "Reports" },
          ]}
        />

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {needsRunSelector && (
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              دورة الرواتب
            </label>
            <SearchableSelect
              options={payrollRunOptions}
              value={selectedRunId}
              onChange={(val) => setSelectedRunId(String(val))}
              placeholder={
                payrollRuns.length === 0 ? "لا توجد دورات رواتب" : "اختر دورة الرواتب"
              }
              searchPlaceholder="بحث بالشهر أو السنة..."
              noResultsText="لا توجد نتائج"
            />
          </div>
        )}

        {tabLoading ? (
          <Loading className="py-20" />
        ) : (
          <>
            {activeTab === "payroll" && (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-6">
                  تكلفة الرواتب حسب القسم
                </h3>
                {payrollChartData.length === 0 ? (
                  <p className="text-slate-500 text-center py-12">لا توجد بيانات</p>
                ) : (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={payrollChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fontWeight: 700, fill: "#64748b" }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#64748b" }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="earnings"
                          name="إجمالي الاستحقاقات"
                          fill="#6366f1"
                          radius={[8, 8, 0, 0]}
                          barSize={36}
                        />
                        <Bar
                          dataKey="net"
                          name="صافي الراتب"
                          fill="#10b981"
                          radius={[8, 8, 0, 0]}
                          barSize={36}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {activeTab === "loans" && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-right font-semibold text-slate-600">الموظف</th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-600">المبلغ</th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-600">المدفوع</th>
                      <th className="px-6 py-3 text-right font-semibold text-slate-600">المتبقي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                          لا توجد سلف نشطة
                        </td>
                      </tr>
                    ) : (
                      loans.map((row, i) => (
                        <tr key={row.employee_id ?? i} className="border-t border-slate-100">
                          <td className="px-6 py-3 font-medium">{row.employee_name ?? "—"}</td>
                          <td className="px-6 py-3 font-mono">—</td>
                          <td className="px-6 py-3 font-mono">—</td>
                          <td className="px-6 py-3 font-mono text-rose-600">
                            {formatNum(row.total_remaining_amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "deductions" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(deductions.length > 0 ? deductions : [{}]).map((row, i) => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <h4 className="text-sm font-bold text-slate-500 mb-2">خصم الغياب</h4>
                    <p className="text-3xl font-black text-amber-600">
                      {formatNum(row.total_absence_deduction)} EGP
                    </p>
                  </div>
                ))}
                {(deductions.length > 0 ? deductions : [{}]).map((row, i) => (
                  <div
                    key={`loan-${i}`}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <h4 className="text-sm font-bold text-slate-500 mb-2">خصم السلف</h4>
                    <p className="text-3xl font-black text-rose-600">
                      {formatNum(row.total_loan_deduction)} EGP
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "kpis" && kpis && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  title="عدد الموظفين"
                  value={String(kpis.employee_count ?? 0)}
                  icon={Users}
                  color="bg-indigo-600"
                />
                <StatCard
                  title="نسبة الحضور"
                  value={`${kpis.attendance_percentage ?? 0}%`}
                  icon={CalendarCheck}
                  color="bg-emerald-500"
                />
                <StatCard
                  title="نسبة السلف"
                  value={`${kpis.loans_percentage ?? 0}%`}
                  icon={Wallet}
                  color="bg-violet-500"
                />
                <StatCard
                  title="نسبة الاستقطاعات"
                  value={`${kpis.deductions_percentage ?? 0}%`}
                  icon={ArrowDownCircle}
                  color="bg-rose-500"
                />
              </div>
            )}

            {activeTab === "yearly" && (
              <div className="space-y-6">
                {yearlyKpis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="إجمالي السجلات"
                      value={String(yearlyKpis.total_records ?? 0)}
                      icon={TrendingUp}
                      color="bg-indigo-600"
                    />
                    <StatCard
                      title="نسبة الحضور السنوية"
                      value={`${yearlyKpis.attendance_percentage ?? 0}%`}
                      icon={CalendarCheck}
                      color="bg-emerald-500"
                    />
                    <StatCard
                      title="نسبة السلف"
                      value={`${yearlyKpis.loans_percentage ?? 0}%`}
                      icon={Wallet}
                      color="bg-violet-500"
                    />
                    <StatCard
                      title="نسبة الاستقطاعات"
                      value={`${yearlyKpis.deductions_percentage ?? 0}%`}
                      icon={ArrowDownCircle}
                      color="bg-rose-500"
                    />
                  </div>
                )}

                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                  <h3 className="text-lg font-black text-slate-800 mb-6">
                    مؤشرات الأداء الشهرية
                  </h3>
                  {monthlyTrend.length === 0 ? (
                    <p className="text-slate-500 text-center py-12">لا توجد بيانات شهرية</p>
                  ) : (
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#64748b" }}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            unit="%"
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              boxShadow: "0 4px 12px rgb(0 0 0 / 0.1)",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="attendance"
                            name="الحضور"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="deductions"
                            name="الاستقطاعات"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="loans"
                            name="السلف"
                            stroke="#6366f1"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </RoleGuard>
  );
}
