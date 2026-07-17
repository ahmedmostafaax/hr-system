"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Gift, PencilLine, Lock, Banknote, Receipt } from "lucide-react";
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
import { bonusService, type BonusType } from "./service";
import { bonusTypeSchema } from "@/lib/validations/bonusType.schema";
import { formatCurrency } from "@/lib/utils/currency";
import { z } from "zod";

export default function BonusTypesPage() {
  const t = useTranslations("bonuses");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(bonusService);

  const fields: FormFieldConfig[] = [
    { name: "name", label: t("form.name"), type: "text", placeholder: t("form.namePlaceholder") },
    {
      name: "payment_type",
      label: t("form.paymentType"),
      type: "select",
      options: [
        { label: isAr ? "نقدي" : "Cash", value: "cash" },
        { label: isAr ? "آجل" : "Deferred", value: "deferred" },
      ],
    },
    {
      name: "default_amount",
      label: t("form.defaultAmount"),
      type: "number",
      placeholder: "0.00",
    },
    { name: "editable_amount", label: t("form.editableAmount"), type: "checkbox" },
  ];

  const columns: DataTableColumn<BonusType>[] = [
    {
      key: "name",
      label: t("table.name"),
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2 font-semibold text-indigo-600">
          <Gift size={16} className="text-purple-500" />
          {row.name}
        </span>
      ),
    },
    {
      key: "default_amount",
      label: t("table.defaultAmount"),
      render: (row) => (
        <span className="font-bold text-slate-900">
          {formatCurrency(row.default_amount, isAr)}
        </span>
      ),
    },
    {
      key: "payment_type",
      label: t("table.paymentMethod"),
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600">
          {row.payment_type === "cash" ? (
            <Banknote size={14} className="text-emerald-500" />
          ) : (
            <Receipt size={14} className="text-blue-500" />
          )}
          <span className="text-xs font-medium capitalize">{row.payment_type}</span>
        </div>
      ),
    },
    {
      key: "editable_amount",
      label: t("table.flexibility"),
      render: (row) => (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit border ${
            row.editable_amount
              ? "bg-blue-50 text-blue-600 border-blue-100"
              : "bg-slate-50 text-slate-500 border-slate-100"
          }`}
        >
          {row.editable_amount ? <PencilLine size={12} /> : <Lock size={12} />}
          {row.editable_amount
            ? isAr
              ? "قابل للتعديل"
              : "Editable"
            : isAr
              ? "مبلغ ثابت"
              : "Fixed Amount"}
        </div>
      ),
    },
  ];

  const actions: RowAction<BonusType>[] = [];
  if (user && can(user.role, "manage:settings")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/bonus_types/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        name: list.selected.name,
        payment_type: list.selected.payment_type,
        default_amount: list.selected.default_amount ?? "",
        editable_amount: list.selected.editable_amount,
      }
    : { name: "", payment_type: "cash", default_amount: "", editable_amount: true };

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
                  label: t("buttons.newBonusType"),
                  onClick: list.openCreate,
                  permission: "manage:settings" as Permission,
                }
              : undefined
          }
        />

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="bonus-types"
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
          onRowClick={(row) => router.push(`/${locale}/bonus_types/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:settings")
              ? { label: t("buttons.newBonusType"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={bonusTypeSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={t("addNew")}
          editTitle={t("editBonusType")}
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
