"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
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
import { absenceService, type Absence } from "./service";
import { absenceTypeService } from "@/lib/services";
import { absenceSchema } from "@/lib/validations/absence.schema";
import { z } from "zod";

type SelectOption = { label: string; value: string | number };

const ABSENCE_FILTER_INITIAL = {
  employee_id: "",
  absence_type_id: "",
};

export default function EmployeeAbsencesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const { filters, setFilter, resetFilters, apiParams } = useListFilters(ABSENCE_FILTER_INITIAL);
  const period = usePeriodFilter();
  const listParams = useMemo(
    () => ({ ...apiParams, ...period.apiParams }),
    [apiParams, period.apiParams]
  );
  const list = useListPage(absenceService, listParams);
  const { options: employeeOptions } = useEmployeeOptions();
  const [absenceTypes, setAbsenceTypes] = useState<SelectOption[]>([]);

  useEffect(() => {
    absenceTypeService.getAll({ limit: 1000 }).then((typeRes) => {
      setAbsenceTypes(
        typeRes.data.map((b) => ({
          label: b.name,
          value: b.id,
        }))
      );
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
        key: "absence_type_id",
        label: isAr ? "نوع الغياب" : "Absence Type",
        type: "select",
        options: absenceTypes,
      },
    ],
    [isAr, employeeOptions, absenceTypes]
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilter(key as keyof typeof ABSENCE_FILTER_INITIAL, value);
    list.setPage(1);
  };

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "employee_id",
        label: isAr ? "الموظف" : "Employee",
        type: "select",
        options: employeeOptions,
        colSpan: 2,
      },
      {
        name: "absence_type_id",
        label: isAr ? "نوع الغياب" : "Absence Type",
        type: "select",
        options: absenceTypes,
      },
      {
        name: "absence_date",
        label: isAr ? "تاريخ الغياب" : "Absence Date",
        type: "date",
      },
      {
        name: "deduction_days",
        label: isAr ? "أيام الخصم" : "Deduction Days",
        type: "number",
      },
      {
        name: "notes",
        label: isAr ? "ملاحظات" : "Notes",
        type: "textarea",
        colSpan: 2,
      },
    ],
    [employeeOptions, absenceTypes, isAr]
  );

  const columns: DataTableColumn<Absence>[] = [
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
      key: "type",
      label: isAr ? "النوع" : "Type",
      render: (row) => (
        <span className="text-rose-600 font-medium">
          {row.AbsenceType?.name ??
            absenceTypes.find((t) => t.value === row.absence_type_id)
              ?.label ??
            "—"}
        </span>
      ),
    },
    {
      key: "absence_date",
      label: isAr ? "التاريخ" : "Date",
      render: (row) =>
        row.absence_date
          ? new Date(row.absence_date).toLocaleDateString(
              isAr ? "ar-EG" : "en-US"
            )
          : "—",
    },
    {
      key: "deduction_days",
      label: isAr ? "الخصم" : "Deduction",
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {row.deduction_days} {isAr ? "يوم" : "days"}
        </span>
      ),
    },
  ];

  const actions: RowAction<Absence>[] = [
    {
      type: "view",
      onClick: (row) => router.push(`/${locale}/absences/${row.id}`),
    },
  ];
  if (user && can(user.role, "manage:employees")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }

  const defaultValues = list.selected
    ? {
        employee_id: list.selected.employee_id,
        absence_type_id: list.selected.absence_type_id,
        absence_date: list.selected.absence_date?.split("T")[0] ?? "",
        deduction_days: list.selected.deduction_days,
        notes: list.selected.notes ?? "",
      }
    : {
        employee_id: "",
        absence_type_id: "",
        absence_date: new Date().toISOString().split("T")[0],
        deduction_days: 1,
        notes: "",
      };

  return (
    <RoleGuard permission="read:employees">
      <div className="p-6">
        <PageHeader
          title={isAr ? "سجل الغياب" : "Absence Records"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "الغياب" : "Absences" },
          ]}
          action={
            user && can(user.role, "manage:employees")
              ? {
                  label: isAr ? "تسجيل غياب" : "Record Absence",
                  onClick: list.openCreate,
                  permission: "manage:employees" as Permission,
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
          exportFilename="absences"
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
          onRowClick={(row) => router.push(`/${locale}/absences/${row.id}`)}
          actions={actions}
          emptyMessage={isAr ? "لا توجد سجلات غياب" : "No absence records found"}
          emptyAction={
            user && can(user.role, "manage:employees")
              ? {
                  label: isAr ? "تسجيل غياب" : "Record Absence",
                  onClick: list.openCreate,
                }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={isAr ? "الغياب" : "Absence"}
          schema={absenceSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={isAr ? "تسجيل حالة غياب" : "Record Absence"}
          editTitle={isAr ? "تعديل حالة غياب" : "Edit Absence"}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف هذا السجل؟"
              : "Are you sure you want to delete this record?"
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
