"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Lock, Unlock, Loader2 } from "lucide-react";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
  StatusBadge,
} from "@/components/shared";
import type { DataTableColumn, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { notify } from "@/lib/toast";
import { accountingPeriodService, type AccountingPeriod } from "./service";
import { accountingPeriodSchema } from "@/lib/validations/accountingPeriod.schema";
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

export default function AccountingPeriodsPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isAr = locale === "ar";

  const list = useListPage(accountingPeriodService);
  const [closeTarget, setCloseTarget] = useState<AccountingPeriod | null>(null);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  const monthOptions = useMemo(
    () =>
      (isAr ? MONTHS_AR : MONTHS_EN).map((label, i) => ({
        label,
        value: i + 1,
      })),
    [isAr]
  );

  const monthLabel = (month: number) => {
    const names = isAr ? MONTHS_AR : MONTHS_EN;
    return names[month - 1] ?? String(month);
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
  ];

  const handleStatusChange = async (
    row: AccountingPeriod,
    status: "open" | "closed"
  ) => {
    setStatusLoading(row.id);
    try {
      await accountingPeriodService.update(row.id, { status });
      notify.success(
        status === "closed"
          ? isAr
            ? "تم إغلاق الفترة المحاسبية"
            : "Accounting period closed"
          : isAr
            ? "تم إعادة فتح الفترة المحاسبية"
            : "Accounting period reopened"
      );
      setCloseTarget(null);
      await list.fetch();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setStatusLoading(null);
    }
  };

  const columns: DataTableColumn<AccountingPeriod>[] = [
    {
      key: "month",
      label: isAr ? "الشهر" : "Month",
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {monthLabel(row.month)}
        </span>
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
      key: "closed_by",
      label: isAr ? "أغلق بواسطة" : "Closed By",
      render: (row) =>
        row.closed_by ? `#${row.closed_by}` : "—",
    },
    {
      key: "closed_at",
      label: isAr ? "تاريخ الإغلاق" : "Closed At",
      render: (row) =>
        row.closed_at
          ? new Date(row.closed_at).toLocaleString(isAr ? "ar-EG" : "en-US")
          : "—",
    },
    {
      key: "actions",
      label: isAr ? "إجراءات" : "Actions",
      width: "100px",
      render: (row) => {
        const busy = statusLoading === row.id;

        return (
          <div
            className={`flex items-center gap-1 ${isAr ? "flex-row-reverse justify-end" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {row.status === "open" ? (
              <button
                type="button"
                title={isAr ? "إغلاق الفترة" : "Close Period"}
                disabled={busy}
                onClick={() => setCloseTarget(row)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </button>
            ) : (
              <button
                type="button"
                title={isAr ? "إعادة فتح" : "Reopen"}
                disabled={busy}
                onClick={() => handleStatusChange(row, "open")}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlock className="w-4 h-4" />
                )}
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
  };

  return (
    <RoleGuard permission="manage:accountingPeriods">
      <div className="p-6">
        <PageHeader
          title={isAr ? "الفترات المحاسبية" : "Accounting Periods"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "الفترات المحاسبية" : "Accounting Periods" },
          ]}
          action={{
            label: isAr ? "فترة جديدة" : "New Period",
            onClick: list.openCreate,
            permission: "manage:accountingPeriods",
          }}
        />

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="accounting-periods"
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
            isAr ? "بحث بالشهر أو السنة..." : "Search by month or year..."
          }
          emptyMessage={
            isAr ? "لا توجد فترات محاسبية" : "No accounting periods found"
          }
          emptyAction={{
            label: isAr ? "فترة جديدة" : "New Period",
            onClick: list.openCreate,
          }}
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode="create"
          entityName={isAr ? "الفترة المحاسبية" : "Accounting Period"}
          schema={accountingPeriodSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={isAr ? "إنشاء فترة محاسبية" : "Create Accounting Period"}
        />

        <ConfirmDialog
          open={!!closeTarget}
          variant="warning"
          title={isAr ? "إغلاق الفترة المحاسبية" : "Close Accounting Period"}
          description={
            isAr
              ? "⚠️ بعد إغلاق الفترة لن يمكن إضافة أو تعديل قيود اليومية فيها. هل تريد المتابعة؟"
              : "⚠️ After closing this period, journal entries cannot be added or modified. Continue?"
          }
          confirmLabel={isAr ? "إغلاق الفترة" : "Close Period"}
          loading={statusLoading !== null}
          onConfirm={async () => {
            if (closeTarget) await handleStatusChange(closeTarget, "closed");
          }}
          onCancel={() => setCloseTarget(null)}
        />
      </div>
    </RoleGuard>
  );
}
