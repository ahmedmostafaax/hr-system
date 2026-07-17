"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
} from "@/components/shared";
import type { DataTableColumn, RowAction } from "@/components/shared";
import type { FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { shiftService, type Shift } from "./service";
import type { WorkDay } from "@/lib/services/entities";
import { shiftSchema } from "@/lib/validations/shift.schema";
import { normalizeWorkDays } from "@/lib/utils/workDays";
import { z } from "zod";

export default function ShiftsPage() {
  const t = useTranslations("shifts");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(shiftService);

  const fields: FormFieldConfig[] = [
    { name: "name", label: t("form.name"), type: "text", placeholder: t("form.namePlaceholder") },
    {
      name: "type",
      label: t("form.type"),
      type: "select",
      options: [
        { label: isAr ? "صباحي" : "Morning", value: "morning" },
        { label: isAr ? "مسائي" : "Evening", value: "evening" },
        { label: isAr ? "فترة وسطى" : "Between", value: "between" },
      ],
    },
    {
      name: "work_days",
      label: t("form.workDays"),
      type: "text",
      placeholder: "sun,mon,tue",
    },
    { name: "start_time", label: t("form.startTime"), type: "time" },
    { name: "end_time", label: t("form.endTime"), type: "time" },
    { name: "grace_minutes", label: t("form.graceMinutes"), type: "number" },
    { name: "deduct_grace", label: t("form.deductGrace"), type: "checkbox" },
    { name: "salary_basis_days", label: t("form.salaryBasis"), type: "number" },
  ];

  const columns: DataTableColumn<Shift>[] = [
    {
      key: "name",
      label: t("table.name"),
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2 font-semibold text-indigo-600">
          <Clock size={16} className="text-indigo-500" />
          {row.name}
        </span>
      ),
    },
    { key: "type", label: t("table.type") },
    {
      key: "work_days",
      label: t("table.workDays"),
      render: (row) => {
        const days = normalizeWorkDays(row.work_days);
        return (
        <div className="flex flex-wrap gap-1">
          {days.length === 0 ? (
            <span className="text-slate-400">—</span>
          ) : (
            days.map((day) => (
            <span
              key={day}
              className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase font-medium"
            >
              {day}
            </span>
            ))
          )}
        </div>
        );
      },
    },
    {
      key: "time",
      label: t("table.timeRange"),
      render: (row) => (
        <span className="text-xs font-mono bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100">
          {row.start_time} - {row.end_time}
        </span>
      ),
    },
    {
      key: "grace_minutes",
      label: t("table.grace"),
      render: (row) => `${row.grace_minutes} ${isAr ? "دقيقة" : "min"}`,
    },
  ];

  const actions: RowAction<Shift>[] = [];
  if (user && can(user.role, "manage:settings")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/shifts/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        name: list.selected.name,
        type: list.selected.type,
        work_days: normalizeWorkDays(list.selected.work_days).join(","),
        start_time: list.selected.start_time?.slice(0, 5) ?? "09:00",
        end_time: list.selected.end_time?.slice(0, 5) ?? "17:00",
        grace_minutes: list.selected.grace_minutes,
        deduct_grace: list.selected.deduct_grace,
        salary_basis_days: list.selected.salary_basis_days,
      }
    : {
        name: "",
        type: "morning",
        work_days: "",
        start_time: "09:00",
        end_time: "17:00",
        grace_minutes: 15,
        deduct_grace: true,
        salary_basis_days: 22,
      };

  const handleSave = async (formData: Record<string, unknown>) => {
    const workDaysRaw = String(formData.work_days ?? "");
    const work_days = workDaysRaw
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean) as WorkDay[];

    const payload: Partial<Shift> = {
      ...formData,
      work_days,
      start_time: String(formData.start_time).slice(0, 5),
      end_time: String(formData.end_time).slice(0, 5),
      grace_minutes: Number(formData.grace_minutes),
      salary_basis_days: Number(formData.salary_basis_days),
    };

    if (list.selected) {
      await shiftService.update(list.selected.id, payload);
    } else {
      await shiftService.create(payload);
    }
    await list.fetch();
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
            user && can(user.role, "manage:settings")
              ? {
                  label: t("buttons.newShift"),
                  onClick: list.openCreate,
                  permission: "manage:settings" as Permission,
                }
              : undefined
          }
        />

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="shifts"
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
          onRowClick={(row) => router.push(`/${locale}/shifts/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:settings")
              ? { label: t("buttons.newShift"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={shiftSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={handleSave}
          createTitle={t("addNew")}
          editTitle={t("editShift")}
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
