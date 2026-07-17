"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { KeyRound, LayoutGrid, Loader2 } from "lucide-react";
import {
  RoleGuard,
  PageHeader,
  DataTable,
  FormModal,
  ConfirmDialog,
  StatusBadge,
  CredentialsModal,
  UserPortfolioModal,
} from "@/components/shared";
import type { DataTableColumn, RowAction, FormFieldConfig } from "@/components/shared";
import { useListPage } from "@/lib/hooks/useListPage";
import type { CrudService } from "@/lib/services/createCrudService";
import { useEmployeeOptions } from "@/lib/hooks/useEmployeeOptions";
import { notify } from "@/lib/toast";
import { userService, type User } from "./service";
import { userCreateSchema, userEditSchema } from "@/lib/validations/user.schema";
import { getUserRoleOptions, USER_ROLE_LABELS } from "@/lib/userRoles";
import { countAccessiblePages } from "@/lib/rolePortfolio";
import { z } from "zod";

const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(USER_ROLE_LABELS).map(([k, v]) => [k, v.ar])
);

const ROLE_LABELS_EN: Record<string, string> = Object.fromEntries(
  Object.entries(USER_ROLE_LABELS).map(([k, v]) => [k, v.en])
);

const ROLE_COLORS: Record<string, string> = {
  "SUPER-ADMIN": "bg-purple-100 text-purple-800 border-purple-200",
  ADMIN: "bg-indigo-100 text-indigo-800 border-indigo-200",
  HR: "bg-sky-100 text-sky-800 border-sky-200",
  ACCOUNTING: "bg-emerald-100 text-emerald-800 border-emerald-200",
  EMPLOYEE: "bg-amber-100 text-amber-800 border-amber-200",
};

