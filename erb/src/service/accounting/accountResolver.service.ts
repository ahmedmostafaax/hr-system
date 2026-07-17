import { Op, Transaction } from "sequelize";
import Account from "../../../database/Models/Account";
import Employee from "../../../database/Models/employee";
import EmployeeContract from "../../../database/Models/contracts";
import Department from "../../../database/Models/department.model";
import { AppError } from "../../utils/appError";
import {
  ACCOUNT_CODES,
  EmployeeAccountCategory,
  rootCodeForCategory,
} from "./accountCodes";

class AccountResolverService {
  private sanitizeCodePart(value: string): string {
    return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  async getSystemAccount(
    code: string,
    transaction?: Transaction
  ): Promise<Account> {
    const account = await Account.findOne({
      where: { code, is_deleted: false, is_posting: true },
      transaction,
    });

    if (!account) {
      throw new AppError(
        `GL account not found or not posting: ${code}. Configure the chart of accounts first.`,
        404
      );
    }

    return account;
  }

  async getAccountByCode(
    code: string,
    transaction?: Transaction
  ): Promise<Account | null> {
    return Account.findOne({
      where: { code, is_deleted: false },
      transaction,
    });
  }

  /**
   * Resolves the employee-level posting account under Department → Employee hierarchy.
   * Expected codes: {root}.{departmentId}.{employeeCode}
   * Fallback: child of {root}.{departmentId} matched by employee name/code.
   */
  async resolveEmployeeAccount(
    category: EmployeeAccountCategory,
    employeeId: number,
    transaction?: Transaction
  ): Promise<Account> {
    const employee: any = await Employee.findOne({
      where: { id: employeeId, is_deleted: false },
      include: [{ model: Department, attributes: ["id", "name"] }],
      transaction,
    });

    if (!employee) {
      throw new AppError(`Employee ${employeeId} not found`, 404);
    }

    const contract = await EmployeeContract.findOne({
      where: { employee_id: employeeId, status: "active", is_deleted: false },
      transaction,
    });

    const departmentId = contract?.department_id ?? employee.department_id;

    if (!departmentId) {
      throw new AppError(
        `Employee ${employee.full_name} has no department for account resolution`,
        400
      );
    }

    const rootCode = rootCodeForCategory(category);
    const employeePart = this.sanitizeCodePart(employee.code);
    const hierarchicalCode = `${rootCode}.${departmentId}.${employeePart}`;

    let account = await Account.findOne({
      where: { code: hierarchicalCode, is_deleted: false, is_posting: true },
      transaction,
    });

    if (account) {
      return account;
    }

    const departmentCode = `${rootCode}.${departmentId}`;
    const departmentAccount = await Account.findOne({
      where: { code: departmentCode, is_deleted: false },
      transaction,
    });

    if (departmentAccount) {
      account = await Account.findOne({
        where: {
          parent_id: departmentAccount.id,
          is_deleted: false,
          is_posting: true,
          [Op.or]: [
            { code: employeePart },
            { code: hierarchicalCode },
            { name: { [Op.iLike]: `%${employee.full_name}%` } },
          ],
        },
        transaction,
      });

      if (account) {
        return account;
      }
    }

    throw new AppError(
      `Employee GL account not found (${category}): expected code "${hierarchicalCode}" under department ${departmentId}. ` +
        `Set up the chart: ${rootCode} → ${departmentCode} → ${hierarchicalCode}`,
      404
    );
  }

  async resolveAllowanceAccount(
    accountCode: string,
    transaction?: Transaction
  ): Promise<Account> {
    return this.getSystemAccount(accountCode, transaction);
  }

  /** Convenience accessors for system-wide posting accounts */
  get cashBankCode(): string {
    return ACCOUNT_CODES.CASH_BANK;
  }

  get salaryExpenseCode(): string {
    return ACCOUNT_CODES.SALARY_EXPENSE;
  }

  get bonusExpenseCode(): string {
    return ACCOUNT_CODES.BONUS_EXPENSE;
  }

  get insuranceExpenseCode(): string {
    return ACCOUNT_CODES.INSURANCE_EXPENSE;
  }

  get insuranceCompanyPayableCode(): string {
    return ACCOUNT_CODES.INSURANCE_COMPANY_PAYABLE;
  }

  get absenceRevenueCode(): string {
    return ACCOUNT_CODES.ABSENCE_REVENUE;
  }
}

export const accountResolver = new AccountResolverService();
