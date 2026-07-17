"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import {
  PageHeader,
  DataTable,
  FormModal,
  StatusBadge,
} from "@/components/shared";
import type { DataTableColumn, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import { attendanceService, type Attendance } from "./service";
import { attendanceCheckSchema } from "@/lib/validations/attendance.schema";
import { z } from "zod";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { AttendanceQrScannerButton } from "@/components/attendance/AttendanceQrScanner";
import { useEmployeeOptions } from "@/lib/hooks/useEmployeeOptions";
import { formatLateHours, lateHoursFromRow } from "@/lib/utils/lateHours";
import { PeriodFilter } from "@/components/shared";
import { usePeriodFilter } from "@/lib/hooks/usePeriodFilter";
import { useAttendanceLiveRefresh } from "@/lib/hooks/useAttendanceLiveRefresh";
import { notifyAttendanceRecorded } from "@/lib/attendance/attendanceLive";

function AttendanceRoleGuard({ children }: { children: ReactNode }) {
  const user = getUser();
  const allowed =
    user &&
    (can(user.role, "read:employees") || can(user.role, "manage:attendance"));

  if (!allowed) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 font-medium">
        ليس لديك صلاحية لعرض هذه الصفحة
      </div>
    );
  }

  return <>{children}</>;
}

function formatTime(value: string | null | undefined, isAr: boolean) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString(isAr ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AttendancePage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();
  const canManage = user && can(user.role, "manage:attendance");

  const [employeeFilter, setEmployeeFilter] = useState("");
  const period = usePeriodFilter();
  const { options: employees } = useEmployeeOptions();

  const extraParams = useMemo(() => {
    const p: Record<string, unknown> = { ...period.apiParams };
    if (employeeFilter) p.employee_id = Number(employeeFilter);
    return p;
  }, [employeeFilter, period.apiParams]);

  const list = useListPage(attendanceService, extraParams);

  useAttendanceLiveRefresh(list.fetch, { pollMs: 5000 });

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "employee_id",
        label: isAr ? "الموظف" : "Employee",
        type: "select",
        options: employees,
        colSpan: 2,
      },
      {
        name: "work_date",
        label: isAr ? "تاريخ العمل" : "Work Date",
        type: "date",
      },
      {
        name: "check_in",
        label: isAr ? "وقت الحضور (اختياري)" : "Check-in (optional)",
        type: "time",
      },
    ],
    [employees, isAr]
  );

  const columns: DataTableColumn<Attendance>[] = [
    {
      key: "employee",
      label: isAr ? "الموظف" : "Employee",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">
            {row.Employee?.full_name ?? "—"}
          </span>
          <span className="text-xs text-indigo-400">{row.Employee?.code}</span>
        </div>
      ),
    },
    {
      key: "work_date",
      label: isAr ? "تاريخ العمل" : "Work Date",
      render: (row) =>
        row.work_date
          ? new Date(row.work_date).toLocaleDateString(
              isAr ? "ar-EG" : "en-US"
            )
          : "—",
    },
    {
      key: "check_in",
      label: isAr ? "حضور" : "Check In",
      render: (row) => formatTime(row.check_in, isAr),
    },
    {
      key: "check_out",
      label: isAr ? "انصراف" : "Check Out",
      render: (row) => formatTime(row.check_out, isAr),
    },
    {
      key: "late_hours",
      label: isAr ? "تأخير (س)" : "Late (h)",
      render: (row) => {
        const hours = lateHoursFromRow(row);
        return (
          <span
            className={
              hours > 0 ? "font-semibold text-amber-600" : "text-slate-600"
            }
          >
            {formatLateHours(hours, isAr)}
          </span>
        );
      },
    },
    {
      key: "overtime_hours",
      label: isAr ? "إضافي (س)" : "Overtime (h)",
      render: (row) => (
        <span
          className={
            row.overtime_hours > 0
              ? "font-semibold text-emerald-600"
              : "text-slate-600"
          }
        >
          {row.overtime_hours}
        </span>
      ),
    },
  ];

  const handleCheckIn = async (formData: Record<string, unknown>) => {
    try {
      await attendanceService.create(formData as Partial<Attendance>);
      notify.success(isAr ? "تم تسجيل الحضور بنجاح" : "Attendance recorded");
      notifyAttendanceRecorded();
      list.closeModal();
      await list.fetch({ silent: true });
    } catch (err) {
      notify.handleApiError(err as { message?: string });
      throw err;
    }
  };

  const defaultValues = {
    employee_id: "",
    work_date: new Date().toISOString().split("T")[0],
    check_in: "",
  };

  return (
    <AttendanceRoleGuard>
      <div className="p-6">
        <PageHeader
          title={isAr ? "سجل الحضور" : "Attendance"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "الحضور" : "Attendance" },
          ]}
          action={
            canManage
              ? {
                  label: isAr ? "تسجيل حضور" : "Check In",
                  onClick: list.openCreate,
                  permission: "manage:attendance" as Permission,
                }
              : undefined
          }
        />

        {canManage && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <AttendanceQrScannerButton isAr={isAr} />
            <p className="text-sm text-slate-600">
              {isAr
                ? "امسح QR الموظف لتسجيل الحضور أو الانصراف"
                : "Scan employee QR for check-in or check-out"}
            </p>
          </div>
        )}

        <PeriodFilter
          className="mb-4"
          scope={period.scope}
          month={period.month}
          year={period.year}
          onScopeChange={period.setScope}
          onMonthChange={period.setMonth}
          onYearChange={period.setYear}
          onAnyChange={() => list.setPage(1)}
          isAr={isAr}
        />

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              {isAr ? "الموظف" : "Employee"}
            </label>
            <SearchableSelect
              options={employees}
              value={employeeFilter}
              onChange={(val) => {
                setEmployeeFilter(String(val));
                list.setPage(1);
              }}
              allowClear
              clearLabel={isAr ? "الكل" : "All"}
              searchPlaceholder={isAr ? "بحث بالكود أو الاسم..." : "Search by code or name..."}
              placeholder={isAr ? "الموظف" : "Employee"}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="attendance"
          data={list.data}
          loading={list.loading}
          pagination={{
            page: list.page,
            limit: list.limit,
            total: list.total,
            onPageChange: list.setPage,
          }}
          onSearch={list.setKeyword}
          searchPlaceholder={
            isAr ? "بحث باسم الموظف..." : "Search by employee..."
          }
          emptyMessage={
            isAr ? "لا توجد سجلات حضور" : "No attendance records found"
          }
          emptyAction={
            canManage
              ? {
                  label: isAr ? "تسجيل حضور" : "Check In",
                  onClick: list.openCreate,
                }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode="create"
          entityName={isAr ? "الحضور" : "Attendance"}
          schema={attendanceCheckSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={handleCheckIn}
          createTitle={isAr ? "تسجيل حضور" : "Check In"}
        />
      </div>
    </AttendanceRoleGuard>
  );
}
