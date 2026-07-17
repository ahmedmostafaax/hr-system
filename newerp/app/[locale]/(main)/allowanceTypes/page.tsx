"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Banknote, Hash, CheckCircle2, XCircle } from "lucide-react";
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
import { allowanceService, type AllowanceType } from "./service";
import { accountService, type Account } from "../account/service";
import { allowanceTypeSchema } from "@/lib/validations/allowanceType.schema";
import { formatCurrency } from "@/lib/utils/currency";
import { z } from "zod";

export default function AllowanceTypesPage() {
  const t = useTranslations("allowances");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(allowanceService);
  const schema = useMemo(() => allowanceTypeSchema(t), [t]);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);

  useEffect(() => {
    accountService.getAll({ limit: 500 }).then((res) => {
      setAllAccounts(res.data);
    });
  }, []);

  const accountOptions = useMemo(
    () => allAccounts.map((acc) => ({ label: `${acc.code} - ${acc.name}`, value: acc.code })),
    [allAccounts]
  );

  const fields: FormFieldConfig[] = [
    { name: "name", label: t("form.name"), type: "text", placeholder: t("form.namePlaceholder") },
    {
      name: "default_amount",
      label: t("form.defaultAmount"),
      type: "number",
      placeholder: "0.00",
    },
    {
      name: "account_code",
      label: t("form.accountCode"),
      type: "select",
      options: accountOptions,
    },
    { name: "is_part_of_salary", label: t("form.isPartOfSalary"), type: "checkbox" },
  ];

  const columns: DataTableColumn<AllowanceType>[] = [
    {
      key: "name",
      label: t("table.name"),
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2 font-semibold text-indigo-600">
          <Banknote size={16} className="text-indigo-500" />
          {row.name}
        </span>
      ),
    },
    {
      key: "default_amount",
      label: t("table.amount"),
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {formatCurrency(row.default_amount, isAr)}
        </span>
      ),
    },
    {
      key: "account_code",
      label: t("table.accountCode"),
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-xs">
          <Hash size={12} />
          {row.account_code}
        </div>
      ),
    },
    {
      key: "is_part_of_salary",
      label: t("table.salaryStatus"),
      render: (row) => (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold w-fit border ${
            row.is_part_of_salary
              ? "bg-blue-50 text-blue-600 border-blue-100"
              : "bg-slate-50 text-slate-500 border-slate-100"
          }`}
        >
          {row.is_part_of_salary ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {row.is_part_of_salary
            ? isAr
              ? "ضمن الراتب"
              : "Part of Salary"
            : isAr
              ? "بدل خارجي"
              : "External"}
        </div>
      ),
    },
  ];

  const actions: RowAction<AllowanceType>[] = [];
  if (user && can(user.role, "manage:settings")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/allowanceTypes/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        name: list.selected.name,
        default_amount: list.selected.default_amount,
        account_code: list.selected.account_code,
        is_part_of_salary: list.selected.is_part_of_salary,
      }
    : { name: "", default_amount: "", account_code: "", is_part_of_salary: true };

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
                  label: t("buttons.newAllowance"),
                  onClick: list.openCreate,
                  permission: "manage:settings" as Permission,
                }
              : undefined
          }
        />

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="allowance-types"
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
          onRowClick={(row) => router.push(`/${locale}/allowanceTypes/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:settings")
              ? { label: t("buttons.newAllowance"), onClick: list.openCreate }
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
          editTitle={t("editAllowance")}
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
