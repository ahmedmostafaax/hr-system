/**
 * Root GL account codes — override via .env if your chart of accounts differs.
 * Hierarchy (Chapter 1): Root → Department ({root}.{deptId}) → Employee ({root}.{deptId}.{employeeCode})
 */
export const ACCOUNT_CODES = {
  /** الصندوق / البنك */
  CASH_BANK: process.env.ACCOUNT_CASH_BANK ?? "1101",
  /** سلف موظفين (parent) */
  LOANS_ROOT: process.env.ACCOUNT_LOANS_ROOT ?? "1210",
  /** ذمم موظفين (parent) */
  PAYABLES_ROOT: process.env.ACCOUNT_PAYABLES_ROOT ?? "2100",
  /** مصروف رواتب */
  SALARY_EXPENSE: process.env.ACCOUNT_SALARY_EXPENSE ?? "51001",
  /** مصروف مكافآت */
  BONUS_EXPENSE: process.env.ACCOUNT_BONUS_EXPENSE ?? "52001",
  /** مصروف تأمينات اجتماعية */
  INSURANCE_EXPENSE: process.env.ACCOUNT_INSURANCE_EXPENSE ?? "53001",
  /** تأمينات اجتماعية مستحقة – حصة الشركة */
  INSURANCE_COMPANY_PAYABLE: process.env.ACCOUNT_INSURANCE_COMPANY_PAYABLE ?? "22001",
  /** تأمينات الموظف (خصم) — hierarchical sub-account under this root */
  INSURANCE_EMPLOYEE_ROOT: process.env.ACCOUNT_INSURANCE_EMPLOYEE_ROOT ?? "2200",
  /** إيرادات خصومات غياب */
  ABSENCE_REVENUE: process.env.ACCOUNT_ABSENCE_REVENUE ?? "41001",
} as const;

export type EmployeeAccountCategory = "loans" | "payables" | "insurance_employee";

export function rootCodeForCategory(category: EmployeeAccountCategory): string {
  switch (category) {
    case "loans":
      return ACCOUNT_CODES.LOANS_ROOT;
    case "payables":
      return ACCOUNT_CODES.PAYABLES_ROOT;
    case "insurance_employee":
      return ACCOUNT_CODES.INSURANCE_EMPLOYEE_ROOT;
  }
}
