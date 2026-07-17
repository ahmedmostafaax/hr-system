"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { UserX, MinusCircle, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
} from "@/components/shared";
import type { DataTableColumn, RowAction } from "@/components/shared";
import type { FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { absenceService, type AbsenceType } from "./service";
import { absenceTypeSchema } from "@/lib/validations/absenceType.schema";
import { z } from "zod";

export default function AbsenceTypesPage() {
  const t = useTranslations("absences");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(absenceService);

  const fields: FormFieldConfig[] = [
    { name: "name", label: t("form.name"), type: "text", placeholder: t("form.namePlaceholder") },
    {
      name: "deduct_days",
      label: t("form.deductDays"),
      type: "number",
      placeholder: t("form.daysPlaceholder"),
    },
    { name: "requires_permission", label: t("form.requiresPermission"), type: "checkbox" },
  ];

  const columns: DataTableColumn<AbsenceType>[] = [
    {
      key: "name",
      label: t("table.name"),
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2 font-semibold text-indigo-600">
          <UserX size={16} className="text-rose-500" />
          {row.name}
        </span>
      ),
    },
    {
      key: "deduct_days",
      label: t("table.deductFactor"),
      render: (row) => (
        <div className="flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50/50 px-3 py-1 rounded-lg border border-rose-100 w-fit">
          <MinusCircle size={14} />
          {row.deduct_days} {isAr ? "أيام" : "Days"}
        </div>
      ),
    },
    {
      key: "requires_permission",
      label: t("table.permission"),
      render: (row) => (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit border ${
            row.requires_permission
              ? "bg-amber-50 text-amber-600 border-amber-100"
              : "bg-emerald-50 text-emerald-600 border-emerald-100"
          }`}
        >
          {row.requires_permission ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
          {row.requires_permission
            ? isAr
              ? "يتطلب إذن"
              : "Requires Permission"
            : isAr
              ? "بدون إذن"
              : "No Permission"}
        </div>
      ),
    },
  ];

  const actions: RowAction<AbsenceType>[] = [];
  if (user && can(user.role, "manage:settings")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/absence_types/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        name: list.selected.name,
        deduct_days: list.selected.deduct_days,
        requires_permission: list.selected.requires_permission,
      }
    : { name: "", deduct_days: 1, requires_permission: false };

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
                  label: t("buttons.newAbsenceType"),
                  onClick: list.openCreate,
                  permission: "manage:settings" as Permission,
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
          searchPlaceholder={t("buttons.search")}
          onRowClick={(row) => router.push(`/${locale}/absence_types/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:settings")
              ? { label: t("buttons.newAbsenceType"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={absenceTypeSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={t("addNew")}
          editTitle={t("editAbsenceType")}
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
