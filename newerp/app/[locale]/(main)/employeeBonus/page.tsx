"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
  StatusBadge,
  ApprovalBadge,
  PeriodFilter,
} from "@/components/shared";
import type { DataTableColumn, RowAction, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { usePeriodFilter } from "@/lib/hooks/usePeriodFilter";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import { bonusService, type EmployeeBonus } from "./service";
import { employeeService, bonusTypeService } from "@/lib/services";
import { employeeBonusSchema } from "@/lib/validations/employeeBonus.schema";
import { z } from "zod";

type SelectOption = { label: string; value: string | number };
type ApprovalFilter = "all" | "pending" | "approved" | "rejected";

export default function EmployeeBonusesPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const period = usePeriodFilter();
  const extraParams = useMemo(
    () => ({
      ...period.apiParams,
      ...(approvalFilter === "all" ? {} : { approval_status: approvalFilter }),
    }),
    [approvalFilter, period.apiParams]
  );

  const list = useListPage(bonusService, extraParams);
  const [options, setOptions] = useState<{
    employees: SelectOption[];
    bonusTypes: SelectOption[];
  }>({ employees: [], bonusTypes: [] });
  const [rejectTarget, setRejectTarget] = useState<EmployeeBonus | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approving, setApproving] = useState(false);

  const canApprove = user && can(user.role, "approve:bonuses");

  useEffect(() => {
    Promise.all([
      employeeService.getAll({ limit: 1000 }),
      bonusTypeService.getAll({ limit: 1000 }),
    ]).then(([empRes, typeRes]) => {
      setOptions({
        employees: empRes.data.map((e) => ({
          label: `${e.code} - ${e.full_name}`,
          value: e.id,
        })),
        bonusTypes: typeRes.data.map((b) => ({
          label: b.name,
          value: b.id,
        })),
      });
    });
  }, []);

  const handleApprove = useCallback(
    async (row: EmployeeBonus) => {
      setApproving(true);
      try {
        await bonusService.update(row.id, { approval_status: "approved" });
        notify.success(isAr ? "تم اعتماد المكافأة" : "Bonus approved");
        await list.fetch();
      } catch (err) {
        notify.handleApiError(err as { message?: string });
      } finally {
        setApproving(false);
      }
    },
    [isAr, list]
  );

  const handleReject = useCallback(async () => {
    if (!rejectTarget) return;
    setApproving(true);
    try {
      await bonusService.update(rejectTarget.id, {
        approval_status: "rejected",
        rejection_reason: rejectionReason,
      });
      notify.success(isAr ? "تم رفض المكافأة" : "Bonus rejected");
      setRejectTarget(null);
      setRejectionReason("");
      await list.fetch();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setApproving(false);
    }
  }, [rejectTarget, rejectionReason, isAr, list]);

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "employee_id",
        label: isAr ? "الموظف" : "Employee",
        type: "select",
        options: options.employees,
        colSpan: 2,
      },
      {
        name: "bonus_type_id",
        label: isAr ? "نوع المكافأة" : "Bonus Type",
        type: "select",
        options: options.bonusTypes,
      },
      {
        name: "amount",
        label: isAr ? "المبلغ" : "Amount",
        type: "number",
      },
      {
        name: "grant_date",
        label: isAr ? "تاريخ المنح" : "Grant Date",
        type: "date",
      },
      {
        name: "is_paid",
        label: isAr ? "تم الدفع؟" : "Paid?",
        type: "checkbox",
      },
      {
        name: "payment_month",
        label: isAr ? "شهر الاستحقاق" : "Payment Month",
        type: "number",
      },
      {
        name: "payment_year",
        label: isAr ? "سنة الاستحقاق" : "Payment Year",
        type: "number",
      },
    ],
    [options, isAr]
  );

  const columns: DataTableColumn<EmployeeBonus>[] = useMemo(() => {
    const base: DataTableColumn<EmployeeBonus>[] = [
      {
        key: "employee",
        label: isAr ? "الموظف" : "Employee",
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800">
              {row.Employee?.full_name ?? row.employee?.full_name ?? "—"}
            </span>
            <span className="text-xs text-slate-400">
              {row.Employee?.code ?? row.employee?.code ?? ""}
            </span>
          </div>
        ),
      },
      {
        key: "bonus_type",
        label: isAr ? "النوع" : "Type",
        render: (row) => (
          <span className="text-amber-700 font-medium">
            {row.BonusType?.name ?? row.bonus_type?.name ?? "—"}
          </span>
        ),
      },
      {
        key: "amount",
        label: isAr ? "القيمة" : "Amount",
        render: (row) => (
          <span className="font-semibold text-slate-900">
            {Number(row.amount).toLocaleString(isAr ? "ar-EG" : "en-US")} EGP
          </span>
        ),
      },
      {
        key: "payment_period",
        label: isAr ? "فترة الاستحقاق" : "Period",
        render: (row) =>
          row.payment_month && row.payment_year
            ? `${row.payment_month}/${row.payment_year}`
            : "—",
      },
      {
        key: "is_paid",
        label: isAr ? "الحالة" : "Status",
        render: (row) => (
          <StatusBadge status={row.is_paid ? "paid" : "open"} />
        ),
      },
      {
        key: "approval_status",
        label: isAr ? "حالة الاعتماد" : "Approval",
        render: (row) => <ApprovalBadge status={row.approval_status} />,
      },
    ];

    if (canApprove) {
      base.push({
        key: "approval_actions",
        label: isAr ? "إجراءات الاعتماد" : "Approval Actions",
        render: (row) =>
          row.approval_status === "pending" ? (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={approving}
                onClick={() => handleApprove(row)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isAr ? "اعتماد" : "Approve"}
              </button>
              <button
                type="button"
                disabled={approving}
                onClick={() => {
                  setRejectTarget(row);
                  setRejectionReason("");
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isAr ? "رفض" : "Reject"}
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          ),
      });
    }

    return base;
  }, [isAr, canApprove, approving, handleApprove]);

  const actions: RowAction<EmployeeBonus>[] = [
    {
      type: "view",
      onClick: (row) => router.push(`/${locale}/employeeBonus/${row.id}`),
    },
  ];
  if (user && can(user.role, "manage:bonuses")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }

  const defaultValues = list.selected
    ? {
        employee_id: list.selected.employee_id,
        bonus_type_id: list.selected.bonus_type_id,
        amount: list.selected.amount,
        grant_date: list.selected.grant_date?.split("T")[0] ?? "",
        is_paid: list.selected.is_paid,
        payment_month: list.selected.payment_month ?? new Date().getMonth() + 1,
        payment_year: list.selected.payment_year ?? new Date().getFullYear(),
      }
    : {
        employee_id: "",
        bonus_type_id: "",
        amount: "",
        grant_date: new Date().toISOString().split("T")[0],
        is_paid: true,
        payment_month: new Date().getMonth() + 1,
        payment_year: new Date().getFullYear(),
      };

  return (
    <RoleGuard permission="read:employees">
      <div className="p-6">
        <PageHeader
          title={isAr ? "مكافآت الموظفين" : "Employee Bonuses"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "المكافآت" : "Bonuses" },
          ]}
          action={
            user && can(user.role, "manage:bonuses")
              ? {
                  label: isAr ? "منح مكافأة" : "Grant Bonus",
                  onClick: list.openCreate,
                  permission: "manage:bonuses" as Permission,
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

        <div className="mb-4 flex items-center gap-3">
          <label
            htmlFor="bonus-approval-filter"
            className="text-sm font-medium text-slate-600 whitespace-nowrap"
          >
            {isAr ? "حالة الاعتماد:" : "Approval status:"}
          </label>
          <select
            id="bonus-approval-filter"
            value={approvalFilter}
            onChange={(e) => {
              setApprovalFilter(e.target.value as ApprovalFilter);
              list.setPage(1);
            }}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">{isAr ? "الكل" : "All"}</option>
            <option value="pending">{isAr ? "في الانتظار" : "Pending"}</option>
            <option value="approved">{isAr ? "معتمد" : "Approved"}</option>
            <option value="rejected">{isAr ? "مرفوض" : "Rejected"}</option>
          </select>
        </div>

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
            isAr ? "بحث باسم الموظف..." : "Search by employee..."
          }
          onRowClick={(row) => router.push(`/${locale}/employeeBonus/${row.id}`)}
          actions={actions}
          emptyMessage={isAr ? "لا توجد مكافآت" : "No bonuses found"}
          emptyAction={
            user && can(user.role, "manage:bonuses")
              ? {
                  label: isAr ? "منح مكافأة" : "Grant Bonus",
                  onClick: list.openCreate,
                }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={isAr ? "المكافأة" : "Bonus"}
          schema={employeeBonusSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={isAr ? "تسجيل مكافأة جديدة" : "New Bonus"}
          editTitle={isAr ? "تعديل المكافأة" : "Edit Bonus"}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف هذه المكافأة؟"
              : "Are you sure you want to delete this bonus?"
          }
          confirmLabel={isAr ? "حذف" : "Delete"}
          loading={list.deleting}
          onConfirm={list.confirmDelete}
          onCancel={() => list.setDeleteTarget(null)}
        />

        {rejectTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => !approving && setRejectTarget(null)}
          >
            <div
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              dir={isAr ? "rtl" : "ltr"}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {isAr ? "رفض المكافأة" : "Reject Bonus"}
                </h3>
                <p className="text-slate-600 mb-4 text-sm">
                  {isAr
                    ? "يرجى إدخال سبب الرفض قبل المتابعة."
                    : "Please provide a rejection reason before continuing."}
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder={isAr ? "سبب الرفض..." : "Rejection reason..."}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setRejectTarget(null)}
                    disabled={approving}
                    className="px-4 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium transition-colors disabled:opacity-50"
                  >
                    {isAr ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={approving || !rejectionReason.trim()}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {approving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isAr ? "تأكيد الرفض" : "Confirm Reject"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
