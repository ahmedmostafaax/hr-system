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
import {
  contractAllowanceService,
  type ContractAllowance,
} from "./service";
import { contractService, allowanceTypeService } from "@/lib/services";
import { contractAllowanceSchema } from "@/lib/validations/contractAllowance.schema";
import { z } from "zod";

type SelectOption = { label: string; value: string | number };

export default function ContractAllowancesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(contractAllowanceService);
  const [options, setOptions] = useState<{
    contracts: SelectOption[];
    allowanceTypes: SelectOption[];
  }>({ contracts: [], allowanceTypes: [] });

  useEffect(() => {
    Promise.all([
      contractService.getAll({ limit: 1000 }),
      allowanceTypeService.getAll({ limit: 1000 }),
    ]).then(([contractsRes, typesRes]) => {
      setOptions({
        contracts: contractsRes.data.map((c) => ({
          label: `${(c as { Employee?: { full_name?: string }; employee?: { full_name?: string } }).Employee?.full_name ?? c.employee?.full_name ?? ""} - ${c.job_title}`,
          value: c.id,
        })),
        allowanceTypes: typesRes.data.map((t) => ({
          label: t.name,
          value: t.id,
        })),
      });
    });
  }, []);

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "contract_id",
        label: isAr ? "العقد / الموظف" : "Contract / Employee",
        type: "select",
        options: options.contracts,
        colSpan: 2,
      },
      {
        name: "allowance_type_id",
        label: isAr ? "نوع البدل" : "Allowance Type",
        type: "select",
        options: options.allowanceTypes,
      },
      {
        name: "amount",
        label: isAr ? "المبلغ" : "Amount",
        type: "number",
      },
    ],
    [options, isAr]
  );

  const columns: DataTableColumn<ContractAllowance>[] = [
    {
      key: "contract_id",
      label: isAr ? "العقد" : "Contract",
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {row.EmployeeContract?.job_title ??
            options.contracts.find((c) => c.value === row.contract_id)?.label ??
            `#${row.contract_id}`}
        </span>
      ),
    },
    {
      key: "allowance_type_id",
      label: isAr ? "نوع البدل" : "Allowance Type",
      render: (row) => (
        <span className="text-indigo-700 font-medium">
          {row.Allowance?.name ??
            options.allowanceTypes.find((t) => t.value === row.allowance_type_id)
              ?.label ??
            "—"}
        </span>
      ),
    },
    {
      key: "amount",
      label: isAr ? "المبلغ" : "Amount",
      render: (row) => (
        <span className="font-semibold text-emerald-600">
          {Number(row.amount).toLocaleString(isAr ? "ar-EG" : "en-US")} EGP
        </span>
      ),
    },
  ];

  const actions: RowAction<ContractAllowance>[] = [
    {
      type: "view",
      onClick: (row) =>
        router.push(`/${locale}/contract_allowances/${row.id}`),
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
        allowance_type_id: list.selected.allowance_type_id,
        amount: list.selected.amount,
      }
    : { contract_id: "", allowance_type_id: "", amount: "" };

  return (
    <RoleGuard permission="read:employees">
      <div className="p-6">
        <PageHeader
          title={isAr ? "بدلات العقود" : "Contract Allowances"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "بدلات العقود" : "Contract Allowances" },
          ]}
          action={
            user && can(user.role, "manage:employees")
              ? {
                  label: isAr ? "إضافة بدل" : "Add Allowance",
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
            isAr ? "بحث عن بدل..." : "Search allowances..."
          }
          onRowClick={(row) =>
            router.push(`/${locale}/contract_allowances/${row.id}`)
          }
          actions={actions}
          emptyMessage={isAr ? "لا توجد بدلات" : "No allowances found"}
          emptyAction={
            user && can(user.role, "manage:employees")
              ? {
                  label: isAr ? "إضافة بدل" : "Add Allowance",
                  onClick: list.openCreate,
                }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={isAr ? "بدل العقد" : "Contract Allowance"}
          schema={contractAllowanceSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={isAr ? "إضافة بدل جديد" : "Add Allowance"}
          editTitle={isAr ? "تعديل البدل" : "Edit Allowance"}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف هذا البدل؟"
              : "Are you sure you want to delete this allowance?"
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
