"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ApprovalBadge,
  PeriodFilter,
} from "@/components/shared";
import type { DataTableColumn, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import { usePeriodFilter } from "@/lib/hooks/usePeriodFilter";
import { getUser } from "@/lib/auth";
import { employeeLoanService, type EmployeeLoan } from "@/lib/services";
import { employeeLoanSelfCreateSchema } from "@/lib/validations/employeeLoan.schema";
import { z } from "zod";

export default function MyLoansPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();
  const employeeId = user?.employee_id;

  const period = usePeriodFilter();
  const listParams = useMemo(
    () => ({
      ...(employeeId ? { employee_id: employeeId } : {}),
      ...period.apiParams,
    }),
    [employeeId, period.apiParams]
  );

  const list = useListPage(employeeLoanService, listParams);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const fields: FormFieldConfig[] = useMemo(
    () => [
      {
        name: "type",
        label: isAr ? "نوع المعاملة" : "Type",
        type: "select",
        options: [
          { label: isAr ? "سلفة" : "Advance", value: "advance" },
          { label: isAr ? "قرض" : "Loan", value: "loan" },
        ],
        colSpan: 2,
      },
      {
        name: "amount",
        label: isAr ? "المبلغ المطلوب" : "Requested Amount",
        type: "number",
      },
      {
        name: "installment_amount",
        label: isAr ? "مبلغ القسط الشهري" : "Monthly Installment",
        type: "number",
      },
      {
        name: "grant_date",
        label: isAr ? "تاريخ الطلب" : "Request Date",
        type: "date",
      },
    ],
    [isAr]
  );

  const columns: DataTableColumn<EmployeeLoan>[] = [
    {
      key: "type",
      label: isAr ? "النوع" : "Type",
      render: (row) =>
        row.type === "advance" ? (isAr ? "سلفة" : "Advance") : (isAr ? "قرض" : "Loan"),
    },
    {
      key: "amount",
      label: isAr ? "المبلغ" : "Amount",
      render: (row) =>
        `${Number(row.amount).toLocaleString(isAr ? "ar-EG" : "en-US")} ${isAr ? "ج.م" : "EGP"}`,
    },
    {
      key: "installment_amount",
      label: isAr ? "القسط" : "Installment",
      render: (row) =>
        row.installment_amount != null
          ? `${Number(row.installment_amount).toLocaleString(isAr ? "ar-EG" : "en-US")} ${isAr ? "ج.م" : "EGP"}`
          : "—",
    },
    {
      key: "grant_date",
      label: isAr ? "التاريخ" : "Date",
      render: (row) => String(row.grant_date).slice(0, 10),
    },
    {
      key: "approval_status",
      label: isAr ? "حالة الموافقة" : "Approval",
      render: (row) => <ApprovalBadge status={row.approval_status} />,
    },
  ];

  const handleSave = async (formData: Record<string, unknown>) => {
    if (!employeeId) {
      throw {
        message: isAr ? "لا يوجد ملف موظف مرتبط بحسابك" : "No employee profile linked to your account",
      };
    }
    await employeeLoanService.create({
      type: formData.type,
      amount: formData.amount,
      installment_amount: formData.installment_amount,
      grant_date: formData.grant_date,
    } as Partial<EmployeeLoan>);
    await list.fetch();
    list.closeModal();
  };

  const defaultValues = useMemo(
    () => ({
      type: "advance",
      installment_amount: 0,
      grant_date: today,
    }),
    [today]
  );

  return (
    <RoleGuard permission="create:ownLoan">
      <div className="p-6">
        <PageHeader
          title={isAr ? "سلفي وقروضي" : "My Loans & Advances"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}/my/profile` },
            { label: isAr ? "السلف والقروض" : "Loans & Advances" },
          ]}
          action={{
            label: isAr ? "طلب سلفة / قرض" : "Request Loan / Advance",
            onClick: list.openCreate,
            permission: "create:ownLoan",
          }}
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

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="my-loans"
          data={list.data}
          loading={list.loading}
          pagination={{
            page: list.page,
            limit: list.limit,
            total: list.total,
            onPageChange: list.setPage,
          }}
          emptyMessage={isAr ? "لا توجد طلبات سلف أو قروض" : "No loan or advance requests"}
          emptyAction={{
            label: isAr ? "طلب سلفة / قرض" : "Request Loan / Advance",
            onClick: list.openCreate,
          }}
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode="create"
          entityName={isAr ? "سلفة / قرض" : "Loan / Advance"}
          schema={employeeLoanSelfCreateSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={handleSave}
          createTitle={isAr ? "تقديم طلب سلفة أو قرض" : "Submit Loan / Advance Request"}
        />
      </div>
    </RoleGuard>
  );
}
