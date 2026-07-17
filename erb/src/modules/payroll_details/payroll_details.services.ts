import { Op, Sequelize, Transaction } from "sequelize";
import PayrollDetail from "../../../database/Models/payroll_details";
import Employee from "../../../database/Models/employee";
import EmployeeContract from "../../../database/Models/contracts";
import PayrollRun from "../../../database/Models/payroll_runs";
import InsuranceSetting from "../../../database/Models/insurance_settings";
import EmployeeMonthlyPayrollSummary from "../../../database/Models/employee_monthly_payroll_summary";
import { AppError } from "../../utils/appError";
import Shift from "../../../database/Models/shift.model";
import { sequelize } from "../../../database/db.connection";
import { PayrollSourceService } from "../payroll_summary/payroll_source.service";
import { createJournalEntriesForPayroll } from "../../service/accounting/payrollAccounting.service";
import { ensureDefaultChartOfAccounts } from "../../service/accounting/defaultChartOfAccounts.service";
import { erpEmitter, EVENTS } from "../../events/eventEmitter";

class PayrollDetailsService {
  async buildEmployeePayroll(employee_id: number, payroll_run_id: number) {
    const payrollRun: any = await PayrollRun.findByPk(payroll_run_id);

    if (!payrollRun) {
      throw new AppError("Payroll run not found", 404);
    }

    const detail: any = await PayrollDetail.findOne({
      where: {
        payroll_run_id,
        employee_id,
        is_deleted: false,
      },
      include: [
        {
          model: Employee,
          attributes: ["id", "full_name", "code"],
        },
      ],
    });

    if (!detail) {
      throw new AppError("Payroll detail not found for this employee", 404);
    }

    const fix2 = (value: any) => {
      const num = parseFloat(value || 0);
      return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
    };

    return {
      payroll_run: {
        id: payrollRun.id,
        month: payrollRun.month,
        year: payrollRun.year,
        status: payrollRun.status,
      },

      employee: {
        employee_id: detail.employee_id,
        full_name: detail.Employee?.full_name,
        code: detail.Employee?.code,

        base_salary: fix2(detail.base_salary),
        overtime_pay: fix2(detail.overtime_pay),
        total_allowances: fix2(detail.total_allowances),
        total_bonuses: fix2(detail.total_bonuses),

        total_earnings: fix2(detail.total_earnings),

        insurance_employee: fix2(detail.insurance_employee),
        insurance_company: fix2(detail.insurance_company),

        loan_deduction: fix2(detail.loan_deduction),

        absence_days: fix2(detail.absence_days),
        absence_deduction: fix2(detail.absence_deduction),

        total_deductions: fix2(detail.total_deductions),
        net_salary: fix2(detail.net_salary),
      },
    };
  }

  async buildReport(payroll_run_id: number) {
    const payrollRun: any = await PayrollRun.findByPk(payroll_run_id);
    if (!payrollRun) throw new AppError("Payroll run not found", 404);

    const details: any[] = await PayrollDetail.findAll({
      where: { payroll_run_id, is_deleted: false },
      include: [
        { model: Employee, attributes: ["id", "full_name", "code"] },
        { model: PayrollRun, attributes: ["id", "month", "year", "status"] },
      ],
      order: [["employee_id", "ASC"]],
    });

    const fix2 = (n: number) => parseFloat(n.toFixed(2));
    const sum = (key: string) => details.reduce((s, d) => s + parseFloat(d[key] || 0), 0);

    return {
      payroll_run: { id: payrollRun.id, month: payrollRun.month, year: payrollRun.year, status: payrollRun.status },
      summary: {
        total_employees: details.length,
        total_base_salary: fix2(sum("base_salary")),
        total_overtime_pay: fix2(sum("overtime_pay")),
        total_allowances: fix2(sum("total_allowances")),
        total_bonuses: fix2(sum("total_bonuses")),
        total_earnings: fix2(sum("total_earnings")),
        total_insurance_employee: fix2(sum("insurance_employee")),
        total_insurance_company: fix2(sum("insurance_company")),
        total_loan_deductions: fix2(sum("loan_deduction")),
        total_absence_days: fix2(sum("absence_days")),
        total_absence_deductions: fix2(sum("absence_deduction")),
        total_deductions: fix2(sum("total_deductions")),
        total_net_salary: fix2(sum("net_salary")),
      },
      employees: details.map((d) => ({
        employee_id: d.employee_id,
        full_name: d.Employee?.full_name,
        code: d.Employee?.code,
        base_salary: parseFloat(d.base_salary),
        overtime_pay: parseFloat(d.overtime_pay),
        total_allowances: parseFloat(d.total_allowances),
        total_bonuses: parseFloat(d.total_bonuses),
        total_earnings: parseFloat(d.total_earnings),
        insurance_employee: parseFloat(d.insurance_employee),
        insurance_company: parseFloat(d.insurance_company),
        loan_deduction: parseFloat(d.loan_deduction),
        absence_days: parseFloat(d.absence_days),
        absence_deduction: parseFloat(d.absence_deduction),
        total_deductions: parseFloat(d.total_deductions),
        net_salary: parseFloat(d.net_salary),
      })),
    };
  }

