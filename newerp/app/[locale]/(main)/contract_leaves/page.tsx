"use client";

import { useEffect, useMemo, useState } from "react";
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
import { contractLeaveService, type ContractLeave } from "./service";
import { contractService, leaveTypeService } from "@/lib/services";
import { contractLeaveSchema } from "@/lib/validations/contractLeave.schema";
import { z } from "zod";

type SelectOption = { label: string; value: string | number };

export default function ContractLeavesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(contractLeaveService);
  const [options, setOptions] = useState<{
    contracts: SelectOption[];
    leaveTypes: SelectOption[];
  }>({ contracts: [], leaveTypes: [] });

  useEffect(() => {
    Promise.all([
      contractService.getAll({ limit: 1000 }),
      leaveTypeService.getAll({ limit: 1000 }),
    ]).then(([contractsRes, leaveTypesRes]) => {
      setOptions({
        contracts: contractsRes.data.map((c) => ({
          label: `${(c as { Employee?: { code?: string; full_name?: string } }).Employee?.code ?? c.employee?.code ?? ""} - ${(c as { Employee?: { full_name?: string } }).Employee?.full_name ?? c.employee?.full_name ?? ""}`,
          value: c.id,
        })),
        leaveTypes: leaveTypesRes.data.map((lt) => ({
          label: lt.name,
          value: lt.id,
        })),
      });
    });
  }, []);

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "contract_id",
        label: isAr ? "الموظف / العقد" : "Employee / Contract",
        type: "select",
        options: options.contracts,
        colSpan: 2,
      },
      {
        name: "leave_type_id",
        label: isAr ? "نوع الإجازة" : "Leave Type",
        type: "select",
        options: options.leaveTypes,
      },
      {
        name: "used_days",
        label: isAr ? "الأيام المستخدمة" : "Used Days",
        type: "number",
      },
      {
        name: "year",
        label: isAr ? "السنة" : "Year",
        type: "number",
      },
    ],
    [options, isAr]
  );

  const columns: DataTableColumn<ContractLeave>[] = [
    {
      key: "contract_id",
      label: isAr ? "الموظف" : "Employee",
      render: (row) => (
        <span className="font-semibold text-slate-700">
          {row.EmployeeContract?.Employee?.full_name ??
            options.contracts.find((c) => c.value === row.contract_id)?.label ??
            `#${row.contract_id}`}
        </span>
      ),
    },
    {
      key: "leave_type_id",
      label: isAr ? "نوع الإجازة" : "Leave Type",
      render: (row) => (
        <span className="text-rose-600 font-medium">
          {row.LeaveType?.name ??
            options.leaveTypes.find((lt) => lt.value === row.leave_type_id)
              ?.label ??
            "—"}
        </span>
      ),
    },
    {
      key: "used_days",
      label: isAr ? "الاستهلاك" : "Used",
      render: (row) => (
        <span className="font-semibold text-slate-900">
          {row.used_days} {isAr ? "يوم" : "days"}
        </span>
      ),
    },
    {
      key: "year",
      label: isAr ? "العام" : "Year",
      render: (row) => <span className="text-slate-500">{row.year}</span>,
    },
  ];

  const actions: RowAction<ContractLeave>[] = [
    {
      type: "view",
      onClick: (row) =>
        router.push(`/${locale}/contract_leaves/${row.id}`),
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
        contract_id: list.selected.contract_id,
        leave_type_id: list.selected.leave_type_id,
        used_days: list.selected.used_days,
        year: list.selected.year,
      }
    : {
        contract_id: "",
        leave_type_id: "",
        used_days: "",
        year: new Date().getFullYear(),
      };

  return (
    <RoleGuard permission="read:employees">
      <div className="p-6">
        <PageHeader
          title={isAr ? "أرصدة إجازات العقود" : "Contract Leave Balances"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            {
              label: isAr ? "أرصدة إجازات العقود" : "Contract Leave Balances",
            },
          ]}
          action={
            user && can(user.role, "manage:employees")
              ? {
                  label: isAr ? "تخصيص رصيد" : "Allocate Balance",
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
          searchPlaceholder={
            isAr ? "بحث بموظف أو إجازة..." : "Search by employee or leave..."
          }
          onRowClick={(row) =>
            router.push(`/${locale}/contract_leaves/${row.id}`)
          }
          actions={actions}
          emptyMessage={isAr ? "لا توجد أرصدة" : "No leave balances found"}
          emptyAction={
            user && can(user.role, "manage:employees")
              ? {
                  label: isAr ? "تخصيص رصيد" : "Allocate Balance",
                  onClick: list.openCreate,
                }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={isAr ? "رصيد الإجازة" : "Leave Balance"}
          schema={contractLeaveSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={isAr ? "تخصيص رصيد إجازة" : "Allocate Leave Balance"}
          editTitle={isAr ? "تعديل رصيد الإجازة" : "Edit Leave Balance"}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف هذا الرصيد؟"
              : "Are you sure you want to delete this balance?"
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
