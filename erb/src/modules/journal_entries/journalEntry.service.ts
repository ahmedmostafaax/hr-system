import { Transaction } from "sequelize";
import JournalEntry from "../../../database/Models/journal_entries";
import JournalLine from "../../../database/Models/journal_lines";
import Account from "../../../database/Models/Account";
import PayrollRun from "../../../database/Models/payroll_runs";
import Employee from "../../../database/Models/employee";
import { sequelize } from "../../../database/db.connection";
import { AppError } from "../../utils/appError";

export interface JournalLineInput {
  account_id: number;
  debit?: number;
  credit?: number;
  description?: string | null;
  employee_id?: number | null;
  cost_center_id?: number | null;
}

export interface CreateJournalEntryInput {
  entry_type: string;
  description: string;
  lines: JournalLineInput[];
  payroll_run_id?: number | null;
  reference_type?: string | null;
  reference_id?: number | null;
  posting_date?: string | Date;
  status?: "draft" | "posted" | "cancelled";
  created_by?: number | null;
}

class JournalEntryService {
  private round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }

  private parseAmount(value: unknown): number {
    const num = parseFloat(String(value ?? 0));
    return isNaN(num) ? 0 : this.round2(num);
  }

  validateBalancedLines(lines: JournalLineInput[]): {
    totalDebit: number;
    totalCredit: number;
  } {
    if (!lines?.length || lines.length < 2) {
      throw new AppError("Journal entry must have at least 2 lines", 400);
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      const debit = this.parseAmount(line.debit);
      const credit = this.parseAmount(line.credit);

      if (debit < 0 || credit < 0) {
        throw new AppError("Debit and credit amounts must be non-negative", 400);
      }

      if (debit > 0 && credit > 0) {
        throw new AppError(
          "Each line must have either a debit or a credit amount, not both",
          400
        );
      }

      if (debit === 0 && credit === 0) {
        throw new AppError(
          "Each line must have a non-zero debit or credit amount",
          400
        );
      }

      totalDebit += debit;
      totalCredit += credit;
    }

    totalDebit = this.round2(totalDebit);
    totalCredit = this.round2(totalCredit);

    if (totalDebit !== totalCredit) {
      throw new AppError(
        `Journal entry is not balanced: total debit (${totalDebit}) must equal total credit (${totalCredit})`,
        400
      );
    }

    return { totalDebit, totalCredit };
  }

  async createJournalEntry(
    input: CreateJournalEntryInput,
    externalTransaction?: Transaction
  ) {
    const { totalDebit, totalCredit } = this.validateBalancedLines(input.lines);

    const transaction =
      externalTransaction ?? (await sequelize.transaction());
    const ownsTransaction = !externalTransaction;

    try {
      if (input.payroll_run_id != null) {
        const payrollRun = await PayrollRun.findOne({
          where: { id: input.payroll_run_id, is_deleted: false },
          transaction,
        });

        if (!payrollRun) {
          throw new AppError("Payroll run not found", 404);
        }
      }

      const accountIds = [...new Set(input.lines.map((line) => line.account_id))];
      const accounts = await Account.findAll({
        where: { id: accountIds, is_deleted: false },
        transaction,
      });

      if (accounts.length !== accountIds.length) {
        throw new AppError("One or more accounts not found", 404);
      }

      const accountMap = new Map(accounts.map((account) => [account.id, account]));

      const employeeIds = [
        ...new Set(
          input.lines
            .map((line) => line.employee_id)
            .filter((id): id is number => id != null)
        ),
      ];

      if (employeeIds.length > 0) {
        const employees = await Employee.findAll({
          where: { id: employeeIds, is_deleted: false },
          transaction,
        });

        if (employees.length !== employeeIds.length) {
          throw new AppError("One or more employees not found", 404);
        }
      }

      const entry = await JournalEntry.create(
        {
          entry_type: input.entry_type,
          description: input.description,
          payroll_run_id: input.payroll_run_id ?? null,
          reference_type: input.reference_type ?? null,
          reference_id: input.reference_id ?? null,
          posting_date: input.posting_date
            ? new Date(input.posting_date)
            : new Date(),
          total_debit: totalDebit,
          total_credit: totalCredit,
          status: input.status ?? "posted",
          created_by: input.created_by ?? null,
        },
        { transaction }
      );

      const lineRecords = input.lines.map((line) => {
        const account = accountMap.get(line.account_id)!;

        return {
          journal_entry_id: entry.id,
          account_id: line.account_id,
          account_code: account.code,
          account_name: account.name,
          debit: this.parseAmount(line.debit),
          credit: this.parseAmount(line.credit),
          description: line.description ?? null,
          employee_id: line.employee_id ?? null,
          cost_center_id: line.cost_center_id ?? null,
        };
      });

      await JournalLine.bulkCreate(lineRecords, { transaction });

      if (ownsTransaction) {
        await transaction.commit();
      }

      return JournalEntry.findByPk(entry.id, {
        include: [
          {
            model: JournalLine,
            as: "lines",
            include: [{ model: Account, as: "account", attributes: ["id", "code", "name"] }],
          },
        ],
      });
    } catch (error) {
      if (ownsTransaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }
}

export const journalEntryService = new JournalEntryService();
