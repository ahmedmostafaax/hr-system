"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { X } from "lucide-react";
import { RoleGuard, PageHeader, DataTable } from "@/components/shared";
import type { DataTableColumn, RowAction } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { auditLogService, type AuditLog } from "./service";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  labelAction,
  labelEntityType,
  toReadableAuditEntries,
} from "@/lib/utils/auditValues";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800 border-green-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
  APPROVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
  REJECT: "bg-orange-100 text-orange-800 border-orange-200",
  LOGIN: "bg-slate-100 text-slate-700 border-slate-200",
  LOGOUT: "bg-slate-100 text-slate-600 border-slate-200",
};

const ENTITY_TYPES = [
  "Employee",
  "User",
  "Contract",
  "PayrollRun",
  "JournalEntry",
  "AccountingPeriod",
  "LeaveRequest",
  "Attendance",
  "Department",
];

function AuditValuesPanel({
  title,
  values,
  isAr,
  variant,
}: {
  title: string;
  values: Record<string, unknown> | null | undefined;
  isAr: boolean;
  variant: "old" | "new";
}) {
  const entries = toReadableAuditEntries(values, isAr);
  const boxClass =
    variant === "old"
      ? "bg-slate-50 border-slate-200"
      : "bg-emerald-50 border-emerald-200";

  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase mb-2">{title}</p>
      <div className={`rounded-lg border p-4 min-h-[200px] ${boxClass}`}>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">{isAr ? "لا توجد بيانات" : "No data"}</p>
        ) : (
          <dl className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.key}
                className="border-b border-white/60 pb-3 last:border-0 last:pb-0"
              >
                <dt className="text-xs font-semibold text-slate-500 mb-1">
                  {entry.label}
                </dt>
                <dd className="text-sm font-medium text-slate-800 leading-relaxed">
                  {entry.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

function ActionBadge({ action, isAr }: { action: string; isAr: boolean }) {
  const style =
    ACTION_COLORS[action] ??
    "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      {labelAction(action, isAr)}
    </span>
  );
}

export default function AuditLogPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isAr = locale === "ar";

  const [entityType, setEntityType] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userId, setUserId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewRow, setViewRow] = useState<AuditLog | null>(null);

  const extraParams = useMemo(() => {
    const p: Record<string, unknown> = {};
    if (entityType) p.entity_type = entityType;
    if (actionFilter) p.action = actionFilter;
    if (userId) p.user_id = Number(userId);
    if (fromDate) p.from_date = fromDate;
    if (toDate) p.to_date = toDate;
    return p;
  }, [entityType, actionFilter, userId, fromDate, toDate]);

  const list = useListPage(auditLogService, extraParams);

  const entityTypeOptions = useMemo(
    () =>
      ENTITY_TYPES.map((t) => ({
        label: labelEntityType(t, isAr),
        value: t,
      })),
    [isAr]
  );

  const actionOptions = useMemo(
    () =>
      ["CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "LOGIN", "LOGOUT"].map(
        (a) => ({
          label: labelAction(a, isAr),
          value: a,
        })
      ),
    [isAr]
  );

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: "user_name",
      label: isAr ? "المستخدم" : "User",
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {row.user_name ?? "—"}
        </span>
      ),
    },
    {
      key: "user_role",
      label: isAr ? "الدور" : "Role",
      render: (row) => row.user_role ?? "—",
    },
    {
      key: "action",
      label: isAr ? "الإجراء" : "Action",
      render: (row) => <ActionBadge action={row.action} isAr={isAr} />,
    },
    {
      key: "entity_type",
      label: isAr ? "نوع الكيان" : "Entity Type",
      render: (row) => (
        <span className="font-medium text-indigo-600">
          {labelEntityType(row.entity_type, isAr)}
        </span>
      ),
    },
    {
      key: "entity_id",
      label: isAr ? "معرف الكيان" : "Entity ID",
      render: (row) => (row.entity_id != null ? `#${row.entity_id}` : "—"),
    },
    {
      key: "created_at",
      label: isAr ? "التاريخ" : "Date",
      render: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleString(isAr ? "ar-EG" : "en-US")
          : "—",
    },
  ];

  const actions: RowAction<AuditLog>[] = [
    {
      type: "view",
      onClick: (row) => setViewRow(row),
    },
  ];

  return (
    <RoleGuard permission="read:auditLog">
      <div className="p-6">
        <PageHeader
          title={isAr ? "سجل التدقيق" : "Audit Log"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "سجل التدقيق" : "Audit Log" },
          ]}
        />

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="min-w-[160px] flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              {isAr ? "نوع الكيان" : "Entity Type"}
            </label>
            <SearchableSelect
              options={entityTypeOptions}
              value={entityType}
              onChange={(val) => setEntityType(String(val))}
              allowClear
              clearLabel={isAr ? "الكل" : "All"}
              searchPlaceholder={isAr ? "بحث..." : "Search..."}
              placeholder={isAr ? "نوع الكيان" : "Entity Type"}
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              {isAr ? "الإجراء" : "Action"}
            </label>
            <SearchableSelect
              options={actionOptions}
              value={actionFilter}
              onChange={(val) => setActionFilter(String(val))}
              allowClear
              clearLabel={isAr ? "الكل" : "All"}
              searchPlaceholder={isAr ? "بحث..." : "Search..."}
              placeholder={isAr ? "الإجراء" : "Action"}
            />
          </div>
          <div className="min-w-[120px]">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              {isAr ? "معرف المستخدم" : "User ID"}
            </label>
            <input
              type="number"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={isAr ? "الكل" : "All"}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              {isAr ? "من تاريخ" : "From Date"}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              {isAr ? "إلى تاريخ" : "To Date"}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="audit-log"
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
            isAr ? "بحث في السجل..." : "Search audit log..."
          }
          onRowClick={(row) => setViewRow(row)}
          actions={actions}
          emptyMessage={
            isAr ? "لا توجد سجلات تدقيق" : "No audit log entries found"
          }
        />

        {viewRow && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setViewRow(null)}
          >
            <div
              className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
              dir={isAr ? "rtl" : "ltr"}
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {isAr ? "تفاصيل السجل" : "Log Details"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {labelAction(viewRow.action, isAr)} ·{" "}
                    {labelEntityType(viewRow.entity_type, isAr)}
                    {viewRow.entity_id != null ? ` #${viewRow.entity_id}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewRow(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-y-auto">
                <AuditValuesPanel
                  title={isAr ? "القيم القديمة" : "Old Values"}
                  values={viewRow.old_values}
                  isAr={isAr}
                  variant="old"
                />
                <AuditValuesPanel
                  title={isAr ? "القيم الجديدة" : "New Values"}
                  values={viewRow.new_values}
                  isAr={isAr}
                  variant="new"
                />
              </div>

              <div className="border-t border-slate-100 px-6 py-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewRow(null)}
                  className="w-full rounded-lg bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {isAr ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
