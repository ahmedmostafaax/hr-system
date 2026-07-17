"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Eye } from "lucide-react";
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
import { documentService, type EmployeeDocument } from "./service";
import { employeeDocumentSchema } from "@/lib/validations/employeeDocument.schema";
import { z } from "zod";

export default function EmployeeDocumentsPage() {
  const t = useTranslations("documents");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(documentService);
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

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "employee_id",
        label: t("form.employee"),
        type: "select",
        options: employeeOptions,
      },
      {
        name: "doc_name",
        label: t("form.docName"),
        type: "text",
        placeholder: t("form.docNamePlaceholder"),
      },
      {
        name: "file_path",
        label: t("form.file"),
        type: "text",
        placeholder: t("form.filePlaceholder"),
        colSpan: 2,
      },
    ],
    [t, employeeOptions]
  );

  const columns: DataTableColumn<EmployeeDocument>[] = [
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
      key: "doc_name",
      label: t("table.docName"),
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-indigo-600">{row.doc_name}</span>
      ),
    },
    {
      key: "file_path",
      label: t("table.view"),
      render: (row) => (
        <a
          href={row.file_path}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium text-xs"
        >
          <Eye size={14} />
          {t("table.viewFile")}
        </a>
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

  const actions: RowAction<EmployeeDocument>[] = [];
  if (user && can(user.role, "manage:employees")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/employeeDocument/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        employee_id: list.selected.employee_id,
        doc_name: list.selected.doc_name,
        file_path: list.selected.file_path,
        uploaded_at: list.selected.uploaded_at ?? "",
      }
    : { employee_id: "", doc_name: "", file_path: "", uploaded_at: "" };

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
                  label: t("buttons.newDoc"),
                  onClick: list.openCreate,
                  permission: "manage:employees" as Permission,
                }
              : undefined
          }
        />

        <DataTable
          columns={columns}
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
          onRowClick={(row) => router.push(`/${locale}/employeeDocument/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:employees")
              ? { label: t("buttons.newDoc"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={employeeDocumentSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={t("addDoc")}
          editTitle={t("editDoc")}
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
