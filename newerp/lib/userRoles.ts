import type { UserRole } from "./auth";

export const ALL_USER_ROLES: UserRole[] = [
  "EMPLOYEE",
  "HR",
  "ACCOUNTING",
  "ADMIN",
  "SUPER-ADMIN",
];

export const USER_ROLE_LABELS: Record<UserRole, { ar: string; en: string }> = {
  EMPLOYEE: { ar: "موظف", en: "Employee" },
  HR: { ar: "موارد بشرية", en: "HR" },
  ACCOUNTING: { ar: "محاسبة", en: "Accounting" },
  ADMIN: { ar: "مدير", en: "Admin" },
  "SUPER-ADMIN": { ar: "مدير النظام", en: "Super Admin" },
};

export function getUserRoleOptions(isAr = true) {
  return ALL_USER_ROLES.map((value) => ({
    value,
    label: isAr ? USER_ROLE_LABELS[value].ar : USER_ROLE_LABELS[value].en,
  }));
}
