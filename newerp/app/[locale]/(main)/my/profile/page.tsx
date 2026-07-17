"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Loader2,
  User,
  Briefcase,
  Mail,
  Phone,
  Hash,
  Users,
  Gift,
  TrendingDown,
  Palmtree,
  Landmark,
  Clock,
  ChevronRight,
  Banknote,
  CalendarDays,
  Building2,
  CreditCard,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { RoleGuard } from "@/components/shared";
import { getUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { employeeService, type EmployeeMySummary } from "@/lib/services/employeeService";
import { notify, type ApiErrorLike } from "@/lib/toast";
import { formatLateHours, lateHoursFromRow } from "@/lib/utils/lateHours";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthLabel(month: number, isAr: boolean) {
  const names = isAr ? MONTHS_AR : MONTHS_EN;
  return names[month - 1] ?? String(month);
}

function fmtDate(value: unknown, isAr: boolean) {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString(isAr ? "ar-EG" : "en-US");
}

function fmtTime(value: unknown, isAr: boolean) {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" });
}

function fmtMoney(value: unknown, isAr: boolean) {
  const n = parseFloat(String(value ?? 0));
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString(isAr ? "ar-EG" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isAr ? "ج.م" : "EGP"}`;
}

function statusLabel(status: string, isAr: boolean) {
  const map: Record<string, [string, string]> = {
    active: ["نشط", "Active"],
    suspended: ["موقوف", "Suspended"],
    resigned: ["مستقيل", "Resigned"],
    dismissed: ["مفصول", "Dismissed"],
    approved: ["موافق", "Approved"],
    rejected: ["مرفوض", "Rejected"],
    pending: ["قيد المراجعة", "Pending"],
    settled: ["مسدد", "Settled"],
  };
  const pair = map[status];
  return pair ? (isAr ? pair[0] : pair[1]) : status;
}

function CollapsibleSection({
  title,
  icon: Icon,
  colorClass,
  count,
  children,
  isAr,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
  count?: number;
  children: React.ReactNode;
  isAr: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-slate-200"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className={colorClass} />
          <span className="font-bold text-slate-800">
            {title}
            {count != null && (
              <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{count}</span>
            )}
          </span>
        </div>
        <ChevronRight
          size={20}
          className={`text-slate-400 transition-transform ${open ? "rotate-90" : isAr ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="grid gap-3">{children}</div>}
    </section>
  );
}

function EmptyBlock({ isAr }: { isAr: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-sm text-slate-400">
      {isAr ? "لا يوجد بيانات" : "No data"}
    </div>
  );
}

