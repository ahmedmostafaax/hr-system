"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
  StatusBadge,
  PeriodFilter,
} from "@/components/shared";
import type { DataTableColumn, RowAction, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { usePeriodFilter } from "@/lib/hooks/usePeriodFilter";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { custodyService, type Custody } from "./service";
import { custodySchema } from "@/lib/validations/custody.schema";
import { z } from "zod";
import { useEmployeeOptions } from "@/lib/hooks/useEmployeeOptions";

export default function CustodyPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const period = usePeriodFilter();
  const list = useListPage(custodyService, period.apiParams);
  const { options: employeeOptions } = useEmployeeOptions();

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "item_name",
        label: isAr ? "اسم العهدة / الجهاز" : "Item Name",
        type: "text",
        placeholder: isAr ? "مثال: Laptop Dell" : "e.g. Laptop Dell",
        colSpan: 2,
      },
      {
        name: "from_employee_id",
        label: isAr ? "مُسلم العهدة" : "From Employee",
        type: "select",
        options: employeeOptions,
      },
      {
        name: "to_employee_id",
        label: isAr ? "مستلم العهدة" : "To Employee",
        type: "select",
        options: employeeOptions,
      },
      {
        name: "transfer_type",
        label: isAr ? "نوع العملية" : "Transfer Type",
        type: "select",
        options: [
          { label: isAr ? "تسليم" : "Handover", value: "handover" },
          { label: isAr ? "استلام" : "Receive", value: "receive" },
          { label: isAr ? "نقل" : "Transfer", value: "transfer" },
        ],
      },
      {
        name: "transfer_date",
        label: isAr ? "تاريخ النقل" : "Transfer Date",
        type: "date",
      },
      {
        name: "notes",
        label: isAr ? "ملاحظات" : "Notes",
        type: "textarea",
        colSpan: 2,
      },
    ],
    [employeeOptions, isAr]
  );

  const columns: DataTableColumn<Custody>[] = [
    {
      key: "item_name",
      label: isAr ? "العهدة" : "Item",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{row.item_name}</span>
          {row.notes && (
            <span className="text-xs text-slate-400 truncate max-w-[200px]">
              {row.notes}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "transfer",
      label: isAr ? "من → إلى" : "From → To",
      render: (row) => (
        <div className="text-xs">
          <span className="text-slate-500">
            {row.fromEmployee?.full_name ?? "—"}
          </span>
          <span className="mx-1 text-indigo-400">→</span>
          <span className="font-semibold text-indigo-600">
            {row.toEmployee?.full_name ?? "—"}
          </span>
        </div>
      ),
    },
    {
      key: "transfer_type",
      label: isAr ? "الحالة" : "Type",
      render: (row) => <StatusBadge status={row.transfer_type} />,
    },
    {
      key: "transfer_date",
      label: isAr ? "التاريخ" : "Date",
      render: (row) =>
        row.transfer_date
          ? new Date(row.transfer_date).toLocaleDateString(
              isAr ? "ar-EG" : "en-US"
            )
          : "—",
    },
  ];

  const actions: RowAction<Custody>[] = [
    {
      type: "view",
      onClick: (row) => router.push(`/${locale}/custody/${row.id}`),
    },
  ];
  if (user && can(user.role, "manage:employees")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }

  const defaultValues = list.selected
    ? {
        item_name: list.selected.item_name,
        from_employee_id: list.selected.from_employee_id ?? "",
        to_employee_id: list.selected.to_employee_id,
        transfer_type: list.selected.transfer_type,
        transfer_date: list.selected.transfer_date?.split("T")[0] ?? "",
        notes: list.selected.notes ?? "",
      }
    : {
        item_name: "",
        from_employee_id: "",
        to_employee_id: "",
        transfer_type: "handover",
        transfer_date: new Date().toISOString().split("T")[0],
        notes: "",
      };

  return (
    <RoleGuard permission="read:employees">
      <div className="p-6">
        <PageHeader
          title={isAr ? "إدارة عهد الموظفين" : "Employee Custody"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "العهدة" : "Custody" },
          ]}
          action={
            user && can(user.role, "manage:employees")
              ? {
                  label: isAr ? "نقل عهدة جديدة" : "New Transfer",
                  onClick: list.openCreate,
                  permission: "manage:employees" as Permission,
                }
              : undefined
          }
        />

        <PeriodFilter
          className="mb-4"
          scope={period.scope}
          month={period.month}
          year={period.year}
          onScopeChange={period.setScope}
          onMonthChange={period.setMonth}
          onYearChange={period.setYear}
          onAnyChange={() => list.setPage(1)}
          isAr={isAr}
        />

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="custody"
          data={list.data}
          loading={list.loading}
          pagination={{
            page: list.page,
            limit: list.limit,
            total: list.total,
            onPageChange: list.setPage,
          }}
          onSearch={list.setKeyword}
          searchPlaceholder={isAr ? "بحث عن عهدة..." : "Search custody..."}
          onRowClick={(row) => router.push(`/${locale}/custody/${row.id}`)}
          actions={actions}
          emptyMessage={isAr ? "لا توجد عهد" : "No custody records found"}
          emptyAction={
            user && can(user.role, "manage:employees")
              ? {
                  label: isAr ? "نقل عهدة جديدة" : "New Transfer",
                  onClick: list.openCreate,
                }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={isAr ? "العهدة" : "Custody"}
          schema={custodySchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={isAr ? "تسجيل عملية نقل" : "Record Transfer"}
          editTitle={isAr ? "تعديل بيانات النقل" : "Edit Transfer"}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف هذا السجل؟"
              : "Are you sure you want to delete this record?"
          }
          confirmLabel={isAr ? "حذف" : "Delete"}
          loading={list.deleting}
          onConfirm={list.confirmDelete}
          onCancel={() => list.setDeleteTarget(null)}
        />
      </div>
    </RoleGuard>
  );
}
