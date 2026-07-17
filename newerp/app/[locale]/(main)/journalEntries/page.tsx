"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Eye,
  CheckCircle,
  Ban,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  ConfirmDialog,
  StatusBadge,
} from "@/components/shared";
import type { DataTableColumn, RowAction } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { notify } from "@/lib/toast";
import {
  journalEntryService,
  type JournalEntry,
  type JournalLine,
} from "./service";
import { ManualJournalModal } from "@/components/journal/ManualJournalModal";

const STATUS_LABELS: Record<string, string> = {
  draft: "مسودة",
  posted: "مرحّل",
  cancelled: "ملغى",
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
  manual: "يدوي",
  adjustment: "تسوية",
  payroll_accrual: "استحقاق رواتب",
  payroll_settlement: "تسوية رواتب",
  payroll_insurance_company: "تأمينات",
  loan_grant: "منح قرض",
  bonus_cash: "مكافأة نقدية",
  bonus_deferred: "مكافأة مؤجلة",
};

function formatAmount(value: number) {
  return Number(value).toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ar-EG");
}

export default function JournalEntriesPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();
  const canManage = user && can(user.role, "manage:journalEntries");

  const list = useListPage(journalEntryService);
  const [manualOpen, setManualOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | string | null>(null);

  const openView = async (row: JournalEntry) => {
    setViewLoading(true);
    setViewEntry(null);
    try {
      const entry = await journalEntryService.getById(row.id);
      setViewEntry(entry);
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setViewLoading(false);
    }
  };

  const handleStatusUpdate = async (
    row: JournalEntry,
    status: "draft" | "posted" | "cancelled"
  ) => {
    setActionLoading(row.id);
    try {
      await journalEntryService.update(row.id, { status });
      notify.success(
        status === "posted"
          ? "تم ترحيل القيد"
          : status === "cancelled"
            ? "تم إلغاء القيد"
            : "تم تحديث الحالة"
      );
      await list.fetch();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setActionLoading(null);
    }
  };

  const columns: DataTableColumn<JournalEntry>[] = [
    {
      key: "entry_type",
      label: isAr ? "نوع القيد" : "Type",
      render: (row) => (
        <span className="text-xs font-semibold text-indigo-600">
          {ENTRY_TYPE_LABELS[row.entry_type] ?? row.entry_type}
        </span>
      ),
    },
    {
      key: "description",
      label: isAr ? "الوصف" : "Description",
      render: (row) => (
        <span className="font-medium text-slate-800 line-clamp-1">{row.description}</span>
      ),
    },
    {
      key: "posting_date",
      label: isAr ? "تاريخ الترحيل" : "Posting Date",
      render: (row) => formatDate(row.posting_date),
    },
    {
      key: "total_debit",
      label: isAr ? "إجمالي المدين" : "Total Debit",
      render: (row) => (
        <span className="font-mono text-sm">{formatAmount(row.total_debit)}</span>
      ),
    },
    {
      key: "total_credit",
      label: isAr ? "إجمالي الدائن" : "Total Credit",
      render: (row) => (
        <span className="font-mono text-sm">{formatAmount(row.total_credit)}</span>
      ),
    },
    {
      key: "status",
      label: isAr ? "الحالة" : "Status",
      render: (row) => (
        <StatusBadge
          status={row.status}
          label={STATUS_LABELS[row.status] ?? row.status}
        />
      ),
    },
    {
      key: "operations",
      label: isAr ? "إجراءات" : "Actions",
      width: "180px",
      render: (row) => {
        const busy = actionLoading === row.id;
        return (
          <div
            className="flex items-center flex-wrap gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              title={isAr ? "عرض" : "View"}
              disabled={busy}
              onClick={() => openView(row)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
            </button>

            {canManage && row.status === "draft" && (
              <button
                type="button"
                title={isAr ? "ترحيل" : "Post"}
                disabled={busy}
                onClick={() => handleStatusUpdate(row, "posted")}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}

            {canManage && row.status !== "cancelled" && (
              <button
                type="button"
                title={isAr ? "إلغاء" : "Cancel"}
                disabled={busy}
                onClick={() => handleStatusUpdate(row, "cancelled")}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}

            {canManage && (
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

  const actions: RowAction<JournalEntry>[] = [
    { type: "view", onClick: openView },
  ];

  return (
    <RoleGuard permission="manage:journalEntries">
      <div className="p-6">
        <PageHeader
          title={isAr ? "قيود اليومية" : "Journal Entries"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "قيود اليومية" : "Journal Entries" },
          ]}
          action={
            canManage
              ? {
                  label: "قيد يدوي",
                  onClick: () => setManualOpen(true),
                  permission: "manage:journalEntries" as Permission,
                }
              : undefined
          }
        />

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="journal-entries"
          data={list.data}
          loading={list.loading}
          pagination={{
            page: list.page,
            limit: list.limit,
            total: list.total,
            onPageChange: list.setPage,
          }}
          onSearch={list.setKeyword}
          searchPlaceholder={isAr ? "بحث بالوصف أو النوع..." : "Search..."}
          actions={actions}
          emptyMessage={isAr ? "لا توجد قيود يومية" : "No journal entries"}
          emptyAction={
            canManage
              ? { label: "قيد يدوي", onClick: () => setManualOpen(true) }
              : undefined
          }
        />

        <ManualJournalModal
          isOpen={manualOpen}
          onClose={() => setManualOpen(false)}
          onSuccess={list.fetch}
        />

        {(viewEntry || viewLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800">تفاصيل القيد</h2>
                <button
                  type="button"
                  onClick={() => setViewEntry(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 max-h-[75vh] overflow-y-auto">
                {viewLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                ) : viewEntry ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div>
                        <span className="text-slate-500 font-medium">نوع القيد</span>
                        <p className="font-semibold text-slate-800">
                          {ENTRY_TYPE_LABELS[viewEntry.entry_type] ?? viewEntry.entry_type}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">الحالة</span>
                        <p>
                          <StatusBadge
                            status={viewEntry.status}
                            label={STATUS_LABELS[viewEntry.status]}
                          />
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 font-medium">الوصف</span>
                        <p className="font-semibold text-slate-800">{viewEntry.description}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">تاريخ الترحيل</span>
                        <p className="font-semibold">{formatDate(viewEntry.posting_date)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">الإجماليات</span>
                        <p className="font-mono text-sm">
                          مدين: {formatAmount(viewEntry.total_debit)} | دائن:{" "}
                          {formatAmount(viewEntry.total_credit)}
                        </p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-right font-semibold text-slate-600">
                              كود الحساب
                            </th>
                            <th className="px-4 py-2 text-right font-semibold text-slate-600">
                              اسم الحساب
                            </th>
                            <th className="px-4 py-2 text-right font-semibold text-slate-600">
                              مدين
                            </th>
                            <th className="px-4 py-2 text-right font-semibold text-slate-600">
                              دائن
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(viewEntry.lines ?? []).map((line: JournalLine) => (
                            <tr key={line.id} className="border-t border-slate-100">
                              <td className="px-4 py-2 font-mono text-xs">
                                {line.account_code}
                              </td>
                              <td className="px-4 py-2">{line.account_name}</td>
                              <td className="px-4 py-2 font-mono">
                                {line.debit > 0 ? formatAmount(line.debit) : "—"}
                              </td>
                              <td className="px-4 py-2 font-mono">
                                {line.credit > 0 ? formatAmount(line.credit) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف هذا القيد؟ (حذف ناعم)"
              : "Are you sure you want to delete this journal entry?"
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