  async recalculateForAllEmployees(payroll_run_id: number) {
    const transaction = await sequelize.transaction();
    try {
      const payrollRun: any = await PayrollRun.findByPk(payroll_run_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!payrollRun || payrollRun.is_deleted) {
        throw new AppError("Payroll run not found", 404);
      }

      if (payrollRun.status !== "draft") {
        throw new AppError("Can only recalculate payroll in draft status", 400);
      }

      await PayrollDetail.destroy({
        where: { payroll_run_id },
        transaction,
      });

      const result = await this.generateForAllEmployeesBulk(
        payroll_run_id,
        transaction
      );

      this.assertGenerationSuccess(result);

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private assertGenerationSuccess(result: {
    processed: any[];
    skipped: any[];
    errors: any[];
  }): void {
    if (result.errors.length > 0) {
      const first = result.errors[0];
      throw new AppError(
        `Failed to process payroll: ${first.reason ?? "unknown error"}`,
        500
      );
    }
  }

  /**
   * Confirm an already-calculated draft run — status change only (no recalc, no JEs).
   * Use recalculate first if payroll details are missing.
   */
  async confirmPayrollRun(
    payrollRunId: number,
    processedBy: number | null
  ): Promise<any> {
    const payrollRun: any = await PayrollRun.findByPk(payrollRunId);

    if (!payrollRun || payrollRun.is_deleted) {
      throw new AppError("Payroll run not found", 404);
    }

    if (payrollRun.status !== "draft") {
      throw new AppError("Payroll run must be in draft status to confirm", 400);
    }

    const detailCount = await PayrollDetail.count({
      where: { payroll_run_id: payrollRunId, is_deleted: false },
    });

    if (detailCount === 0) {
      throw new AppError(
        "Payroll must be calculated before confirmation. Use recalculate first.",
        400
      );
    }

    await payrollRun.update({
      status: "confirmed",
      processed_at: new Date(),
      processed_by: processedBy,
    });

    erpEmitter.emit(EVENTS.PAYROLL_CONFIRMED, payrollRunId, {
      id: processedBy,
    });

    await payrollRun.reload();
    return payrollRun;
  }

  /**
   * Full payroll + accounting in one DB transaction (existing draft run).
   * Generates details if none exist; confirms run; creates JEs.
   * Emits PAYROLL_CONFIRMED only after successful commit (notifications only).
   */
  async processPayrollWithAccounting(
    payrollRunId: number,
    processedBy: number | null,
    externalTransaction?: Transaction
  ): Promise<{ payrollRun: any; processResult: any }> {
    const ownsTransaction = !externalTransaction;
    const transaction =
      externalTransaction ?? (await sequelize.transaction());

    try {
      const payrollRun: any = await PayrollRun.findByPk(payrollRunId, {
        transaction,
        lock: ownsTransaction ? transaction.LOCK.UPDATE : undefined,
      });

      if (!payrollRun || payrollRun.is_deleted) {
        throw new AppError("Payroll run not found", 404);
      }

      if (payrollRun.status !== "draft") {
        throw new AppError("Payroll run must be in draft status to process", 400);
      }

      const existingDetails = await PayrollDetail.count({
        where: { payroll_run_id: payrollRunId },
        transaction,
      });

      let processResult: any = { processed: [], skipped: [], errors: [] };

      if (existingDetails === 0) {
        processResult = await this.generateForAllEmployeesBulk(
          payrollRunId,
          transaction
        );
        this.assertGenerationSuccess(processResult);
      }

      await payrollRun.update(
        {
          status: "confirmed",
          processed_at: new Date(),
          processed_by: processedBy,
        },
        { transaction }
      );

      await ensureDefaultChartOfAccounts(transaction);

      await createJournalEntriesForPayroll(
        payrollRunId,
        processedBy,
        transaction
      );

      if (ownsTransaction) {
        await transaction.commit();
        erpEmitter.emit(EVENTS.PAYROLL_CONFIRMED, payrollRunId, {
          id: processedBy,
        });
      }

      await payrollRun.reload();
      return { payrollRun, processResult };
    } catch (error) {
      if (ownsTransaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Create payroll run + generate details + confirm + JEs in a single transaction.
   */
  async createAndProcessPayrollWithAccounting(
    month: number,
    year: number,
    processedBy: number | null
  ): Promise<{ payrollRun: any; processResult: any }> {
    const transaction = await sequelize.transaction();

    try {
      await ensureDefaultChartOfAccounts(transaction);

      const payrollRun = await PayrollRun.create(
        {
          month,
          year,
          status: "draft",
          processed_by: processedBy,
        },
        { transaction }
      );

      const processResult = await this.generateForAllEmployeesBulk(
        payrollRun.id,
        transaction
      );

      this.assertGenerationSuccess(processResult);

      await payrollRun.update(
        {
          status: "confirmed",
          processed_at: new Date(),
          processed_by: processedBy,
        },
        { transaction }
      );

      await createJournalEntriesForPayroll(
        payrollRun.id,
        processedBy,
        transaction
      );

      await transaction.commit();

      erpEmitter.emit(EVENTS.PAYROLL_CONFIRMED, payrollRun.id, {
        id: processedBy,
      });

      await payrollRun.reload();
      return { payrollRun, processResult };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async generateForAllEmployeesBulk(payroll_run_id: number, externalTransaction?: any) {
    const payrollRun: any = await PayrollRun.findByPk(payroll_run_id, {
      transaction: externalTransaction,
    });
    if (!payrollRun) throw new AppError("Payroll run not found", 404);

    const { month, year } = payrollRun;
    const endDate = new Date(year, month, 0); // Last day of the month

    const transaction = externalTransaction || (await sequelize.transaction());

    try {
      const BATCH_SIZE = 500; // Chunk Processing
      let offset = 0;
      let hasMore = true;

      const results = { processed: [] as any[], skipped: [] as any[], errors: [] as any[] };

      const insuranceRates = await this.getInsuranceRates(endDate);

      while (hasMore) {
        // Fetch summaries in chunks - Reading from the Read Model (Summary)
        const summaries: any[] = await EmployeeMonthlyPayrollSummary.findAll({
          where: { month, year },
          limit: BATCH_SIZE,
          offset,
          transaction
        });

        if (summaries.length === 0) {
          hasMore = false;
          break;
        }

        const employeeIds = summaries.map((s) => s.employee_id);

        // Fetch active contracts for this batch
        const contracts: any[] = await EmployeeContract.findAll({
          where: {
            employee_id: { [Op.in]: employeeIds },
            status: "active",
            is_deleted: false,
          },
          include: [
            { model: Employee, attributes: ["id", "full_name", "code"] },
            { model: Shift, attributes: ["salary_basis_days"] },
          ],
          transaction,
        });

        const contractMap = new Map(contracts.map((c) => [c.employee_id, c]));

        const payrollSources = await PayrollSourceService.fetchForBatch(
          employeeIds,
          contractMap,
          month,
          year,
          transaction
        );

        const detailsData: any[] = [];

        for (const summary of summaries) {
          const contract = contractMap.get(summary.employee_id);
          if (!contract) {
            results.skipped.push({ employee_id: summary.employee_id, reason: "No active contract" });
            continue;
          }

          try {
            const base_salary = parseFloat(contract.base_salary as any);
            const salaryBasisDays = contract.Shift?.salary_basis_days || 26;
            const dailyRate = base_salary / salaryBasisDays;

            const source = payrollSources.get(summary.employee_id) ?? {
              total_allowances: 0,
              total_bonus: 0,
              absence_days: 0,
              loan_deductions: 0,
              paid_leave_days: 0,
            };

            const overtime_pay = parseFloat(
              ((dailyRate / 8) * 1.5 * Number(summary.overtime_hours)).toFixed(2)
            );
            const total_allowances = source.total_allowances;
            const total_bonuses = source.total_bonus;

            const total_earnings = parseFloat(
              (base_salary + overtime_pay + total_allowances + total_bonuses).toFixed(2)
            );

            const absence_days = source.absence_days;
            const absence_deduction = parseFloat(
              (dailyRate * absence_days).toFixed(2)
            );

            const insurance_employee = parseFloat(
              (base_salary * (insuranceRates.employee_rate / 100)).toFixed(2)
            );
            const insurance_company = parseFloat(
              (base_salary * (insuranceRates.company_rate / 100)).toFixed(2)
            );

            const mandatory_deductions = parseFloat(
              (insurance_employee + absence_deduction).toFixed(2)
            );

            let actual_loan_deduction = source.loan_deductions;

            // Cap loan deductions to available balance
            let available_balance = total_earnings - mandatory_deductions;
            if (available_balance < 0) available_balance = 0;

            if (actual_loan_deduction > available_balance) {
              actual_loan_deduction = available_balance; // Cap it
            }

            const total_deductions = parseFloat((mandatory_deductions + actual_loan_deduction).toFixed(2));
            let net_salary = parseFloat((total_earnings - total_deductions).toFixed(2));
            if (net_salary < 0) net_salary = 0;

            // Sync summary read-model from authoritative sources
            summary.total_allowances = total_allowances;
            summary.total_bonus = total_bonuses;
            summary.absence_days = absence_days;
            summary.loan_deductions = source.loan_deductions;
            summary.paid_leave_days = source.paid_leave_days;
            summary.gross_salary = total_earnings;
            summary.net_salary = net_salary;
            await summary.save({ transaction });

            // Create Immutable Snapshot Data
            detailsData.push({
              payroll_run_id,
              employee_id: summary.employee_id,
              base_salary,
              overtime_pay,
              total_allowances,
              total_bonuses,
              total_earnings,
              insurance_employee,
              insurance_company,
              loan_deduction: actual_loan_deduction,
              absence_days,
              absence_deduction,
              total_deductions,
              net_salary,
            });

            results.processed.push({
              employee_id: summary.employee_id,
              full_name: contract.Employee?.full_name,
              net_salary,
            });
          } catch (err: any) {
            results.errors.push({ employee_id: summary.employee_id, reason: err.message });
          }
        }

        if (detailsData.length > 0) {
          // Bulk insert the snapshot
          await PayrollDetail.bulkCreate(detailsData, { transaction, validate: true });
        }

        offset += BATCH_SIZE;
      }

      if (!externalTransaction) await transaction.commit();
      return results;
    } catch (err: any) {
      if (!externalTransaction) await transaction.rollback();
      throw err;
    }
  }

  private async getInsuranceRates(endDate: Date) {
    const insuranceSetting: any = await InsuranceSetting.findOne({
      where: { effective_from: { [Op.lte]: endDate } },
      order: [["effective_from", "DESC"]],
    });

    return {
      employee_rate: insuranceSetting?.employee_rate || 0,
      company_rate: insuranceSetting?.company_rate || 0,
    };
  }
}

export const payrollDetailsService = new PayrollDetailsService();