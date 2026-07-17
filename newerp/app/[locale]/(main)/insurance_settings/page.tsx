"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Building2, UserCog, CalendarClock } from "lucide-react";
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
import { insuranceService, type InsuranceSetting } from "./service";
import { insuranceSchema } from "@/lib/validations/insurance.schema";
import { z } from "zod";

export default function InsuranceSettingsPage() {
  const t = useTranslations("insurance");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(insuranceService);

  const fields: FormFieldConfig[] = [
    {
      name: "employee_rate",
      label: t("form.employeeRate"),
      type: "number",
      placeholder: "e.g. 11.00",
    },
    {
      name: "company_rate",
      label: t("form.companyRate"),
      type: "number",
      placeholder: "e.g. 18.75",
    },
    { name: "effective_from", label: t("form.effectiveFrom"), type: "date" },
  ];

  const columns: DataTableColumn<InsuranceSetting>[] = [
    {
      key: "employee_rate",
      label: t("table.employeeRate"),
      render: (row) => (
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <UserCog size={16} className="text-blue-500" />
          {row.employee_rate}%
        </div>
      ),
    },
    {
      key: "company_rate",
      label: t("table.companyRate"),
      render: (row) => (
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <Building2 size={16} className="text-indigo-500" />
          {row.company_rate}%
        </div>
      ),
    },
    {
      key: "effective_from",
      label: t("table.effectiveDate"),
      render: (row) => (
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
          <CalendarClock size={14} />
          {new Date(row.effective_from).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
        </div>
      ),
    },
    {
      key: "total",
      label: t("table.totalRate"),
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
          {(Number(row.employee_rate) + Number(row.company_rate)).toFixed(2)}%
        </span>
      ),
    },
  ];

  const actions: RowAction<InsuranceSetting>[] = [];
  if (user && can(user.role, "manage:settings")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/insurance_settings/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        employee_rate: list.selected.employee_rate,
        company_rate: list.selected.company_rate,
        effective_from: list.selected.effective_from,
      }
    : { employee_rate: "", company_rate: "", effective_from: "" };

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
                  label: t("buttons.newSetting"),
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
          onRowClick={(row) => router.push(`/${locale}/insurance_settings/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:settings")
              ? { label: t("buttons.newSetting"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={insuranceSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={t("addNew")}
          editTitle={t("editSetting")}
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
