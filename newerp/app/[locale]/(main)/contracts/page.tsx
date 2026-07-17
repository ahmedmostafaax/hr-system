"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
  StatusBadge,
  ListFilters,
  type FilterFieldConfig,
} from "@/components/shared";
import { useListFilters } from "@/lib/hooks/useListFilters";
import { useEmployeeOptions } from "@/lib/hooks/useEmployeeOptions";
import type { DataTableColumn, RowAction, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { contractService, type Contract } from "./service";
import {
  departmentService,
  insuranceSettingsService,
  shiftService,
} from "@/lib/services";
import { contractSchema } from "@/lib/validations/contract.schema";
import { z } from "zod";

type SelectOption = { label: string; value: string | number };

const CONTRACT_FILTER_INITIAL = {
  employee_id: "",
  department_id: "",
  status: "",
  salary_min: "",
  salary_max: "",
  employee_age_min: "",
  employee_age_max: "",
};

export default function ContractsPage() {
  const t = useTranslations("contracts");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const { filters, setFilter, resetFilters, apiParams } = useListFilters(CONTRACT_FILTER_INITIAL);
  const list = useListPage(contractService, apiParams);
  const { options: employeeOptions } = useEmployeeOptions();
  const [options, setOptions] = useState<{
    departments: SelectOption[];
    insurance: SelectOption[];
    shifts: SelectOption[];
  }>({ departments: [], insurance: [], shifts: [] });

  useEffect(() => {
    Promise.all([
      departmentService.getAll({ limit: 1000 }),
      insuranceSettingsService.getAll({ limit: 1000 }),
      shiftService.getAll({ limit: 1000 }),
    ]).then(([dept, ins, shft]) => {
      setOptions({
        departments: dept.data.map((d) => ({ label: d.name, value: d.id })),
        insurance: ins.data.map((i) => ({
          label: `${i.employee_rate}% / ${i.company_rate}%`,
          value: i.id,
        })),
        shifts: shft.data.map((s) => ({ label: s.name, value: s.id })),
      });
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
        key: "department_id",
        label: isAr ? "القسم" : "Department",
        type: "select",
        options: options.departments,
      },
      {
        key: "status",
        label: isAr ? "حالة العقد" : "Contract status",
        type: "select",
        options: [
          { label: isAr ? "نشط" : "Active", value: "active" },
          { label: isAr ? "موقوف" : "Suspended", value: "suspended" },
          { label: isAr ? "مستقيل" : "Resigned", value: "resigned" },
          { label: isAr ? "مفصول" : "Dismissed", value: "dismissed" },
        ],
      },
      { key: "salary_min", label: isAr ? "المرتب من" : "Salary from", type: "number" },
      { key: "salary_max", label: isAr ? "المرتب إلى" : "Salary to", type: "number" },
      { key: "employee_age_min", label: isAr ? "عمر الموظف من" : "Employee age from", type: "number" },
      { key: "employee_age_max", label: isAr ? "عمر الموظف إلى" : "Employee age to", type: "number" },
    ],
    [isAr, employeeOptions, options.departments]
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilter(key as keyof typeof CONTRACT_FILTER_INITIAL, value);
    list.setPage(1);
  };

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "employee_id",
        label: t("form.employee"),
        type: "select",
        options: employeeOptions,
      },
      {
        name: "job_title",
        label: t("form.jobTitle"),
        type: "text",
        placeholder: "e.g. Backend Developer",
      },
      {
        name: "department_id",
        label: t("form.department"),
        type: "select",
        options: options.departments,
      },
      {
        name: "base_salary",
        label: t("form.baseSalary"),
        type: "number",
      },
      { name: "start_date", label: t("form.startDate"), type: "date" },
      { name: "end_date", label: t("form.endDate"), type: "date" },
      {
        name: "duration_years",
        label: t("form.duration"),
        type: "number",
      },
      {
        name: "shift_id",
        label: t("form.shift"),
        type: "select",
        options: options.shifts,
      },
      {
        name: "insurance_setting_id",
        label: t("form.insurance"),
        type: "select",
        options: options.insurance,
      },
      {
        name: "status",
        label: t("form.status"),
        type: "select",
        options: [
          { label: isAr ? "نشط" : "Active", value: "active" },
          { label: isAr ? "موقوف" : "Suspended", value: "suspended" },
          { label: isAr ? "مستقيل" : "Resigned", value: "resigned" },
          { label: isAr ? "مفصول" : "Dismissed", value: "dismissed" },
        ],
      },
      {
        name: "overtime_enabled",
        label: t("form.overtime"),
        type: "checkbox",
      },
      {
        name: "notes",
        label: t("form.notes"),
        type: "textarea",
        colSpan: 2,
      },
      {
        name: "attachment",
        label: t("form.attachment"),
        type: "text",
        placeholder: "/uploads/...",
        colSpan: 2,
      },
    ],
    [options, t, isAr]
  );

  const columns: DataTableColumn<Contract>[] = [
    {
      key: "employee_id",
      label: t("table.employee"),
      render: (row) => {
        if (row.employee) {
          return (
            <span className="font-semibold text-slate-700">
              {row.employee.code} - {row.employee.full_name}
            </span>
          );
        }
        const opt = employeeOptions.find((e) => e.value === row.employee_id);
        return (
          <span className="font-semibold text-slate-700">
            {opt?.label ?? `ID: ${row.employee_id}`}
          </span>
        );
      },
    },
    {
      key: "job_title",
      label: t("table.jobTitle"),
      render: (row) => (
        <span className="font-medium text-indigo-600">{row.job_title}</span>
      ),
    },
    {
      key: "base_salary",
      label: t("table.salary"),
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {Number(row.base_salary).toLocaleString(isAr ? "ar-EG" : "en-US")}{" "}
          EGP
        </span>
      ),
    },
    {
      key: "status",
      label: t("table.status"),
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const actions: RowAction<Contract>[] = [
    {
      type: "view",
      onClick: (row) => router.push(`/${locale}/contracts/${row.id}`),
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
        job_title: list.selected.job_title,
        department_id: list.selected.department_id,
        base_salary: list.selected.base_salary,
        start_date: list.selected.start_date?.split("T")[0] ?? "",
        end_date: list.selected.end_date?.split("T")[0] ?? "",
        duration_years: list.selected.duration_years ?? 1,
        shift_id: list.selected.shift_id,
        insurance_setting_id: list.selected.insurance_setting_id ?? "",
        status: list.selected.status,
        overtime_enabled: list.selected.overtime_enabled,
        notes: list.selected.notes ?? "",
        attachment: list.selected.attachment ?? "",
      }
    : {
        employee_id: "",
        job_title: "",
        department_id: "",
        base_salary: "",
        start_date: "",
        end_date: "",
        duration_years: 1,
        shift_id: "",
        insurance_setting_id: "",
        status: "active",
        overtime_enabled: true,
        notes: "",
        attachment: "",
      };

  return (
    <RoleGuard permission="read:employees">
      <div className="p-6">
        <PageHeader
          title={t("title")}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: t("title") },
          ]}
          action={
            user && can(user.role, "manage:employees")
              ? {
                  label: t("buttons.newContract"),
                  onClick: list.openCreate,
                  permission: "manage:employees" as Permission,
                }
              : undefined
          }
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
          exportFilename="contracts"
          data={list.data}
          loading={list.loading}
          pagination={{
            page: list.page,
            limit: list.limit,
            total: list.total,
            onPageChange: list.setPage,
          }}
          onSearch={list.setKeyword}
          searchPlaceholder={t("buttons.search")}
          onRowClick={(row) => router.push(`/${locale}/contracts/${row.id}`)}
          actions={actions}
          emptyMessage={isAr ? "لا توجد عقود" : "No contracts found"}
          emptyAction={
            user && can(user.role, "manage:employees")
              ? { label: t("buttons.newContract"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={contractSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={t("addNew")}
          editTitle={t("editContract")}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف هذا العقد؟"
              : "Are you sure you want to delete this contract?"
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
