import { Transaction } from "sequelize";
import Account from "../../../database/Models/Account";
import Employee from "../../../database/Models/employee";
import EmployeeContract from "../../../database/Models/contracts";
import Department from "../../../database/Models/department.model";
import {
  ACCOUNT_CODES,
  EmployeeAccountCategory,
  rootCodeForCategory,
} from "./accountCodes";

type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
type BalanceType = "debit" | "credit";

interface AccountSeed {
  code: string;
  name: string;
  type: AccountType;
  balance_type: BalanceType;
  is_posting?: boolean;
  level?: number;
}

const SYSTEM_ACCOUNTS: AccountSeed[] = [
  {
    code: ACCOUNT_CODES.CASH_BANK,
    name: "الصندوق / البنك",
    type: "asset",
    balance_type: "debit",
  },
  {
    code: ACCOUNT_CODES.LOANS_ROOT,
    name: "سلف الموظفين",
    type: "asset",
    balance_type: "debit",
    is_posting: false,
  },
  {
    code: ACCOUNT_CODES.PAYABLES_ROOT,
    name: "ذمم الموظفين",
    type: "liability",
    balance_type: "credit",
    is_posting: false,
  },
  {
    code: ACCOUNT_CODES.INSURANCE_EMPLOYEE_ROOT,
    name: "تأمينات الموظفين",
    type: "liability",
    balance_type: "credit",
    is_posting: false,
  },
  {
    code: ACCOUNT_CODES.SALARY_EXPENSE,
    name: "مصروف رواتب",
    type: "expense",
    balance_type: "debit",
  },
  {
    code: ACCOUNT_CODES.BONUS_EXPENSE,
    name: "مصروف مكافآت",
    type: "expense",
    balance_type: "debit",
  },
  {
    code: ACCOUNT_CODES.INSURANCE_EXPENSE,
    name: "مصروف تأمينات اجتماعية",
    type: "expense",
    balance_type: "debit",
  },
  {
    code: ACCOUNT_CODES.INSURANCE_COMPANY_PAYABLE,
    name: "تأمينات مستحقة - حصة الشركة",
    type: "liability",
    balance_type: "credit",
  },
  {
    code: ACCOUNT_CODES.ABSENCE_REVENUE,
    name: "إيراد خصومات الغياب",
    type: "revenue",
    balance_type: "credit",
  },
];

function sanitizeCodePart(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

async function upsertAccount(
  seed: AccountSeed & { parent_id?: number | null },
  transaction?: Transaction
): Promise<Account> {
  const existing = await Account.findOne({
    where: { code: seed.code },
    transaction,
  });

  if (existing) {
    if (existing.is_deleted || !existing.is_posting) {
      await existing.update(
        {
          is_deleted: false,
          is_posting: seed.is_posting ?? true,
          name: seed.name,
          type: seed.type,
          balance_type: seed.balance_type,
          parent_id: seed.parent_id ?? existing.parent_id,
          level: seed.level ?? existing.level,
        },
        { transaction }
      );
    }
    return existing;
  }

  return Account.create(
    {
      code: seed.code,
      name: seed.name,
      type: seed.type,
      balance_type: seed.balance_type,
      parent_id: seed.parent_id ?? null,
      level: seed.level ?? 1,
      is_posting: seed.is_posting ?? true,
      currency: "EGP",
      is_deleted: false,
    },
    { transaction }
  );
}

export async function ensureSystemGlAccounts(transaction?: Transaction) {
  for (const seed of SYSTEM_ACCOUNTS) {
    await upsertAccount(seed, transaction);
  }
}

async function ensureEmployeeCategoryAccounts(
  category: EmployeeAccountCategory,
  employee: { id: number; code: string; full_name: string; department_id?: number | null },
  departmentId: number,
  transaction?: Transaction
) {
  const rootCode = rootCodeForCategory(category);
  const root = await Account.findOne({
    where: { code: rootCode, is_deleted: false },
    transaction,
  });
  if (!root) return;

  const departmentCode = `${rootCode}.${departmentId}`;
  const departmentAccount = await upsertAccount(
    {
      code: departmentCode,
      name: `قسم ${departmentId} - ${root.name}`,
      type: root.type as AccountType,
      balance_type: root.balance_type as BalanceType,
      is_posting: false,
      level: 2,
      parent_id: root.id,
    },
    transaction
  );

  const employeePart = sanitizeCodePart(employee.code);
  const employeeCode = `${rootCode}.${departmentId}.${employeePart}`;

  await upsertAccount(
    {
      code: employeeCode,
      name: `${employee.full_name} (${employee.code})`,
      type: root.type as AccountType,
      balance_type: root.balance_type as BalanceType,
      is_posting: true,
      level: 3,
      parent_id: departmentAccount.id,
    },
    transaction
  );
}

export async function ensureEmployeeGlAccounts(
  employeeId: number,
  transaction?: Transaction
) {
  const employee: any = await Employee.findOne({
    where: { id: employeeId, is_deleted: false },
    transaction,
  });
  if (!employee) return;

  const contract = await EmployeeContract.findOne({
    where: { employee_id: employeeId, status: "active", is_deleted: false },
    transaction,
  });

  const departmentId = contract?.department_id ?? employee.department_id;
  if (!departmentId) return;

  const categories: EmployeeAccountCategory[] = [
    "loans",
    "payables",
    "insurance_employee",
  ];

  for (const category of categories) {
    await ensureEmployeeCategoryAccounts(
      category,
      employee,
      departmentId,
      transaction
    );
  }
}

export async function ensureAllEmployeeGlAccounts(transaction?: Transaction) {
  const employees: any[] = await Employee.findAll({
    where: { is_deleted: false, is_active: true },
    include: [{ model: Department, attributes: ["id", "name"] }],
    transaction,
  });

  for (const employee of employees) {
    await ensureEmployeeGlAccounts(employee.id, transaction);
  }
}

/** Ensures system + employee GL accounts required for payroll JEs. */
export async function ensureDefaultChartOfAccounts(transaction?: Transaction) {
  await ensureSystemGlAccounts(transaction);
  await ensureAllEmployeeGlAccounts(transaction);
}
