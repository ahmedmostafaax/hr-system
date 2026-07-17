import { Permission } from "./permissions";

export interface MenuItemDef {
  key: string;
  path: string;
  transKey: string;
  permission?: Permission;
}

export interface MenuGroupDef {
  key: string;
  transKey: string;
  permission?: Permission;
  items: MenuItemDef[];
}

export const menuGroups: MenuGroupDef[] = [
  {
    key: "self",
    transKey: "groups.self",
    permission: "read:selfProfile",
    items: [
      { key: "myProfile", path: "/my/profile", transKey: "items.myProfile", permission: "read:selfProfile" },
      { key: "myLeave", path: "/my/leave-requests", transKey: "items.myLeave", permission: "create:ownLeave" },
      { key: "myLoans", path: "/my/loans", transKey: "items.myLoans", permission: "create:ownLoan" },
      { key: "myAttendance", path: "/my/attendance", transKey: "items.myAttendance", permission: "read:ownAttendance" },
    ],
  },
  {
    key: "home",
    transKey: "groups.home",
    items: [{ key: "dashboard", path: "", transKey: "items.dashboard", permission: "read:dashboard" }],
  },
  {
    key: "hr",
    transKey: "groups.hr",
    permission: "read:employees",
    items: [
      { key: "employees", path: "/employees", transKey: "items.employees", permission: "read:employees" },
      { key: "employeeDocument", path: "/employeeDocument", transKey: "items.employeeDocument", permission: "read:employees" },
      { key: "employeeRelative", path: "/employeeRelative", transKey: "items.employeeRelative", permission: "read:employees" },
      { key: "employeeExperience", path: "/employeeExperience", transKey: "items.employeeExperience", permission: "read:employees" },
      { key: "contracts", path: "/contracts", transKey: "items.contracts", permission: "read:employees" },
      { key: "contract_allowances", path: "/contract_allowances", transKey: "items.contract_allowances", permission: "read:employees" },
      { key: "contract_leaves", path: "/contract_leaves", transKey: "items.contract_leaves", permission: "read:employees" },
      { key: "attendance", path: "/attendance", transKey: "items.attendance", permission: "manage:attendance" },
      { key: "leave_requests", path: "/leave_requests", transKey: "items.leave_requests", permission: "manage:leaves" },
      { key: "absences", path: "/absences", transKey: "items.absences", permission: "manage:attendance" },
    ],
  },
  {
    key: "financial",
    transKey: "groups.financial",
    items: [
      { key: "custody", path: "/custody", transKey: "items.custody", permission: "read:employees" },
      { key: "employeeLoan", path: "/employeeLoan", transKey: "items.employeeLoan", permission: "read:employees" },
      { key: "employeeBonus", path: "/employeeBonus", transKey: "items.employeeBonus", permission: "read:employees" },
    ],
  },
  {
    key: "payroll",
    transKey: "groups.payroll",
    permission: "read:payroll",
    items: [{ key: "payroll", path: "/payroll", transKey: "items.payroll" }],
  },
  {
    key: "accounting",
    transKey: "groups.accounting",
    permission: "manage:journalEntries",
    items: [
      { key: "journalEntries", path: "/journalEntries", transKey: "items.journalEntries" },
      { key: "accountingPeriods", path: "/accountingPeriods", transKey: "items.accountingPeriods" },
      { key: "account", path: "/account", transKey: "items.account", permission: "read:settings" },
    ],
  },
  {
    key: "reports",
    transKey: "groups.reports",
    permission: "read:reports",
    items: [{ key: "reports", path: "/reports", transKey: "items.reports" }],
  },
  {
    key: "settings",
    transKey: "groups.settings",
    permission: "read:settings",
    items: [
      { key: "departments", path: "/departments", transKey: "items.departments" },
      { key: "shifts", path: "/shifts", transKey: "items.shift" },
      { key: "leaveTypes", path: "/leaveTypes", transKey: "items.leave_type" },
      { key: "officialHolidays", path: "/officialHolidays", transKey: "items.officialHolidays" },
      { key: "allowanceTypes", path: "/allowanceTypes", transKey: "items.allowance_types" },
      { key: "absence_types", path: "/absence_types", transKey: "items.absence_types" },
      { key: "bonus_types", path: "/bonus_types", transKey: "items.bonus_types" },
      { key: "insurance_settings", path: "/insurance_settings", transKey: "items.insurance_settings" },
    ],
  },
  {
    key: "admin",
    transKey: "groups.admin",
    permission: "manage:users",
    items: [
      { key: "users", path: "/users", transKey: "items.users", permission: "manage:users" },
      {
        key: "auditLog",
        path: "/auditLog",
        transKey: "items.auditLog",
        permission: "read:auditLog",
      },
    ],
  },
];
