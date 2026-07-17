import { Transaction } from "sequelize";
import { sequelize } from "../../../database/db.connection";
import EmployeeMonthlyPayrollSummary from "../../../database/Models/employee_monthly_payroll_summary";

export class PayrollAccumulatorService {
  /**
   * Helper to execute within a transaction if not provided
   */
  private static async executeWithTransaction<T>(
    callback: (t: Transaction) => Promise<T>,
    t?: Transaction
  ): Promise<T> {
    if (t) return callback(t);
    return await sequelize.transaction(async (newT) => {
      return await callback(newT);
    });
  }

  /**
   * Initializes or gets the summary to ensure it exists before incrementing.
   * Uses upsert to prevent Race Conditions without triggering many queries.
   */
  private static async ensureSummaryExists(
    employee_id: number,
    month: number,
    year: number,
    transaction: Transaction
  ): Promise<void> {
    await EmployeeMonthlyPayrollSummary.upsert(
      { employee_id, month, year },
      { transaction, returning: false }
    );
  }

  static async incrementAttendedDays(
    employee_id: number,
    month: number,
    year: number,
    days: number = 1,
    transaction?: Transaction
  ) {
    return this.executeWithTransaction(async (t) => {
      await this.ensureSummaryExists(employee_id, month, year, t);
      await EmployeeMonthlyPayrollSummary.increment("attended_days", {
        by: days,
        where: { employee_id, month, year },
        transaction: t,
      });
    }, transaction);
  }

  static async incrementOvertime(
    employee_id: number,
    month: number,
    year: number,
    hours: number,
    transaction?: Transaction
  ) {
    return this.executeWithTransaction(async (t) => {
      await this.ensureSummaryExists(employee_id, month, year, t);
      await EmployeeMonthlyPayrollSummary.increment("overtime_hours", {
        by: hours,
        where: { employee_id, month, year },
        transaction: t,
      });
    }, transaction);
  }

  static async incrementBonus(
    employee_id: number,
    month: number,
    year: number,
    amount: number,
    transaction?: Transaction
  ) {
    return this.executeWithTransaction(async (t) => {
      await this.ensureSummaryExists(employee_id, month, year, t);
      await EmployeeMonthlyPayrollSummary.increment("total_bonus", {
        by: amount,
        where: { employee_id, month, year },
        transaction: t,
      });
    }, transaction);
  }

  static async incrementDeduction(
    employee_id: number,
    month: number,
    year: number,
    amount: number,
    transaction?: Transaction
  ) {
    return this.executeWithTransaction(async (t) => {
      await this.ensureSummaryExists(employee_id, month, year, t);
      await EmployeeMonthlyPayrollSummary.increment("total_deductions", {
        by: amount,
        where: { employee_id, month, year },
        transaction: t,
      });
    }, transaction);
  }

  static async incrementLoanDeduction(
    employee_id: number,
    month: number,
    year: number,
    amount: number,
    transaction?: Transaction
  ) {
    return this.executeWithTransaction(async (t) => {
      await this.ensureSummaryExists(employee_id, month, year, t);
      await EmployeeMonthlyPayrollSummary.increment("loan_deductions", {
        by: amount,
        where: { employee_id, month, year },
        transaction: t,
      });
    }, transaction);
  }

  static async incrementPaidLeaveDays(
    employee_id: number,
    month: number,
    year: number,
    days: number = 1,
    transaction?: Transaction
  ) {
    return this.executeWithTransaction(async (t) => {
      await this.ensureSummaryExists(employee_id, month, year, t);
      await EmployeeMonthlyPayrollSummary.increment("paid_leave_days", {
        by: days,
        where: { employee_id, month, year },
        transaction: t,
      });
    }, transaction);
  }
}
