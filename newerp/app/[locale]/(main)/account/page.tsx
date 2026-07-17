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
import { accountService, type Account } from "./service";
import { accountSchema } from "@/lib/validations/account.schema";
import { z } from "zod";

export default function AccountsPage() {
  const t = useTranslations("accounts");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(accountService);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);

  useEffect(() => {
    accountService.getAll({ limit: 500 }).then((res) => {
      setAllAccounts(res.data);
    });
  }, [list.data]);

  const parentOptions = useMemo(
    () =>
      allAccounts
        .filter((acc) => acc.id !== list.selected?.id)
        .map((acc) => ({ label: `${acc.code} - ${acc.name}`, value: acc.id })),
    [allAccounts, list.selected?.id]
  );

  const schema = useMemo(() => accountSchema(t), [t]);

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "name",
        label: t("form.name"),
        type: "text",
        placeholder: t("form.namePlaceholder"),
      },
      {
        name: "code",
        label: t("form.code"),
        type: "text",
        placeholder: t("form.code"),
      },
      {
        name: "type",
        label: t("form.type"),
        type: "select",
        options: [
          { label: isAr ? "مصروفات" : "Expense", value: "expense" },
          { label: isAr ? "إيرادات" : "Revenue", value: "revenue" },
          { label: isAr ? "أصول" : "Asset", value: "asset" },
          { label: isAr ? "خصوم" : "Liability", value: "liability" },
          { label: isAr ? "حقوق ملكية" : "Equity", value: "equity" },
        ],
      },
      {
        name: "parent_id",
        label: t("form.parentAccount"),
        type: "select",
        options: parentOptions,
      },
      {
        name: "currency",
        label: t("form.currency"),
        type: "select",
        options: [
          { label: "EGP", value: "EGP" },
          { label: "USD", value: "USD" },
          { label: "SAR", value: "SAR" },
          { label: "EUR", value: "EUR" },
        ],
      },
      {
        name: "description",
        label: t("form.description"),
        type: "textarea",
        placeholder: t("form.descPlaceholder"),
        colSpan: 2,
      },
    ],
    [t, isAr, parentOptions]
  );

  const columns: DataTableColumn<Account>[] = [
    {
      key: "code",
      label: t("table.code"),
      width: "100px",
      render: (row) => (
        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
          {row.code}
        </span>
      ),
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
      key: "type",
      label: t("table.type"),
      render: (row) => (
        <span className="text-xs font-medium uppercase text-slate-600">{row.type}</span>
      ),
    },
    { key: "currency", label: t("table.currency") },
    {
      key: "parent_id",
      label: t("table.parent"),
      render: (row) => {
        if (!row.parent_id) return "—";
        const parent = allAccounts.find((a) => a.id === row.parent_id);
        return parent?.name ?? String(row.parent_id);
      },
    },
  ];

  const actions: RowAction<Account>[] = [];
  if (user && can(user.role, "manage:accounts")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/account/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        name: list.selected.name,
        code: list.selected.code,
        type: list.selected.type,
        parent_id: list.selected.parent_id ?? "",
        currency: list.selected.currency,
        description: list.selected.description ?? "",
      }
    : {
        name: "",
        code: "",
        type: "expense",
        parent_id: "",
        currency: "EGP",
        description: "",
      };

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
            user && can(user.role, "manage:accounts")
              ? {
                  label: t("buttons.newAccount"),
                  onClick: list.openCreate,
                  permission: "manage:accounts" as Permission,
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
          onRowClick={(row) => router.push(`/${locale}/account/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:accounts")
              ? { label: t("buttons.newAccount"), onClick: list.openCreate }
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
          editTitle={t("editAccount")}
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
