"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { leaveTypeService, type LeaveType } from "./service";
import { leaveTypeSchema } from "@/lib/validations/leaveType.schema";
import { z } from "zod";

export default function LeaveTypesPage() {
  const t = useTranslations("leaveTypes");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(leaveTypeService);
  const schema = useMemo(() => leaveTypeSchema(t), [t]);

  const fields: FormFieldConfig[] = [
    { name: "name", label: t("form.name"), type: "text", placeholder: t("form.namePlaceholder") },
    {
      name: "annual_balance",
      label: t("form.annualBalance"),
      type: "number",
      placeholder: t("form.balancePlaceholder"),
    },
    { name: "affects_deduction", label: t("form.affectsDeduction"), type: "checkbox" },
  ];

  const columns: DataTableColumn<LeaveType>[] = [
    {
      key: "name",
      label: t("table.name"),
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2 font-semibold text-indigo-600">
          <CalendarDays size={16} className="text-emerald-500" />
          {row.name}
        </span>
      ),
    },
    {
      key: "annual_balance",
      label: t("table.annualBalance"),
      render: (row) => (
        <span className="font-semibold text-slate-600">
          {row.annual_balance} {isAr ? "يوم" : "Days"}
        </span>
      ),
    },
    {
      key: "affects_deduction",
      label: t("table.affectsDeduction"),
      render: (row) => (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit border ${
            row.affects_deduction
              ? "bg-rose-50 text-rose-600 border-rose-100"
              : "bg-blue-50 text-blue-600 border-blue-100"
          }`}
        >
          {row.affects_deduction ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
          {row.affects_deduction
            ? isAr
              ? "يخصم من الراتب"
              : "Affects Salary"
            : isAr
              ? "إجازة مدفوعة"
              : "Paid Leave"}
        </div>
      ),
    },
  ];

  const actions: RowAction<LeaveType>[] = [];
  if (user && can(user.role, "manage:settings")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/leaveTypes/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        name: list.selected.name,
        annual_balance: list.selected.annual_balance,
        affects_deduction: list.selected.affects_deduction,
      }
    : { name: "", annual_balance: 21, affects_deduction: false };

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
                  label: t("buttons.newLeaveType"),
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
          onRowClick={(row) => router.push(`/${locale}/leaveTypes/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:settings")
              ? { label: t("buttons.newLeaveType"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={schema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={t("addNew")}
          editTitle={t("editLeaveType")}
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
