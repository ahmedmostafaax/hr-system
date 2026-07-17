"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
} from "@/components/shared";
import type { DataTableColumn, RowAction, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { employeeService } from "@/lib/services";
import { relativeService, type EmployeeRelative } from "./service";
import { employeeRelativeSchema } from "@/lib/validations/employeeRelative.schema";
import { z } from "zod";

export default function EmployeeRelativesPage() {
  const t = useTranslations("relatives");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(relativeService);
  const [employeeOptions, setEmployeeOptions] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    employeeService.getAll({ limit: 1000 }).then((res) => {
      setEmployeeOptions(
        res.data.map((emp) => ({
          label: `${emp.code} - ${emp.full_name}`,
          value: emp.id,
        }))
      );
    });
  }, [list.data]);

  const relationOptions = useMemo(
    () => [
      { label: t("relations.Father"), value: "Father" },
      { label: t("relations.Mother"), value: "Mother" },
      { label: t("relations.Spouse"), value: "Spouse" },
      { label: t("relations.Son"), value: "Son" },
      { label: t("relations.Daughter"), value: "Daughter" },
      { label: t("relations.Brother"), value: "Brother" },
      { label: t("relations.Sister"), value: "Sister" },
      { label: t("relations.Other"), value: "Other" },
    ],
    [t]
  );

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "employee_id",
        label: t("form.employee"),
        type: "select",
        options: employeeOptions,
      },
      {
        name: "name",
        label: t("form.name"),
        type: "text",
        placeholder: t("form.namePlaceholder"),
      },
      {
        name: "relation",
        label: t("form.relation"),
        type: "select",
        options: relationOptions,
      },
      {
        name: "phone",
        label: t("form.phone"),
        type: "text",
        placeholder: t("form.phonePlaceholder"),
      },
    ],
    [t, employeeOptions, relationOptions]
  );

  const columns: DataTableColumn<EmployeeRelative>[] = [
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
      key: "name",
      label: t("table.name"),
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-indigo-600">{row.name}</span>
      ),
    },
    {
      key: "relation",
      label: t("table.relation"),
      render: (row) => t(`relations.${row.relation}`),
    },
    {
      key: "phone",
      label: t("table.phone"),
      render: (row) => <span dir="ltr">{row.phone}</span>,
    },
  ];

  const actions: RowAction<EmployeeRelative>[] = [];
  if (user && can(user.role, "manage:employees")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/employeeRelative/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        employee_id: list.selected.employee_id,
        name: list.selected.name,
        relation: list.selected.relation,
        phone: list.selected.phone,
      }
    : { employee_id: "", name: "", relation: "Father", phone: "" };

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
                  label: t("buttons.newRelative"),
                  onClick: list.openCreate,
                  permission: "manage:employees" as Permission,
                }
              : undefined
          }
        />

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="employee-relatives"
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
          onRowClick={(row) => router.push(`/${locale}/employeeRelative/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:employees")
              ? { label: t("buttons.newRelative"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={employeeRelativeSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={t("addRelative")}
          editTitle={t("editRelative")}
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
