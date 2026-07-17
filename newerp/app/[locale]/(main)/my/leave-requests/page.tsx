"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ApprovalBadge,
  PeriodFilter,
} from "@/components/shared";
import type { DataTableColumn, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { usePeriodFilter } from "@/lib/hooks/usePeriodFilter";
import { getUser } from "@/lib/auth";
import { leaveRequestService, leaveTypeService, type LeaveRequest } from "@/lib/services";
import { leaveRequestSelfCreateSchema } from "@/lib/validations/leaveRequest.schema";
import { calcInclusiveLeaveDays } from "@/lib/utils/leaveDays";
import { z } from "zod";

type SelectOption = { label: string; value: string | number };

export default function MyLeaveRequestsPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();
  const employeeId = user?.employee_id;

  const period = usePeriodFilter();
  const listParams = useMemo(
    () => ({
      ...(employeeId ? { employee_id: employeeId } : {}),
      ...period.apiParams,
    }),
    [employeeId, period.apiParams]
  );

  const list = useListPage(leaveRequestService, listParams);
  const [leaveTypes, setLeaveTypes] = useState<SelectOption[]>([]);

  useEffect(() => {
    leaveTypeService.getAll({ limit: 1000 }).then((res) => {
      setLeaveTypes(res.data.map((lt) => ({ label: lt.name, value: lt.id })));
    });
  }, []);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "leave_type_id",
        label: isAr ? "نوع الإجازة" : "Leave Type",
        type: "select",
        options: leaveTypes,
        colSpan: 2,
      },
      { name: "start_date", label: isAr ? "تاريخ البدء" : "Start Date", type: "date" },
      {
        name: "end_date",
        label: isAr ? "تاريخ الانتهاء" : "End Date",
        type: "date",
        minFromField: "start_date",
      },
      {
        name: "days_count",
        label: isAr ? "عدد الأيام" : "Days Count",
        type: "number",
        readOnly: true,
      },
    ],
    [isAr, leaveTypes]
  );

  const syncLeaveDays = useCallback(
    (values: Record<string, unknown>, { setValue }: { setValue: (name: string, value: unknown, opts?: { shouldValidate?: boolean }) => void }) => {
      const days = calcInclusiveLeaveDays(values.start_date, values.end_date);
      if (days != null && Number(values.days_count) !== days) {
        setValue("days_count", days, { shouldValidate: true });
      }
    },
    []
  );

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      key: "leave_type",
      label: isAr ? "النوع" : "Type",
      render: (row) => row.LeaveType?.name ?? row.leave_type?.name ?? "—",
    },
    {
      key: "duration",
      label: isAr ? "الفترة" : "Period",
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.start_date} → {row.end_date}
        </span>
      ),
    },
    {
      key: "days_count",
      label: isAr ? "الأيام" : "Days",
      render: (row) => `${row.days_count} ${isAr ? "يوم" : "days"}`,
    },
    {
      key: "status",
      label: isAr ? "الحالة" : "Status",
      render: (row) => <ApprovalBadge status={row.status} />,
    },
  ];

  const handleSave = async (formData: Record<string, unknown>) => {
    if (!employeeId) {
      throw { message: isAr ? "لا يوجد ملف موظف مرتبط بحسابك" : "No employee profile linked to your account" };
    }
    const days =
      calcInclusiveLeaveDays(formData.start_date, formData.end_date) ??
      Number(formData.days_count);
    await leaveRequestService.create({
      ...formData,
      employee_id: employeeId,
      days_count: days,
      status: "pending",
    } as Partial<LeaveRequest>);
    await list.fetch();
    list.closeModal();
  };

  const defaultValues = useMemo(
    () => ({
      leave_type_id: "",
      start_date: today,
      end_date: today,
      days_count: 1,
    }),
    [today]
  );

  return (
    <RoleGuard permission="create:ownLeave">
      <div className="p-6">
        <PageHeader
          title={isAr ? "طلبات إجازتي" : "My Leave Requests"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}/my/profile` },
            { label: isAr ? "طلبات الإجازة" : "Leave Requests" },
          ]}
          action={{
            label: isAr ? "طلب إجازة جديد" : "New Leave Request",
            onClick: list.openCreate,
            permission: "create:ownLeave",
          }}
        />

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

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="my-leave-requests"
          data={list.data}
          loading={list.loading}
          pagination={{
            page: list.page,
            limit: list.limit,
            total: list.total,
            onPageChange: list.setPage,
          }}
          emptyMessage={isAr ? "لا توجد طلبات إجازة" : "No leave requests"}
          emptyAction={{
            label: isAr ? "طلب إجازة جديد" : "New Leave Request",
            onClick: list.openCreate,
          }}
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode="create"
          entityName={isAr ? "طلب إجازة" : "Leave Request"}
          schema={leaveRequestSelfCreateSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={handleSave}
          onWatch={syncLeaveDays}
          createTitle={isAr ? "تقديم طلب إجازة" : "Submit Leave Request"}
        />
      </div>
    </RoleGuard>
  );
}
