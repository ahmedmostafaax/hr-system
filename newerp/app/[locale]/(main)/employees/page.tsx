"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
  StatusBadge,
  ListFilters,
  CredentialsModal,
  type FilterFieldConfig,
} from "@/components/shared";
import type { DataTableColumn, RowAction, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import type { CrudService } from "@/lib/services/createCrudService";
import { useListFilters } from "@/lib/hooks/useListFilters";
import { useLookupStore } from "@/lib/store";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";
import { employeeService, type Employee } from "./service";
import { employeeSchema, employeeCreateSchema } from "@/lib/validations/employee.schema";
import { getUserRoleOptions } from "@/lib/userRoles";
import { z } from "zod";

const EMPLOYEE_FILTER_INITIAL = {
  gender: "",
  marital_status: "",
  is_active: "",
  contract_department_id: "",
  department_id: "",
  age_min: "",
  age_max: "",
  salary_min: "",
  salary_max: "",
  has_contract: "",
  has_experience: "",
};

export default function EmployeesPage() {
  const t = useTranslations("employees");
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const user = getUser();

  const { filters, setFilter, resetFilters, apiParams } = useListFilters(EMPLOYEE_FILTER_INITIAL);
  const list = useListPage(employeeService as unknown as CrudService<Employee>, apiParams);
  const [accountResult, setAccountResult] = useState<{
    password: string;
    email: string;
    name: string;
    role?: string;
  } | null>(null);

  const lookupDepartments = useLookupStore((s) => s.departments);
  const lookupLoaded = useLookupStore((s) => s.loaded);
  const loadLookups = useLookupStore((s) => s.load);

  useEffect(() => {
    if (!lookupLoaded) loadLookups();
  }, [lookupLoaded, loadLookups]);

  const departmentOptions = useMemo(
    () => lookupDepartments.map((d) => ({ label: d.name, value: d.id })),
    [lookupDepartments]
  );

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [
      {
        key: "gender",
        label: isAr ? "الجنس" : "Gender",
        type: "select",
        options: [
          { label: isAr ? "ذكر" : "Male", value: "M" },
          { label: isAr ? "أنثى" : "Female", value: "F" },
        ],
      },
      {
        key: "marital_status",
        label: isAr ? "الحالة الاجتماعية" : "Marital Status",
        type: "select",
        options: [
          { label: isAr ? "أعزب" : "Single", value: "single" },
          { label: isAr ? "متزوج" : "Married", value: "married" },
          { label: isAr ? "مطلق" : "Divorced", value: "divorced" },
          { label: isAr ? "أرمل" : "Widowed", value: "widowed" },
        ],
      },
      {
        key: "is_active",
        label: isAr ? "الحالة" : "Status",
        type: "select",
        options: [
          { label: isAr ? "نشط" : "Active", value: "true" },
          { label: isAr ? "غير نشط" : "Inactive", value: "false" },
        ],
      },
      {
        key: "department_id",
        label: isAr ? "القسم" : "Department",
        type: "select",
        options: departmentOptions,
      },
      { key: "age_min", label: isAr ? "العمر من" : "Age from", type: "number", placeholder: "18" },
      { key: "age_max", label: isAr ? "العمر إلى" : "Age to", type: "number", placeholder: "60" },
      {
        key: "salary_min",
        label: isAr ? "المرتب من" : "Salary from",
        type: "number",
        placeholder: "3000",
      },
      {
        key: "salary_max",
        label: isAr ? "المرتب إلى" : "Salary to",
        type: "number",
        placeholder: "50000",
      },
      {
        key: "has_contract",
        label: isAr ? "عقد نشط" : "Active contract",
        type: "select",
        options: [
          { label: isAr ? "نعم" : "Yes", value: "true" },
          { label: isAr ? "لا" : "No", value: "false" },
        ],
      },
      {
        key: "has_experience",
        label: isAr ? "خبرات سابقة" : "Prior experience",
        type: "select",
        options: [
          { label: isAr ? "نعم" : "Yes", value: "true" },
        ],
      },
    ],
    [isAr, departmentOptions]
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilter(key as keyof typeof EMPLOYEE_FILTER_INITIAL, value);
    list.setPage(1);
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    if (list.selected) {
      await employeeService.update(list.selected.id, formData as Partial<Employee>);
    } else {
      const result = await employeeService.create(formData as Partial<Employee>);
      if (result.userAccount?.password) {
        setAccountResult({
          password: result.userAccount.password,
          email: result.userAccount.email,
          name: result.userAccount.name,
          role: (result.userAccount as { role?: string }).role ?? "EMPLOYEE",
        });
      }
    }
    await list.fetch();
  };

  const fields: FormFieldConfig[] = useMemo(
    () => [
      { name: "code", label: t("form.code"), type: "text", placeholder: t("form.code") },
      { name: "full_name", label: t("form.fullName"), type: "text", placeholder: t("form.fullName") },
      { name: "national_id", label: t("form.nationalId"), type: "text", placeholder: t("form.nationalId") },
      { name: "birth_date", label: t("form.birthDate"), type: "date" },
      {
        name: "gender",
        label: t("form.gender"),
        type: "select",
        options: [
          { label: isAr ? "ذكر" : "Male", value: "M" },
          { label: isAr ? "أنثى" : "Female", value: "F" },
        ],
      },
      { name: "phone_number", label: t("form.phone"), type: "text", placeholder: t("form.phone") },
      { name: "email", label: t("form.email"), type: "email", placeholder: t("form.email") },
      { name: "address", label: t("form.address"), type: "text", placeholder: t("form.address"), colSpan: 2 },
      {
        name: "marital_status",
        label: t("form.maritalStatus"),
        type: "select",
        options: [
          { label: isAr ? "أعزب" : "Single", value: "single" },
          { label: isAr ? "متزوج" : "Married", value: "married" },
          { label: isAr ? "مطلق" : "Divorced", value: "divorced" },
          { label: isAr ? "أرمل" : "Widowed", value: "widowed" },
        ],
      },
      { name: "qualification", label: t("form.qualification"), type: "text", placeholder: t("form.qualification") },
      { name: "bank_name", label: t("form.bankName"), type: "text", placeholder: t("form.bankName") },
      { name: "bank_account", label: t("form.bankAccount"), type: "text", placeholder: t("form.bankAccount") },
      ...(!list.selected
        ? [
            {
              name: "user_role",
              label: isAr ? "دور الدخول" : "Login Role",
              type: "select" as const,
              options: getUserRoleOptions(isAr),
              colSpan: 2,
            },
          ]
        : []),
    ],
    [t, isAr, list.selected]
  );

  const getDepartmentName = (row: Employee) => {
    const contract = row.contracts?.[0];
    const contractDept =
      contract?.Department?.name ?? contract?.department?.name;
    if (contractDept) return contractDept;
    return row.Department?.name ?? "—";
  };

  const getAge = (row: Employee) => {
    if (row.age != null && row.age > 0) return row.age;
    if (!row.birth_date) return "—";
    const birth = new Date(row.birth_date);
    if (Number.isNaN(birth.getTime())) return "—";
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
    return age;
  };

  const columns: DataTableColumn<Employee>[] = [
    {
      key: "code",
      label: t("table.code"),
      width: "100px",
      render: (row) => (
        <span className="font-mono text-xs font-bold text-indigo-600">{row.code}</span>
      ),
    },
    {
      key: "full_name",
      label: t("table.name"),
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{row.full_name}</span>
          {row.email && <span className="text-[11px] text-slate-400">{row.email}</span>}
        </div>
      ),
    },
    { key: "phone_number", label: t("table.phone") },
    {
      key: "national_id",
      label: t("table.nationalId"),
      render: (row) => <span className="text-xs text-slate-500">{row.national_id}</span>,
    },
    {
      key: "age",
      label: t("table.age"),
      width: "80px",
      render: (row) => (
        <span className="font-semibold text-slate-700">{getAge(row)}</span>
      ),
    },
    {
      key: "department",
      label: t("table.department"),
      render: (row) => (
        <span className="text-sm text-indigo-600 font-medium">{getDepartmentName(row)}</span>
      ),
    },
    {
      key: "is_active",
      label: t("table.status"),
      render: (row) => (
        <StatusBadge status={row.is_active && !row.is_deleted ? "active" : "inactive"} />
      ),
    },
  ];

  const actions: RowAction<Employee>[] = [];
  if (user && can(user.role, "manage:employees")) {
    actions.push(
      { type: "edit", onClick: list.openEdit },
      { type: "delete", onClick: (row) => list.setDeleteTarget(row) }
    );
  }
  actions.unshift({
    type: "view",
    onClick: (row) => router.push(`/${locale}/employees/${row.id}`),
  });

  const defaultValues = list.selected
    ? {
        code: list.selected.code,
        full_name: list.selected.full_name,
        national_id: list.selected.national_id,
        birth_date: list.selected.birth_date?.slice(0, 10) ?? "",
        gender: list.selected.gender,
        phone_number: list.selected.phone_number ?? "",
        email: list.selected.email ?? "",
        address: list.selected.address ?? "",
        marital_status: list.selected.marital_status ?? "single",
        qualification: list.selected.qualification ?? "",
        bank_name: list.selected.bank_name ?? "",
        bank_account: list.selected.bank_account ?? "",
      }
    : {
        code: "",
        full_name: "",
        national_id: "",
        birth_date: "",
        gender: "M",
        phone_number: "",
        email: "",
        address: "",
        marital_status: "single",
        qualification: "",
        bank_name: "",
        bank_account: "",
        user_role: "EMPLOYEE",
      };

  const formSchema = list.selected
    ? employeeSchema
    : employeeCreateSchema;

  return (
    <RoleGuard permission="read:employees">
      <div className="p-6">
        <PageHeader
          title={t("title")}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: t("title") },
          ]}
          action={
            user && can(user.role, "manage:employees")
              ? {
                  label: t("buttons.newEmployee"),
                  onClick: list.openCreate,
                  permission: "manage:employees" as Permission,
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
          exportFilename="employees"
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
          onRowClick={(row) => router.push(`/${locale}/employees/${row.id}`)}
          actions={actions}
          emptyMessage={t("messages.noData")}
          emptyAction={
            user && can(user.role, "manage:employees")
              ? { label: t("buttons.newEmployee"), onClick: list.openCreate }
              : undefined
          }
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={t("title")}
          schema={formSchema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={handleSave}
          createTitle={t("addNew")}
          editTitle={t("editEmployee")}
          createSuccessMessage={
            isAr ? "تم إنشاء الموظف وحساب الدخول" : "Employee and login created"
          }
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={t("messages.confirmDelete")}
          description={t("messages.deleteWarning")}
          confirmLabel={t("buttons.delete")}
          loading={list.deleting}
          onConfirm={list.confirmDelete}
          onCancel={() => list.setDeleteTarget(null)}
        />

        <CredentialsModal
          open={!!accountResult}
          onClose={() => setAccountResult(null)}
          data={accountResult ?? { name: "", email: "", password: "" }}
          isAr={isAr}
        />
      </div>
    </RoleGuard>
  );
}