export default function UsersPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isAr = locale === "ar";

  const list = useListPage(userService as unknown as CrudService<User>);
  const { options: employeeOptions } = useEmployeeOptions();
  const [resetLoading, setResetLoading] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [portfolioUser, setPortfolioUser] = useState<User | null>(null);
  const [credentialResult, setCredentialResult] = useState<{
    user: Pick<User, "id" | "name" | "role" | "email">;
    password: string;
  } | null>(null);

  const editRoleOptions = useMemo(
    () => getUserRoleOptions(isAr),
    [isAr]
  );

  const fields: FormFieldConfig[] = useMemo(() => {
    if (!list.selected) {
      return [
        {
          name: "employee_id",
          label: isAr ? "الموظف" : "Employee",
          type: "select",
          options: employeeOptions,
          colSpan: 2,
        },
        {
          name: "role",
          label: isAr ? "الدور" : "Role",
          type: "select",
          options: getUserRoleOptions(isAr),
        },
      ];
    }

    return [
      {
        name: "name",
        label: isAr ? "الاسم" : "Name",
        type: "text",
        colSpan: 2,
      },
      { name: "email", label: isAr ? "البريد" : "Email", type: "email" },
      { name: "phoneNumber", label: isAr ? "الهاتف" : "Phone", type: "text" },
      {
        name: "role",
        label: isAr ? "الدور" : "Role",
        type: "select",
        options: editRoleOptions,
        disabled: list.selected?.role === "SUPER-ADMIN",
      },
      {
        name: "isActive",
        label: isAr ? "نشط" : "Active",
        type: "checkbox",
      },
    ];
  }, [isAr, employeeOptions, editRoleOptions, list.selected]);

  const columns: DataTableColumn<User>[] = [
    {
      key: "employee_code",
      label: isAr ? "كود الموظف" : "Employee Code",
      render: (row) => (
        <span className="font-mono text-xs font-bold text-indigo-600">
          {row.employee?.code ?? (isAr ? "— (بدون موظف)" : "— (no employee)")}
        </span>
      ),
    },
    {
      key: "name",
      label: isAr ? "الاسم" : "Name",
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.name}</span>
      ),
    },
    { key: "email", label: isAr ? "البريد" : "Email" },
    { key: "phoneNumber", label: isAr ? "الهاتف" : "Phone" },
    {
      key: "role",
      label: isAr ? "الدور" : "Role",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLORS[row.role] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
        >
          {ROLE_LABELS[row.role] ?? ROLE_LABELS_EN[row.role] ?? row.role}
        </span>
      ),
    },
    {
      key: "isActive",
      label: isAr ? "الحالة" : "Status",
      render: (row) => (
        <StatusBadge status={row.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key: "portfolio",
      label: isAr ? "الصلاحيات" : "Portfolio",
      width: "120px",
      render: (row) => {
        const count = countAccessiblePages(row.role);
        return (
          <button
            type="button"
            title={isAr ? "عرض الصفحات المتاحة" : "View accessible pages"}
            onClick={(e) => {
              e.stopPropagation();
              setPortfolioUser(row);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-800 transition hover:bg-indigo-100"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {isAr ? `Portfolio (${count})` : `Portfolio (${count})`}
          </button>
        );
      },
    },
    {
      key: "reset",
      label: isAr ? "كلمة المرور" : "Password",
      width: "140px",
      render: (row) => {
        const busy = resetLoading === row.id;
        if (row.role === "SUPER-ADMIN") return "—";

        return (
          <button
            type="button"
            title={isAr ? "توليد كلمة مرور جديدة" : "Generate new password"}
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              setResetTarget(row);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )}
            {isAr ? "توليد كلمة مرور" : "Gen. password"}
          </button>
        );
      },
    },
  ];

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetLoading(resetTarget.id);
    try {
      const result = await userService.resetPassword(resetTarget.id);
      setCredentialResult(result);
      setResetTarget(null);
      notify.success(
        isAr ? "تم توليد كلمة مرور جديدة" : "New password generated"
      );
      await list.fetch();
    } catch (err) {
      notify.handleApiError(err as { message?: string });
    } finally {
      setResetLoading(null);
    }
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    if (list.selected) {
      await userService.update(list.selected.id, formData as Partial<User>);
    } else {
      const result = await userService.create(formData as Partial<User> & { employee_id: number });
      setCredentialResult({
        user: {
          id: result.user.id,
          name: result.user.name,
          role: result.user.role,
          email: result.user.email,
        },
        password: result.password,
      });
    }
    await list.fetch();
  };

  const actions: RowAction<User>[] = [
    { type: "edit", onClick: list.openEdit },
    {
      type: "delete",
      onClick: (row) => list.setDeleteTarget(row),
      hidden: (row) => row.role === "SUPER-ADMIN",
    },
  ];

  const defaultValues = list.selected
    ? {
        name: list.selected.name,
        email: list.selected.email,
        phoneNumber: list.selected.phoneNumber,
        role: list.selected.role,
        isActive: list.selected.isActive,
      }
    : {
        employee_id: "",
        role: "EMPLOYEE",
      };

  const schema = list.selected ? userEditSchema : userCreateSchema;

  return (
    <RoleGuard permission="manage:users">
      <div className="p-6">
        <PageHeader
          title={isAr ? "المستخدمون" : "Users"}
          breadcrumbs={[
            { label: isAr ? "الرئيسية" : "Home", href: `/${locale}` },
            { label: isAr ? "المستخدمون" : "Users" },
          ]}
          action={{
            label: isAr ? "مستخدم جديد" : "New User",
            onClick: list.openCreate,
            permission: "manage:users",
          }}
        />

        <p className="mb-4 text-sm text-slate-500">
          {isAr
            ? "جميع حسابات النظام (موظف، HR، محاسبة، مدير، super admin). اضغط Portfolio لمعرفة الصفحات المتاحة لكل دور."
            : "All system accounts. Click Portfolio to see which pages each role can access."}
        </p>

        <DataTable
          columns={columns}
          exportFetcher={list.fetchAllData}
          exportFilename="users"
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
              ? "بحث بالكود أو الاسم أو الهاتف..."
              : "Search by code, name, or phone..."
          }
          actions={actions}
          emptyMessage={isAr ? "لا يوجد مستخدمون" : "No users found"}
          emptyAction={{
            label: isAr ? "مستخدم جديد" : "New User",
            onClick: list.openCreate,
          }}
        />

        <FormModal
          isOpen={list.modalOpen}
          onClose={list.closeModal}
          mode={list.selected ? "edit" : "create"}
          entityName={isAr ? "حساب موظف" : "Employee Account"}
          schema={schema as z.ZodTypeAny}
          defaultValues={defaultValues}
          fields={fields}
          onSubmit={handleSave}
          createTitle={isAr ? "إضافة حساب موظف" : "Add Employee Account"}
          editTitle={isAr ? "تعديل حساب موظف" : "Edit Employee Account"}
          createSuccessMessage={
            isAr ? "تم إنشاء حساب الموظف" : "Employee account created"
          }
          editSuccessMessage={isAr ? "تم التحديث" : "Updated"}
        />

        <ConfirmDialog
          open={!!resetTarget}
          title={isAr ? "توليد كلمة مرور جديدة" : "Generate new password"}
          description={
            isAr
              ? `سيتم إنشاء كلمة مرور جديدة للموظف "${resetTarget?.name}". يجب عليه تغييرها عند أول تسجيل دخول.`
              : `A new password will be generated for "${resetTarget?.name}". They must change it on first login.`
          }
          confirmLabel={isAr ? "توليد" : "Generate"}
          loading={resetLoading !== null}
          onConfirm={handleResetPassword}
          onCancel={() => setResetTarget(null)}
        />

        <ConfirmDialog
          open={!!list.deleteTarget}
          title={isAr ? "تأكيد الحذف" : "Confirm Delete"}
          description={
            isAr
              ? "هل أنت متأكد من حذف هذا الحساب؟"
              : "Are you sure you want to delete this account?"
          }
          confirmLabel={isAr ? "حذف" : "Delete"}
          loading={list.deleting}
          onConfirm={list.confirmDelete}
          onCancel={() => list.setDeleteTarget(null)}
        />

        <UserPortfolioModal
          open={!!portfolioUser}
          onClose={() => setPortfolioUser(null)}
          userName={portfolioUser?.name ?? ""}
          role={portfolioUser?.role ?? "EMPLOYEE"}
          isAr={isAr}
        />

        <CredentialsModal
          open={!!credentialResult}
          onClose={() => setCredentialResult(null)}
          data={
            credentialResult
              ? {
                  name: credentialResult.user.name,
                  email: credentialResult.user.email,
                  password: credentialResult.password,
                  role: credentialResult.user.role,
                }
              : { name: "", email: "", password: "" }
          }
          isAr={isAr}
          title={isAr ? "بيانات الدخول" : "Login Credentials"}
          subtitle={
            isAr
              ? "احفظ كلمة المرور — لن تُعرض مرة أخرى."
              : "Save the password — it won't be shown again."
          }
        />
      </div>
    </RoleGuard>
  );
}
