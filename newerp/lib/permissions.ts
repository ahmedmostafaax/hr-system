import { UserRole } from "./auth";

export type Permission =
  | "manage:users"
  | "read:users"
  | "read:dashboard"
  | "manage:employees"
  | "read:employees"
  | "manage:settings"
  | "read:settings"
  | "manage:attendance"
  | "manage:leaves"
  | "manage:loans"
  | "approve:loans"
  | "manage:bonuses"
  | "approve:bonuses"
  | "manage:payroll"
  | "read:payroll"
  | "read:payrollDetails"
  | "manage:journalEntries"
  | "manage:accountingPeriods"
  | "read:reports"
  | "read:auditLog"
  | "manage:accounts"
  | "read:selfProfile"
  | "create:ownLeave"
  | "create:ownLoan"
  | "read:ownAttendance";

const PERMISSIONS: Record<Permission, UserRole[]> = {
  "manage:users": ["SUPER-ADMIN", "ADMIN"],
  "read:users": ["SUPER-ADMIN", "ADMIN"],
  "read:dashboard": ["SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"],
  "manage:employees": ["SUPER-ADMIN", "ADMIN", "HR"],
  "read:employees": ["SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"],
  "manage:settings": ["SUPER-ADMIN", "ADMIN", "HR"],
  "read:settings": ["SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"],
  "manage:attendance": ["SUPER-ADMIN", "ADMIN", "HR"],
  "manage:leaves": ["SUPER-ADMIN", "ADMIN", "HR"],
  "manage:loans": ["SUPER-ADMIN", "ADMIN", "HR"],
  "approve:loans": ["SUPER-ADMIN", "ADMIN", "ACCOUNTING"],
  "manage:bonuses": ["SUPER-ADMIN", "ADMIN", "HR"],
  "approve:bonuses": ["SUPER-ADMIN", "ADMIN", "ACCOUNTING"],
  "manage:payroll": ["SUPER-ADMIN", "ADMIN", "ACCOUNTING"],
  "read:payroll": ["SUPER-ADMIN", "ADMIN", "HR", "ACCOUNTING"],
  "read:payrollDetails": ["SUPER-ADMIN", "ADMIN", "ACCOUNTING"],
  "manage:journalEntries": ["SUPER-ADMIN", "ADMIN", "ACCOUNTING"],
  "manage:accountingPeriods": ["SUPER-ADMIN", "ADMIN", "ACCOUNTING"],
  "read:reports": ["SUPER-ADMIN", "ADMIN", "ACCOUNTING"],
  "read:auditLog": ["SUPER-ADMIN", "ADMIN"],
  "manage:accounts": ["SUPER-ADMIN", "ADMIN", "HR"],
  "read:selfProfile": ["EMPLOYEE"],
  "create:ownLeave": ["EMPLOYEE"],
  "create:ownLoan": ["EMPLOYEE"],
  "read:ownAttendance": ["EMPLOYEE"],
};

const EMPLOYEE_ONLY_PERMISSIONS: Permission[] = [
  "read:selfProfile",
  "create:ownLeave",
  "create:ownLoan",
  "read:ownAttendance",
];

export const can = (role: UserRole, permission: Permission): boolean => {
  if (role === "SUPER-ADMIN") {
    if (EMPLOYEE_ONLY_PERMISSIONS.includes(permission)) return false;
    return true;
  }
  return PERMISSIONS[permission]?.includes(role) ?? false;
};
