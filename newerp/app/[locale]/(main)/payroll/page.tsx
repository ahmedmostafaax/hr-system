"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Eye,
  CheckCircle,
  Banknote,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
  StatusBadge,
  ListFilters,
  type FilterFieldConfig,
} from "@/components/shared";
import type { DataTableColumn, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { useListFilters } from "@/lib/hooks/useListFilters";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import { payrollRunService, type PayrollRun } from "./service";
import { payrollRunCreateSchema } from "@/lib/validations/payrollRun.schema";
import { z } from "zod";

const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PAYROLL_FILTER_INITIAL = {
  month: "",
  year: "",
};

export default function PayrollPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();
  const canManage = user && can(user.role, "manage:payroll");

  const { filters, setFilter, resetFilters, apiParams } = useListFilters(PAYROLL_FILTER_INITIAL);
  const listParams = useMemo(
    () => ({ sort: "period", ...apiParams }),
    [apiParams]
  );
  const list = useListPage(payrollRunService, listParams);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const monthOptions = useMemo(
    () =>
      (isAr ? MONTHS_AR : MONTHS_EN).map((label, i) => ({
        label,
        value: i + 1,
      })),
    [isAr]
  );

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => ({
      label: String(current - i),
      value: current - i,
    }));
  }, []);

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      {
        key: "month",
        label: isAr ? "الشهر" : "Month",
        type: "select",
        options: monthOptions,
      },
      {
        key: "year",
        label: isAr ? "السنة" : "Year",
        type: "select",
        options: yearOptions,
      },
    ],
    [isAr, monthOptions, yearOptions]
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilter(key as keyof typeof PAYROLL_FILTER_INITIAL, value);
    list.setPage(1);
  };

  const fields: FormFieldConfig[] = [
    {
      name: "month",
      label: isAr ? "الشهر" : "Month",
      type: "select",
      options: monthOptions,
    },
    {
      name: "year",
      label: isAr ? "السنة" : "Year",
      type: "number",
      placeholder: String(new Date().getFullYear()),
    },
    {
      name: "auto_process",
      label: isAr ? "معالجة تلقائية" : "Auto Process",
      type: "checkbox",
      colSpan: 2,
    },
  ];

  const monthLabel = (month: number) => {
    const names = isAr ? MONTHS_AR : MONTHS_EN;
    return names[month - 1] ?? String(month);
  };

  const handleCreate = async (formData: Record<string, unknown>) => {
    const autoProcess =
      formData.auto_process === true || formData.auto_process === "true";
    try {
      await payrollRunService.create({
        month: Number(formData.month),
        year: Number(formData.year),
        auto_process: autoProcess,
        status: "draft",
      } as Partial<PayrollRun>);
      notify.success(
        autoProcess
          ? isAr
            ? "تم إنشاء وحساب دورة الرواتب بنجاح"
            : "Payroll run created and processed"
          : isAr
            ? "تم إنشاء دورة الرواتب (مسودة)"
            : "Payroll run draft created"
      );
      list.closeModal();
      await list.fetch();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
      throw err;
    }
  };

  const handleStatusUpdate = async (
    row: PayrollRun,
    status: "confirmed" | "paid"
  ) => {
    setActionLoading(row.id);
    try {
      await payrollRunService.update(row.id, { status });
      notify.success(
        status === "confirmed"
          ? isAr
            ? "تم تأكيد دورة الرواتب"
            : "Payroll run confirmed"
          : isAr
            ? "تم تسجيل الدفع"
            : "Payroll marked as paid"
      );
      await list.fetch();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecalculate = async (row: PayrollRun) => {
    setActionLoading(row.id);
    try {
      await payrollRunService.recalculate(row.id);
      notify.success(isAr ? "تم إعادة الحساب" : "Recalculated successfully");
      await list.fetch();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setActionLoading(null);
    }
  };

  const columns: DataTableColumn<PayrollRun>[] = [
    {
      key: "month",
      label: isAr ? "الشهر" : "Month",
      render: (row) => (
        <span className="font-semibold text-slate-800">{monthLabel(row.month)}</span>
      ),
    },
    {
      key: "year",
      label: isAr ? "السنة" : "Year",
      render: (row) => <span className="font-medium">{row.year}</span>,
    },
    {
      key: "status",
      label: isAr ? "الحالة" : "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "processed_by",
      label: isAr ? "معالَج بواسطة" : "Processed By",
      render: (row) => (row.processed_by ? `#${row.processed_by}` : "—"),
    },
    {
      key: "processed_at",
      label: isAr ? "تاريخ المعالجة" : "Processed At",
      render: (row) =>
        row.processed_at
          ? new Date(row.processed_at).toLocaleString(isAr ? "ar-EG" : "en-US")
          : "—",
    },
    {
      key: "operations",
      label: isAr ? "إجراءات" : "Actions",
      width: "220px",
      render: (row) => {
        const busy = actionLoading === row.id;

        return (
          <div
            className={`flex items-center flex-wrap gap-1 ${isAr ? "flex-row-reverse justify-end" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              title={isAr ? "عرض" : "View"}
              disabled={busy}
              onClick={() => router.push(`/${locale}/payroll/${row.id}`)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
            </button>

            {canManage && row.status === "draft" && (
              <>
                <button
                  type="button"
                  title={isAr ? "تأكيد" : "Confirm"}
                  disabled={busy}
                  onClick={() => handleStatusUpdate(row, "confirmed")}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title={isAr ? "إعادة حساب" : "Recalculate"}
                  disabled={busy}
                  onClick={() => handleRecalculate(row)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </>
            )}

            {canManage && row.status === "confirmed" && (
              <button
                type="button"
                title={isAr ? "تسجيل الدفع" : "Mark Paid"}
                disabled={busy}
                onClick={() => handleStatusUpdate(row, "paid")}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                <Banknote className="w-4 h-4" />
              </button>
            )}

            {canManage && row.status !== "paid" && (
              <button
                type="button"
                title={isAr ? "حذف" : "Delete"}
                disabled={busy}
                onClick={() => list.setDeleteTarget(row)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const defaultValues = {
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    auto_process: true,
  };

  return (
    <RoleGuard permission="read:payroll">
      <div className="p-6">
        <PageHeader
          title={isAr ? "دورات الرواتب" : "Payroll Runs"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "دورات الرواتب" : "Payroll Runs" },
          ]}
          action={
            canManage
              ? {
                  label: isAr ? "دورة رواتب جديدة" : "New Payroll Run",
                  onClick: list.openCreate,
                  permission: "manage:payroll" as Permission,
                }
              : undefined
          }
        />

        <ListFilters
          fields={filterFields}
          values={filters}
          onChange={handleFilterChange}
          onReset={() => {
            resetFilters();
            list.setPage(1);
          }}
          isAr={isAr}
        />

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="payroll-runs"
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
            isAr
              ? "بحث: يوليو، 2026، 7/2026، مسودة..."
              : "Search: July, 2026, 7/2026, draft..."
          }
          onRowClick={(row) => router.push(`/${locale}/payroll/${row.id}`)}
          emptyMessage={
            isAr ? "لا توجد دورات رواتب" : "No payroll runs found"
          }
          emptyAction={
            canManage
              ? {
                  label: isAr ? "دورة رواتب جديدة" : "New Payroll Run",
                  onClick: list.openCreate,
                }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode="create"
          entityName={isAr ? "دورة رواتب" : "Payroll Run"}
          schema={payrollRunCreateSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={handleCreate}
          createTitle={isAr ? "إنشاء دورة رواتب" : "Create Payroll Run"}
          renderAfterFields={({ watch }) => {
            const autoProcess = watch("auto_process");
            const checked =
              autoProcess === true ||
              autoProcess === "true" ||
              autoProcess === undefined;
            if (!checked) return null;
            return (
              <p className="sm:col-span-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                {isAr
                  ? "سيتم حساب رواتب كل الموظفين وتأكيد الدورة — قد يستغرق دقيقة أو أكثر"
                  : "All employee salaries will be calculated and confirmed — this may take a minute or more"}
              </p>
            );
          }}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف دورة الرواتب هذه؟"
              : "Are you sure you want to delete this payroll run?"
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
