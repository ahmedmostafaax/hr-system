"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { CalendarRange, Hash, Sparkles } from "lucide-react";
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
import { holidayService, type OfficialHoliday } from "./service";
import { officialHolidaySchema } from "@/lib/validations/officialHoliday.schema";
import { z } from "zod";

export default function OfficialHolidaysPage() {
  const t = useTranslations("holidays");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const list = useListPage(holidayService);
  const schema = useMemo(() => officialHolidaySchema(t), [t]);

  const fields: FormFieldConfig[] = [
    { name: "name", label: t("form.name"), type: "text", placeholder: t("form.namePlaceholder") },
    { name: "start_date", label: t("form.startDate"), type: "date" },
    {
      name: "days_count",
      label: t("form.daysCount"),
      type: "number",
      placeholder: t("form.daysPlaceholder"),
    },
  ];

  const columns: DataTableColumn<OfficialHoliday>[] = [
    {
      key: "name",
      label: t("table.name"),
      sortable: true,
      render: (row) => (
        <span className="flex items-center gap-2 font-semibold text-indigo-600">
          <Sparkles size={16} className="text-amber-500" />
          {row.name}
        </span>
      ),
    },
    {
      key: "start_date",
      label: t("table.startDate"),
      render: (row) => (
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <CalendarRange size={14} className="text-slate-400" />
          {new Date(row.start_date).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      ),
    },
    {
      key: "days_count",
      label: t("table.duration"),
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold">
          <Hash size={12} />
          {row.days_count} {isAr ? "أيام" : "Days"}
        </span>
      ),
    },
  ];

  const actions: RowAction<OfficialHoliday>[] = [];
  if (user && can(user.role, "manage:settings")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/officialHolidays/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        name: list.selected.name,
        start_date: list.selected.start_date,
        days_count: list.selected.days_count,
      }
    : { name: "", start_date: "", days_count: 1 };

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
                  label: t("buttons.newHoliday"),
                  onClick: list.openCreate,
                  permission: "manage:settings" as Permission,
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
          searchPlaceholder={t("buttons.search")}
          onRowClick={(row) => router.push(`/${locale}/officialHolidays/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData") || "لا توجد بيانات"}
          emptyAction={
            user && can(user.role, "manage:settings")
              ? { label: t("buttons.newHoliday"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={schema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={list.handleSave}
          createTitle={t("addNew")}
          editTitle={t("editHoliday")}
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
