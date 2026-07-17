"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
  ListFilters,
  type FilterFieldConfig,
} from "@/components/shared";
import { useListFilters } from "@/lib/hooks/useListFilters";
import { useEmployeeOptions } from "@/lib/hooks/useEmployeeOptions";
import type { DataTableColumn, RowAction, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { experienceService, type EmployeeExperience } from "./service";
import { employeeExperienceSchema } from "@/lib/validations/employeeExperience.schema";
import { z } from "zod";

const EXPERIENCE_FILTER_INITIAL = {
  employee_id: "",
  from_year: "",
  to_year: "",
};

export default function EmployeeExperiencePage() {
  const t = useTranslations("experience");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const { filters, setFilter, resetFilters, apiParams } = useListFilters(EXPERIENCE_FILTER_INITIAL);
  const list = useListPage(experienceService, apiParams);
  const { options: employeeOptions } = useEmployeeOptions();

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      {
        key: "employee_id",
        label: isAr ? "الموظف" : "Employee",
        type: "select",
        options: employeeOptions,
      },
      { key: "from_year", label: isAr ? "من سنة" : "From year", type: "number", placeholder: "2015" },
      { key: "to_year", label: isAr ? "إلى سنة" : "To year", type: "number", placeholder: "2024" },
    ],
    [isAr, employeeOptions]
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilter(key as keyof typeof EXPERIENCE_FILTER_INITIAL, value);
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
        name: "company_name",
        label: t("form.company"),
        type: "text",
        placeholder: t("form.company"),
      },
      {
        name: "position",
        label: t("form.position"),
        type: "text",
        placeholder: t("form.position"),
      },
      { name: "from_date", label: t("form.fromDate"), type: "date" },
      { name: "to_date", label: t("form.toDate"), type: "date" },
    ],
    [t, employeeOptions]
  );

  const columns: DataTableColumn<EmployeeExperience>[] = [
    { key: "id", label: "ID", width: "80px" },
    {
      key: "employee_id",
      label: t("table.employee"),
      render: (row) => {
        const emp = employeeOptions.find((opt) => opt.value === row.employee_id);
        return emp?.label ?? `ID: ${row.employee_id}`;
      },
    },
    {
      key: "position",
      label: t("table.role"),
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{row.position}</span>
          <span className="text-xs text-slate-400">{row.company_name}</span>
        </div>
      ),
    },
    {
      key: "from_date",
      label: t("table.duration"),
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.from_date} — {row.to_date ?? "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: t("table.createdAt") || "تاريخ الإنشاء",
      render: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")
          : "—",
    },
  ];

  const actions: RowAction<EmployeeExperience>[] = [];
  if (user && can(user.role, "manage:employees")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/employeeExperience/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        employee_id: list.selected.employee_id,
        company_name: list.selected.company_name,
        position: list.selected.position ?? "",
        from_date: list.selected.from_date?.slice(0, 10) ?? "",
        to_date: list.selected.to_date?.slice(0, 10) ?? "",
      }
    : { employee_id: "", company_name: "", position: "", from_date: "", to_date: "" };

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
                  label: t("buttons.newExperience"),
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
          exportFilename="employee-experience"
          data={list.data}
          loading={list.loading}
          pagination={{
            page: list.page,
            limit: list.limit,
            total: list.total,
            onPageChange: list.setPage,
          }}
          onSearch={list.setKeyword}
          searchPlaceholder={t("buttons.searchPlaceholder")}
          onRowClick={(row) => router.push(`/${locale}/employeeExperience/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:employees")
              ? { label: t("buttons.newExperience"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={employeeExperienceSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={t("addExperience")}
          editTitle={t("editExperience")}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={t("messages.confirmDelete") || "تأكيد الحذف"}
          description={t("messages.deleteWarning") || "هل أنت متأكد من حذف هذا السجل؟"}
          confirmLabel={t("buttons.delete") || "حذف"}
          loading={list.deleting}
          onConfirm={list.confirmDelete}
          onCancel={() => list.setDeleteTarget(null)}
        />
      </div>
    </RoleGuard>
  );
}
