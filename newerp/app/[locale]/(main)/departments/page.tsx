"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
  StatusBadge,
} from "@/components/shared";
import type { DataTableColumn, RowAction } from "@/components/shared";
import type { FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { useLookupStore } from "@/lib/store";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { departmentService, type Department } from "./service";
import { departmentSchema } from "@/lib/validations/department.schema";
import { z } from "zod";

export default function DepartmentsPage() {
  const t = useTranslations("departments");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(departmentService);
  const lookupDepartments = useLookupStore((s) => s.departments);
  const lookupLoaded = useLookupStore((s) => s.loaded);
  const loadLookups = useLookupStore((s) => s.load);

  useEffect(() => {
    if (!lookupLoaded) loadLookups();
  }, [lookupLoaded, loadLookups]);

  const allDepartments = useMemo(
    () =>
      lookupDepartments.length > 0
        ? (lookupDepartments as unknown as Department[])
        : list.data,
    [lookupDepartments, list.data]
  );

  const parentOptions = useMemo(
    () =>
      allDepartments
        .filter((d) => d.id !== list.selected?.id)
        .map((d) => ({ label: d.name, value: d.id })),
    [allDepartments, list.selected?.id]
  );

  const fields: FormFieldConfig[] = [
    { name: "name", label: t("form.name"), type: "text", placeholder: t("form.namePlaceholder") },
    { name: "type", label: t("form.type"), type: "text", placeholder: t("form.typePlaceholder") },
    {
      name: "parent_id",
      label: t("form.parent"),
      type: "select",
      options: parentOptions,
    },
  ];

  const columns: DataTableColumn<Department>[] = [
    { key: "id", label: t("table.id"), width: "80px" },
    {
      key: "name",
      label: t("table.name"),
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-indigo-600">{row.name}</span>
      ),
    },
    { key: "type", label: t("table.type") },
    {
      key: "parent_id",
      label: t("table.parent"),
      render: (row) => {
        if (!row.parent_id) return "—";
        const parent = allDepartments.find((d) => d.id === row.parent_id);
        return parent?.name ?? String(row.parent_id);
      },
    },
    {
      key: "isActive",
      label: t("table.status"),
      render: (row) => (
        <StatusBadge status={row.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key: "createdAt",
      label: t("table.createdAt"),
      render: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")
          : "—",
    },
  ];

  const actions: RowAction<Department>[] = [];
  if (user && can(user.role, "manage:settings")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/departments/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        name: list.selected.name,
        type: list.selected.type,
        parent_id: list.selected.parent_id ?? "",
      }
    : { name: "", type: "", parent_id: "" };

  return (
    <RoleGuard permission="read:settings">
      <div className="p-6">
        <PageHeader
          title={t("title")}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: t("title") },
          ]}
          action={
            user && can(user.role, "manage:settings")
              ? {
                  label: t("buttons.newDepartment"),
                  onClick: list.openCreate,
                  permission: "manage:settings" as Permission,
                }
              : undefined
          }
        />

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="departments"
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
          onRowClick={(row) => router.push(`/${locale}/departments/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:settings")
              ? { label: t("buttons.newDepartment"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={departmentSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={t("addNew")}
          editTitle={t("editDepartment")}
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
