"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
  ApprovalBadge,
  ListFilters,
  PeriodFilter,
  type FilterFieldConfig,
} from "@/components/shared";
import { useListFilters } from "@/lib/hooks/useListFilters";
import { usePeriodFilter } from "@/lib/hooks/usePeriodFilter";
import { useEmployeeOptions } from "@/lib/hooks/useEmployeeOptions";
import type { DataTableColumn, RowAction, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { leaveRequestService, type LeaveRequest } from "./service";
import { leaveTypeService } from "@/lib/services";
import {
  leaveRequestCreateSchema,
  leaveRequestEditSchema,
} from "@/lib/validations/leaveRequest.schema";
import { calcInclusiveLeaveDays } from "@/lib/utils/leaveDays";
import { z } from "zod";

type SelectOption = { label: string; value: string | number };

const LEAVE_FILTER_INITIAL = {
  employee_id: "",
  leave_type_id: "",
  status: "",
};

export default function LeaveRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const { filters, setFilter, resetFilters, apiParams } = useListFilters(LEAVE_FILTER_INITIAL);
  const period = usePeriodFilter();
  const listParams = useMemo(
    () => ({ ...apiParams, ...period.apiParams }),
    [apiParams, period.apiParams]
  );
  const list = useListPage(leaveRequestService, listParams);
  const { options: employeeOptions } = useEmployeeOptions();
  const [leaveTypes, setLeaveTypes] = useState<SelectOption[]>([]);

  useEffect(() => {
    leaveTypeService.getAll({ limit: 1000 }).then((typeRes) => {
      setLeaveTypes(typeRes.data.map((lt) => ({ label: lt.name, value: lt.id })));
    });
  }, []);

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      {
        key: "employee_id",
        label: isAr ? "الموظف" : "Employee",
        type: "select",
        options: employeeOptions,
      },
      {
        key: "leave_type_id",
        label: isAr ? "نوع الإجازة" : "Leave Type",
        type: "select",
        options: leaveTypes,
      },
      {
        key: "status",
        label: isAr ? "الحالة" : "Status",
        type: "select",
        options: [
          { label: isAr ? "في الانتظار" : "Pending", value: "pending" },
          { label: isAr ? "معتمد" : "Approved", value: "approved" },
          { label: isAr ? "مرفوض" : "Rejected", value: "rejected" },
        ],
      },
    ],
    [isAr, employeeOptions, leaveTypes]
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilter(key as keyof typeof LEAVE_FILTER_INITIAL, value);
    list.setPage(1);
  };

  const fields: FormFieldConfig[] = useMemo(() => {
    const base: FormFieldConfig[] = [
      {
        name: "employee_id",
        label: isAr ? "الموظف" : "Employee",
        type: "select",
        options: employeeOptions,
        colSpan: 2,
      },
      {
        name: "leave_type_id",
        label: isAr ? "نوع الإجازة" : "Leave Type",
        type: "select",
        options: leaveTypes,
      },
      {
        name: "start_date",
        label: isAr ? "تاريخ البدء" : "Start Date",
        type: "date",
      },
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
    ];

    if (list.selected) {
      base.push(
        {
          name: "status",
          label: isAr ? "حالة الطلب" : "Status",
          type: "select",
          options: [
            { label: isAr ? "قيد الانتظار" : "Pending", value: "pending" },
            { label: isAr ? "مقبول" : "Approved", value: "approved" },
            { label: isAr ? "مرفوض" : "Rejected", value: "rejected" },
          ],
        },
        {
          name: "reason",
          label: isAr ? "أسباب الرفض / ملاحظات" : "Rejection Reason / Notes",
          type: "textarea",
          colSpan: 2,
        }
      );
    }

    return base;
  }, [employeeOptions, leaveTypes, list.selected, isAr]);

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
      key: "employee",
      label: isAr ? "الموظف" : "Employee",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">
            {row.Employee?.full_name ?? row.employee?.full_name ?? "—"}
          </span>
          <span className="text-xs text-slate-400">
            {row.Employee?.code ?? row.employee?.code ?? ""}
          </span>
        </div>
      ),
    },
    {
      key: "leave_type",
      label: isAr ? "النوع" : "Type",
      render: (row) => (
        <span className="text-sky-700 font-medium">
          {row.LeaveType?.name ?? row.leave_type?.name ?? "—"}
        </span>
      ),
    },
    {
      key: "duration",
      label: isAr ? "الفترة" : "Period",
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.start_date} → {row.end_date}
        </span>
      ),
    },
    {
      key: "days_count",
      label: isAr ? "الأيام" : "Days",
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {row.days_count} {isAr ? "يوم" : "days"}
        </span>
      ),
    },
    {
      key: "status",
      label: isAr ? "الحالة" : "Status",
      render: (row) => <ApprovalBadge status={row.status} />,
    },
  ];

  const actions: RowAction<LeaveRequest>[] = useMemo(() => {
    const base: RowAction<LeaveRequest>[] = [
      {
        type: "view",
        onClick: (row) => router.push(`/${locale}/leave_requests/${row.id}`),
      },
    ];
    if (user && can(user.role, "manage:leaves")) {
      base.push(
        { type: "edit", onClick: list.openEdit },
        { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
      );
    }
    return base;
  }, [user, locale, router, list.openEdit, list.setDeleteTarget]);

  const defaultValues = useMemo(() => (list.selected
    ? {
        employee_id: list.selected.employee_id,
        leave_type_id: list.selected.leave_type_id,
        start_date: list.selected.start_date?.split("T")[0] ?? "",
        end_date: list.selected.end_date?.split("T")[0] ?? "",
        days_count: list.selected.days_count,
        status: list.selected.status,
        reason: list.selected.reason ?? "",
      }
    : {
        employee_id: "",
        leave_type_id: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date().toISOString().split("T")[0],
        days_count: 1,
      }), [list.selected]);

  const schema = list.selected
    ? leaveRequestEditSchema
    : leaveRequestCreateSchema;

  const handleSave = async (formData: Record<string, unknown>) => {
    const days =
      calcInclusiveLeaveDays(formData.start_date, formData.end_date) ??
      Number(formData.days_count);

    const payload: Record<string, unknown> = {
      ...formData,
      employee_id: Number(formData.employee_id),
      leave_type_id: Number(formData.leave_type_id),
      days_count: days,
    };

    if (list.selected) {
      await leaveRequestService.update(list.selected.id, payload);
    } else {
      await leaveRequestService.create(payload);
    }
    await list.fetch();
    list.closeModal();
  };

  return (
    <RoleGuard permission="read:employees">
      <div className="p-6">
        <PageHeader
          title={isAr ? "طلبات الإجازات" : "Leave Requests"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "طلبات الإجازات" : "Leave Requests" },
          ]}
          action={
            user && can(user.role, "manage:leaves")
              ? {
                  label: isAr ? "تقديم طلب إجازة" : "New Request",
                  onClick: list.openCreate,
                  permission: "manage:leaves" as Permission,
                }
              : undefined
          }
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

        <ListFilters
          fields={filterFields}
          values={filters}
          onChange={handleFilterChange}
          onReset={() => {
            resetFilters();
            list.setPage(1);
          }}
          isAr={isAr}
        />

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="leave-requests"
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
          onRowClick={(row) =>
            router.push(`/${locale}/leave_requests/${row.id}`)
          }
          actions={actions}
          emptyMessage={isAr ? "لا توجد طلبات" : "No leave requests found"}
          emptyAction={
            user && can(user.role, "manage:leaves")
              ? {
                  label: isAr ? "تقديم طلب إجازة" : "New Request",
                  onClick: list.openCreate,
                }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={isAr ? "طلب الإجازة" : "Leave Request"}
          schema={schema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={handleSave}
          onWatch={syncLeaveDays}
          createTitle={isAr ? "تقديم طلب إجازة" : "New Leave Request"}
          editTitle={isAr ? "تعديل طلب الإجازة" : "Edit Leave Request"}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف هذا الطلب؟"
              : "Are you sure you want to delete this request?"
          }
          confirmLabel={isAr ? "حذف" : "Delete"}
          loading={list.deleting}
          onConfirm={list.confirmDelete}
          onCancel={() => list.setDeleteTarget(null)}
        />
      </div>
    </RoleGuard>
  );
}
