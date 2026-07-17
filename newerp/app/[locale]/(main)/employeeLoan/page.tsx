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
import { useEmployeeOptions } from "@/lib/hooks/useEmployeeOptions";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import { loanService, type EmployeeLoan } from "./service";
import { employeeLoanSchema } from "@/lib/validations/employeeLoan.schema";
import { z } from "zod";

type ApprovalFilter = "all" | "pending" | "approved" | "rejected";

export default function EmployeeLoansPage() {
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

  const list = useListPage(loanService, extraParams);
  const { options: employeeOptions } = useEmployeeOptions();
  const [rejectTarget, setRejectTarget] = useState<EmployeeLoan | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approving, setApproving] = useState(false);

  const canApprove = user && can(user.role, "approve:loans");

  const handleApprove = useCallback(
    async (row: EmployeeLoan) => {
      setApproving(true);
      try {
        await loanService.update(row.id, { approval_status: "approved" });
        notify.success(isAr ? "تم اعتماد السلفة/القرض" : "Loan approved");
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
      await loanService.update(rejectTarget.id, {
        approval_status: "rejected",
        rejection_reason: rejectionReason,
      });
      notify.success(isAr ? "تم رفض السلفة/القرض" : "Loan rejected");
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
        options: employeeOptions,
        colSpan: 2,
      },
      {
        name: "type",
        label: isAr ? "نوع المعاملة" : "Type",
        type: "select",
        options: [
          { label: isAr ? "قرض" : "Loan", value: "loan" },
          { label: isAr ? "سلفة" : "Advance", value: "advance" },
        ],
      },
      {
        name: "amount",
        label: isAr ? "المبلغ الإجمالي" : "Total Amount",
        type: "number",
      },
      {
        name: "installment_amount",
        label: isAr ? "مبلغ القسط" : "Installment",
        type: "number",
      },
      {
        name: "paid_amount",
        label: isAr ? "المبلغ المدفوع" : "Paid Amount",
        type: "number",
      },
      {
        name: "grant_date",
        label: isAr ? "تاريخ المنح" : "Grant Date",
        type: "date",
      },
      {
        name: "status",
        label: isAr ? "الحالة" : "Status",
        type: "select",
        options: [
          { label: isAr ? "نشط" : "Active", value: "active" },
          { label: isAr ? "تم التسوية" : "Settled", value: "settled" },
        ],
      },
    ],
    [employeeOptions, isAr]
  );

  const columns: DataTableColumn<EmployeeLoan>[] = useMemo(() => {
    const base: DataTableColumn<EmployeeLoan>[] = [
      {
        key: "employee_id",
        label: isAr ? "الموظف" : "Employee",
        render: (row) => (
          <span className="font-semibold text-slate-800">
            {row.Employee?.full_name ??
              row.employee?.full_name ??
              employeeOptions.find((e) => e.value === row.employee_id)?.label ??
              `#${row.employee_id}`}
          </span>
        ),
      },
      {
        key: "amount",
        label: isAr ? "المبلغ / القسط" : "Amount / Installment",
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">
              {Number(row.amount).toLocaleString(isAr ? "ar-EG" : "en-US")} EGP
            </span>
            <span className="text-xs text-indigo-600">
              {isAr ? "قسط:" : "Installment:"}{" "}
              {Number(row.installment_amount ?? 0).toLocaleString(
                isAr ? "ar-EG" : "en-US"
              )}
            </span>
          </div>
        ),
      },
      {
        key: "balance",
        label: isAr ? "المتبقي" : "Remaining",
        render: (row) => {
          const remaining = row.amount - row.paid_amount;
          return (
            <span
              className={`font-semibold ${remaining > 0 ? "text-rose-600" : "text-emerald-600"}`}
            >
              {remaining.toLocaleString(isAr ? "ar-EG" : "en-US")} EGP
            </span>
          );
        },
      },
      {
        key: "type",
        label: isAr ? "النوع" : "Type",
        render: (row) => <StatusBadge status={row.type} />,
      },
      {
        key: "status",
        label: isAr ? "الحالة" : "Status",
        render: (row) => <StatusBadge status={row.status} />,
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
  }, [isAr, employeeOptions, canApprove, approving, handleApprove]);

  const actions: RowAction<EmployeeLoan>[] = [
    {
      type: "view",
      onClick: (row) => router.push(`/${locale}/employeeLoan/${row.id}`),
    },
  ];
  if (user && can(user.role, "manage:loans")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }

  const defaultValues = list.selected
    ? {
        employee_id: list.selected.employee_id,
        type: list.selected.type,
        amount: list.selected.amount,
        installment_amount: list.selected.installment_amount ?? "",
        paid_amount: list.selected.paid_amount,
        grant_date: list.selected.grant_date?.split("T")[0] ?? "",
        status: list.selected.status,
      }
    : {
        employee_id: "",
        type: "loan",
        amount: "",
        installment_amount: "",
        paid_amount: 0,
        grant_date: new Date().toISOString().split("T")[0],
        status: "active",
      };

  return (
    <RoleGuard permission="read:employees">
      <div className="p-6">
        <PageHeader
          title={isAr ? "إدارة السلف والقروض" : "Employee Loans & Advances"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "السلف والقروض" : "Loans" },
          ]}
          action={
            user && can(user.role, "manage:loans")
              ? {
                  label: isAr ? "إضافة سلفة/قرض" : "Add Loan",
                  onClick: list.openCreate,
                  permission: "manage:loans" as Permission,
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
            htmlFor="loan-approval-filter"
            className="text-sm font-medium text-slate-600 whitespace-nowrap"
          >
            {isAr ? "حالة الاعتماد:" : "Approval status:"}
          </label>
          <select
            id="loan-approval-filter"
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
          exportFetcher={list.fetchAllData}
          exportFilename="employee-loans"
          data={list.data}
          loading={list.loading}
          pagination={{
            page: list.page,
            limit: list.limit,
            total: list.total,
            onPageChange: list.setPage,
          }}
          onSearch={list.setKeyword}
          searchPlaceholder={isAr ? "بحث بموظف..." : "Search by employee..."}
          onRowClick={(row) => router.push(`/${locale}/employeeLoan/${row.id}`)}
          actions={actions}
          emptyMessage={isAr ? "لا توجد سلف" : "No loans found"}
          emptyAction={
            user && can(user.role, "manage:loans")
              ? {
                  label: isAr ? "إضافة سلفة/قرض" : "Add Loan",
                  onClick: list.openCreate,
                }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={isAr ? "السلفة" : "Loan"}
          schema={employeeLoanSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={isAr ? "تسجيل سلفة أو قرض" : "New Loan"}
          editTitle={isAr ? "تعديل المعاملة" : "Edit Loan"}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف هذه المعاملة؟"
              : "Are you sure you want to delete this loan?"
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
                  {isAr ? "رفض السلفة/القرض" : "Reject Loan"}
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