export default function MyProfilePage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();
  const canRequestLeave = user && can(user.role, "create:ownLeave");
  const canRequestLoan = user && can(user.role, "create:ownLoan");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<EmployeeMySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const yearOptions = useMemo(() => {
    const current = now.getFullYear();
    return Array.from({ length: 6 }, (_, i) => current - i);
  }, [now]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await employeeService.getMySummary(month, year);
      setSummary(data ?? null);
    } catch (err) {
      notify.handleApiError(err as ApiErrorLike);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !summary) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!summary) {
    return (
      <RoleGuard permission="read:selfProfile">
        <div className="p-6 text-center text-slate-500">
          {isAr ? "لا توجد بيانات موظف مرتبطة بحسابك" : "No employee profile linked"}
        </div>
      </RoleGuard>
    );
  }

  const { employee, active_contract, contracts, relatives, experiences, leave_requests, absences, bonuses, loans, attendance, salary } = summary;

  return (
    <RoleGuard permission="read:selfProfile">
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{isAr ? "بياناتي" : "My Profile"}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isAr
                ? `عرض بيانات ${monthLabel(month, isAr)} ${year}`
                : `Showing data for ${monthLabel(month, isAr)} ${year}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
            <label className="text-sm text-slate-600">
              {isAr ? "الشهر" : "Month"}
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="ms-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-800"
              >
                {(isAr ? MONTHS_AR : MONTHS_EN).map((label, i) => (
                  <option key={label} value={i + 1}>{label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600">
              {isAr ? "السنة" : "Year"}
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="ms-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-800"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
          </div>
        </div>

        {(canRequestLeave || canRequestLoan) && (
          <section className="grid gap-4 sm:grid-cols-2">
            {canRequestLeave && (
              <Link
                href={`/${locale}/my/leave-requests`}
                className="group flex items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Palmtree className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800">
                    {isAr ? "طلب إجازة" : "Request Leave"}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {isAr ? "قدّم طلب إجازة جديد وتابع حالته" : "Submit a new leave request and track its status"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-emerald-400 transition group-hover:translate-x-0.5" />
              </Link>
            )}
            {canRequestLoan && (
              <Link
                href={`/${locale}/my/loans`}
                className="group flex items-center gap-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                  <Landmark className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800">
                    {isAr ? "طلب سلفة أو قرض" : "Request Loan / Advance"}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {isAr ? "قدّم طلب سلفة أو قرض وتابع الموافقة" : "Submit a loan or advance request and track approval"}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-violet-400 transition group-hover:translate-x-0.5" />
              </Link>
            )}
          </section>
        )}

        {/* Personal + Bank */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-700">
              <User className="h-5 w-5 text-indigo-500" />
              {isAr ? "البيانات الشخصية" : "Personal Info"}
            </h2>
            <dl className="space-y-3 text-sm">
              <InfoRow icon={<Hash className="h-4 w-4" />} label={isAr ? "الكود" : "Code"} value={employee.code} />
              <InfoRow icon={<User className="h-4 w-4" />} label={isAr ? "الاسم" : "Name"} value={employee.full_name} />
              <InfoRow icon={<Mail className="h-4 w-4" />} label={isAr ? "البريد" : "Email"} value={employee.email ?? "—"} />
              <InfoRow icon={<Phone className="h-4 w-4" />} label={isAr ? "الهاتف" : "Phone"} value={employee.phone_number ?? "—"} />
              <InfoRow label={isAr ? "الرقم القومي" : "National ID"} value={employee.national_id} />
              <InfoRow label={isAr ? "العمر" : "Age"} value={employee.age != null ? String(employee.age) : "—"} />
              <InfoRow icon={<MapPin className="h-4 w-4" />} label={isAr ? "العنوان" : "Address"} value={employee.address ?? "—"} />
              <InfoRow label={isAr ? "الحالة" : "Status"} value={employee.is_active ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")} />
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-700">
              <Building2 className="h-5 w-5 text-emerald-500" />
              {isAr ? "العمل والبنك" : "Job & Bank"}
            </h2>
            <dl className="space-y-3 text-sm">
              <InfoRow icon={<GraduationCap className="h-4 w-4" />} label={isAr ? "المؤهل" : "Qualification"} value={employee.qualification ?? "—"} />
              <InfoRow icon={<Building2 className="h-4 w-4" />} label={isAr ? "القسم" : "Department"} value={employee.department?.name ?? "—"} />
              <InfoRow icon={<Building2 className="h-4 w-4" />} label={isAr ? "البنك" : "Bank"} value={employee.bank_name ?? "—"} />
              <InfoRow icon={<CreditCard className="h-4 w-4" />} label={isAr ? "رقم الحساب" : "Account"} value={employee.bank_account ?? "—"} />
              <InfoRow label={isAr ? "الحالة الاجتماعية" : "Marital Status"} value={employee.marital_status ?? "—"} />
            </dl>
          </section>
        </div>

        {/* Salary & Deductions — period filtered */}
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-700">
            <Banknote className="h-5 w-5 text-emerald-600" />
            {isAr ? `المرتب — ${monthLabel(month, isAr)} ${year}` : `Salary — ${monthLabel(month, isAr)} ${year}`}
          </h2>
          {salary ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <dl className="space-y-3 text-sm">
                <InfoRow label={isAr ? "الأساسي" : "Base"} value={fmtMoney(salary.base_salary, isAr)} />
                <InfoRow label={isAr ? "البدلات" : "Allowances"} value={fmtMoney(salary.total_allowances, isAr)} />
                <InfoRow label={isAr ? "الإضافي" : "Overtime"} value={fmtMoney(salary.overtime_pay, isAr)} />
                <InfoRow label={isAr ? "المكافآت" : "Bonuses"} value={fmtMoney(salary.total_bonuses, isAr)} />
                <InfoRow label={isAr ? "إجمالي المستحق" : "Total Earnings"} value={fmtMoney(salary.total_earnings, isAr)} />
                <InfoRow
                  label={isAr ? "صافي المرتب" : "Net Salary"}
                  value={salary.net_salary != null ? fmtMoney(salary.net_salary, isAr) : (isAr ? "لم يُحسب بعد" : "Not calculated yet")}
                />
                {salary.note === "no_payroll_run" && (
                  <p className="text-xs text-amber-600">
                    {isAr ? "لم تُنشأ كشف رواتب لهذا الشهر — العرض تقديري من العقد" : "No payroll run for this month — estimate from contract"}
                  </p>
                )}
              </dl>
              <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-rose-700">
                  <TrendingDown className="h-4 w-4" />
                  {isAr ? "الخصومات" : "Deductions"}
                </h3>
                <dl className="space-y-2 text-sm">
                  <InfoRow label={isAr ? "التأمين" : "Insurance"} value={fmtMoney(salary.deductions.insurance, isAr)} />
                  <InfoRow label={isAr ? "السلف / القرض" : "Loan"} value={fmtMoney(salary.deductions.loan, isAr)} />
                  <InfoRow label={isAr ? "الغياب" : "Absence"} value={fmtMoney(salary.deductions.absence, isAr)} />
                  <InfoRow label={isAr ? "إجمالي الخصومات" : "Total Deductions"} value={fmtMoney(salary.deductions.total, isAr)} />
                </dl>
              </div>
            </div>
          ) : (
            <EmptyBlock isAr={isAr} />
          )}
        </section>

        {/* Contracts */}
        <CollapsibleSection
          title={isAr ? "العقود" : "Contracts"}
          icon={Briefcase}
          colorClass="text-emerald-600"
          count={contracts.length}
          isAr={isAr}
          defaultOpen
        >
          {contracts.length === 0 ? (
            <EmptyBlock isAr={isAr} />
          ) : (
            contracts.map((c: Record<string, unknown>) => {
              const dept = (c.Department ?? c.department) as { name?: string } | undefined;
              const shift = (c.Shift ?? c.shift) as { name?: string } | undefined;
              const balances = (c.leaveBalances ?? []) as Record<string, unknown>[];
              const isActive = c.id === active_contract?.id || c.status === "active";
              return (
                <div
                  key={String(c.id)}
                  className={`rounded-2xl border p-4 ${isActive ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 bg-white"}`}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">{String(c.job_title ?? "—")}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {statusLabel(String(c.status ?? ""), isAr)}
                    </span>
                  </div>
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <InfoRow label={isAr ? "القسم" : "Department"} value={dept?.name ?? "—"} />
                    <InfoRow label={isAr ? "المرتب الأساسي" : "Base Salary"} value={fmtMoney(c.base_salary, isAr)} />
                    <InfoRow label={isAr ? "تاريخ البدء" : "Start"} value={fmtDate(c.start_date, isAr)} />
                    <InfoRow label={isAr ? "تاريخ الانتهاء" : "End"} value={fmtDate(c.end_date, isAr)} />
                    <InfoRow label={isAr ? "الشيفت" : "Shift"} value={shift?.name ?? "—"} />
                  </dl>
                  {balances.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <p className="mb-2 text-xs font-bold text-slate-500">{isAr ? "رصيد الإجازات" : "Leave Balances"}</p>
                      <div className="flex flex-wrap gap-2">
                        {balances.map((b) => {
                          const lt = (b.LeaveType ?? b.leaveType) as { name?: string } | undefined;
                          return (
                            <span key={String(b.id)} className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                              {lt?.name ?? "—"}: {String(b.used_days ?? 0)} {isAr ? "يوم مستخدم" : "days used"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CollapsibleSection>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Relatives */}
          <CollapsibleSection title={isAr ? "الأقارب" : "Relatives"} icon={Users} colorClass="text-indigo-600" count={relatives.length} isAr={isAr}>
            {relatives.length === 0 ? (
              <EmptyBlock isAr={isAr} />
            ) : (
              relatives.map((rel) => (
                <div key={String(rel.id)} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="font-bold text-slate-800">{String(rel.name ?? "—")}</p>
                  <p className="text-xs text-slate-500">{String(rel.relation ?? "—")} | {String(rel.phone ?? "—")}</p>
                </div>
              ))
            )}
          </CollapsibleSection>

          {/* Experiences */}
          <CollapsibleSection title={isAr ? "الخبرات" : "Experiences"} icon={Briefcase} colorClass="text-amber-600" count={experiences.length} isAr={isAr}>
            {experiences.length === 0 ? (
              <EmptyBlock isAr={isAr} />
            ) : (
              experiences.map((exp) => (
                <div key={String(exp.id)} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="font-bold text-slate-800">{String(exp.company_name ?? "—")}</p>
                  <p className="text-xs text-slate-500">
                    {String(exp.position ?? "—")} | {fmtDate(exp.from_date, isAr)} — {fmtDate(exp.to_date, isAr)}
                  </p>
                </div>
              ))
            )}
          </CollapsibleSection>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Leave requests — period */}
          <CollapsibleSection
            title={isAr ? `طلبات الإجازة — ${monthLabel(month, isAr)}` : `Leave Requests — ${monthLabel(month, isAr)}`}
            icon={Palmtree}
            colorClass="text-teal-600"
            count={leave_requests.length}
            isAr={isAr}
          >
            {leave_requests.length === 0 ? (
              <EmptyBlock isAr={isAr} />
            ) : (
              leave_requests.map((leave) => {
                const lt = (leave.LeaveType ?? leave.leaveType) as { name?: string } | undefined;
                return (
                  <div key={String(leave.id)} className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-800">{lt?.name ?? "—"}</p>
                      <span className="text-xs font-bold text-slate-500">{statusLabel(String(leave.status ?? ""), isAr)}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {fmtDate(leave.start_date, isAr)} — {fmtDate(leave.end_date, isAr)} ({String(leave.days_count ?? "—")} {isAr ? "يوم" : "days"})
                    </p>
                    {leave.reason ? <p className="mt-1 text-xs text-slate-400">{String(leave.reason)}</p> : null}
                  </div>
                );
              })
            )}
          </CollapsibleSection>

          {/* Absences — period */}
          <CollapsibleSection
            title={isAr ? `الغياب — ${monthLabel(month, isAr)}` : `Absences — ${monthLabel(month, isAr)}`}
            icon={TrendingDown}
            colorClass="text-rose-600"
            count={absences.length}
            isAr={isAr}
          >
            {absences.length === 0 ? (
              <EmptyBlock isAr={isAr} />
            ) : (
              absences.map((abs) => {
                const at = (abs.AbsenceType ?? abs.absenceType) as { name?: string } | undefined;
                return (
                  <div key={String(abs.id)} className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-800">{fmtDate(abs.absence_date, isAr)}</p>
                      <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                        {String(abs.deduction_days ?? 0)} {isAr ? "يوم خصم" : "ded. days"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{at?.name ?? "—"}</p>
                    {abs.notes ? <p className="mt-1 text-xs text-slate-400">{String(abs.notes)}</p> : null}
                  </div>
                );
              })
            )}
          </CollapsibleSection>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Bonuses — period */}
          <CollapsibleSection
            title={isAr ? `المكافآت — ${monthLabel(month, isAr)}` : `Bonuses — ${monthLabel(month, isAr)}`}
            icon={Gift}
            colorClass="text-indigo-600"
            count={bonuses.length}
            isAr={isAr}
          >
            {bonuses.length === 0 ? (
              <EmptyBlock isAr={isAr} />
            ) : (
              bonuses.map((bonus) => {
                const bt = (bonus.BonusType ?? bonus.bonusType) as { name?: string } | undefined;
                return (
                  <div key={String(bonus.id)} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
                    <div>
                      <p className="font-bold text-slate-800">{bt?.name ?? "—"}</p>
                      <p className="text-xs text-slate-500">{fmtDate(bonus.grant_date, isAr)}</p>
                    </div>
                    <span className="font-black text-indigo-600">{fmtMoney(bonus.amount, isAr)}</span>
                  </div>
                );
              })
            )}
          </CollapsibleSection>

          {/* Loans */}
          <CollapsibleSection title={isAr ? "السلف والقروض" : "Advances & Loans"} icon={Landmark} colorClass="text-violet-600" count={loans.length} isAr={isAr}>
            {canRequestLoan && (
              <Link
                href={`/${locale}/my/loans`}
                className="mb-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-violet-200 bg-violet-50/50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                {isAr ? "+ تقديم طلب سلفة أو قرض" : "+ Submit loan / advance request"}
              </Link>
            )}
            {loans.length === 0 ? (
              <EmptyBlock isAr={isAr} />
            ) : (
              loans.map((loan) => (
                <div key={String(loan.id)} className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">
                      {loan.type === "advance" ? (isAr ? "سلفة" : "Advance") : (isAr ? "قرض" : "Loan")}
                    </p>
                    <span className="text-xs font-bold text-slate-500">{statusLabel(String(loan.status ?? ""), isAr)}</span>
                  </div>
                  <dl className="mt-2 space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between"><span>{isAr ? "المبلغ" : "Amount"}</span><span className="font-bold">{fmtMoney(loan.amount, isAr)}</span></div>
                    <div className="flex justify-between"><span>{isAr ? "المدفوع" : "Paid"}</span><span className="font-bold">{fmtMoney(loan.paid_amount, isAr)}</span></div>
                    <div className="flex justify-between"><span>{isAr ? "القسط" : "Installment"}</span><span className="font-bold">{fmtMoney(loan.installment_amount, isAr)}</span></div>
                    <div className="flex justify-between"><span>{isAr ? "التاريخ" : "Date"}</span><span>{fmtDate(loan.grant_date, isAr)}</span></div>
                  </dl>
                </div>
              ))
            )}
          </CollapsibleSection>
        </div>

        {/* Attendance — period */}
        <CollapsibleSection
          title={isAr ? `الحضور — ${monthLabel(month, isAr)} ${year}` : `Attendance — ${monthLabel(month, isAr)} ${year}`}
          icon={Clock}
          colorClass="text-blue-600"
          count={attendance.length}
          isAr={isAr}
        >
          {attendance.length === 0 ? (
            <EmptyBlock isAr={isAr} />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="p-3 text-start">{isAr ? "التاريخ" : "Date"}</th>
                    <th className="p-3 text-start">{isAr ? "حضور" : "Check In"}</th>
                    <th className="p-3 text-start">{isAr ? "انصراف" : "Check Out"}</th>
                    <th className="p-3 text-start">{isAr ? "تأخير" : "Late"}</th>
                    <th className="p-3 text-start">{isAr ? "إضافي" : "OT"}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row) => (
                    <tr key={String(row.id)} className="border-t border-slate-50">
                      <td className="p-3 font-medium">{fmtDate(row.work_date, isAr)}</td>
                      <td className="p-3">{fmtTime(row.check_in, isAr)}</td>
                      <td className="p-3">{fmtTime(row.check_out, isAr)}</td>
                      <td className="p-3">{formatLateHours(lateHoursFromRow(row), isAr)}</td>
                      <td className="p-3">{String(row.overtime_hours ?? 0)} {isAr ? "س" : "h"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleSection>
      </div>
    </RoleGuard>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-50 pb-2">
      <dt className="flex items-center gap-1.5 text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="text-end font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
