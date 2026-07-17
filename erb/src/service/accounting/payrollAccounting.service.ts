import { Op, Transaction } from "sequelize";
import { journalEntryService, JournalLineInput } from "../../modules/journal_entries/journalEntry.service";
import { accountResolver } from "./accountResolver.service";
import PayrollRun from "../../../database/Models/payroll_runs";
import PayrollDetail from "../../../database/Models/payroll_details";
import Employee from "../../../database/Models/employee";
import EmployeeContract from "../../../database/Models/contracts";
import ContractAllowance from "../../../database/Models/contract_allowances";
import Allowance from "../../../database/Models/allowance_types";
import JournalEntry from "../../../database/Models/journal_entries";

const round2 = (value: unknown): number => {
  const num = parseFloat(String(value ?? 0));
  return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
};

const buildLine = (
  accountId: number,
  debit: number,
  credit: number,
  employeeId?: number,
  description?: string
): JournalLineInput => ({
  account_id: accountId,
  debit: round2(debit),
  credit: round2(credit),
  employee_id: employeeId ?? null,
  description: description ?? null,
});

async function entryAlreadyExists(
  payrollRunId: number,
  employeeId: number,
  entryType: string,
  transaction: Transaction
): Promise<boolean> {
  const existing = await JournalEntry.findOne({
    where: {
      payroll_run_id: payrollRunId,
      reference_type: "employee",
      reference_id: employeeId,
      entry_type: entryType,
      is_deleted: false,
      status: { [Op.ne]: "cancelled" },
    },
    transaction,
  });
  return !!existing;
}

async function getContractAllowanceLines(
  employeeId: number,
  transaction?: Transaction
): Promise<Array<{ account_id: number; amount: number; name: string }>> {
  const contract: any = await EmployeeContract.findOne({
    where: { employee_id: employeeId, status: "active", is_deleted: false },
    include: [
      {
        model: ContractAllowance,
        as: "allowances",
        where: { is_deleted: false },
        required: false,
        include: [{ model: Allowance, attributes: ["id", "name", "account_code"] }],
      },
    ],
    transaction,
  });

  if (!contract?.allowances?.length) {
    return [];
  }

  const lines: Array<{ account_id: number; amount: number; name: string }> = [];

  for (const contractAllowance of contract.allowances) {
    const allowanceType = contractAllowance.Allowance;
    if (!allowanceType?.account_code) {
      continue;
    }

    const amount = round2(contractAllowance.amount);
    if (amount <= 0) {
      continue;
    }

    const account = await accountResolver.resolveAllowanceAccount(
      allowanceType.account_code
    );

    lines.push({
      account_id: account.id,
      amount,
      name: allowanceType.name,
    });
  }

  return lines;
}

/**
 * Creates all payroll journal entries (accrual, insurance, settlement) inside the caller's transaction.
 */
export async function createJournalEntriesForPayroll(
  payrollRunId: number,
  createdBy: number | null,
  transaction: Transaction
): Promise<void> {
  const payrollRun: any = await PayrollRun.findByPk(payrollRunId, { transaction });

  if (!payrollRun || payrollRun.is_deleted) {
    throw new Error(`Payroll run ${payrollRunId} not found for accounting`);
  }

  const details: any[] = await PayrollDetail.findAll({
    where: { payroll_run_id: payrollRunId, is_deleted: false },
    include: [{ model: Employee, attributes: ["id", "full_name", "code"] }],
    transaction,
  });

  for (const detail of details) {
    const employeeId = detail.employee_id;
    const employeeName = detail.Employee?.full_name ?? `#${employeeId}`;
    const monthYear = `${payrollRun.month}/${payrollRun.year}`;

    const baseSalary = round2(detail.base_salary);
    const overtimePay = round2(detail.overtime_pay);
    const totalBonuses = round2(detail.total_bonuses);
    const totalEarnings = round2(detail.total_earnings);
    const insuranceCompany = round2(detail.insurance_company);
    const insuranceEmployee = round2(detail.insurance_employee);
    const loanDeduction = round2(detail.loan_deduction);
    const absenceDeduction = round2(detail.absence_deduction);
    const netSalary = round2(detail.net_salary);

    if (totalEarnings <= 0 && insuranceCompany <= 0) {
      continue;
    }

    if (
      totalEarnings > 0 &&
      !(await entryAlreadyExists(
        payrollRunId,
        employeeId,
        "payroll_accrual",
        transaction
      ))
    ) {
      const [salaryExpense, payablesAccount] = await Promise.all([
        accountResolver.getSystemAccount(accountResolver.salaryExpenseCode),
        accountResolver.resolveEmployeeAccount("payables", employeeId),
      ]);

      const accrualLines: JournalLineInput[] = [];
      const salaryAndOvertime = round2(baseSalary + overtimePay);

      if (salaryAndOvertime > 0) {
        accrualLines.push(
          buildLine(
            salaryExpense.id,
            salaryAndOvertime,
            0,
            employeeId,
            "مصروف رواتب"
          )
        );
      }

      if (totalBonuses > 0) {
        const bonusExpense = await accountResolver.getSystemAccount(
          accountResolver.bonusExpenseCode
        );
        accrualLines.push(
          buildLine(
            bonusExpense.id,
            totalBonuses,
            0,
            employeeId,
            "مصروف مكافآت (استحقاق)"
          )
        );
      }

      const allowanceLines = await getContractAllowanceLines(employeeId, transaction);
      let allowanceTotal = 0;

      for (const allowance of allowanceLines) {
        accrualLines.push(
          buildLine(
            allowance.account_id,
            allowance.amount,
            0,
            employeeId,
            `بدل – ${allowance.name}`
          )
        );
        allowanceTotal = round2(allowanceTotal + allowance.amount);
      }

      const detailAllowances = round2(detail.total_allowances);
      const allowanceGap = round2(detailAllowances - allowanceTotal);

      if (allowanceGap > 0) {
        accrualLines.push(
          buildLine(
            salaryExpense.id,
            allowanceGap,
            0,
            employeeId,
            "بدلات (غير مفصّلة في العقد)"
          )
        );
      }

      accrualLines.push(
        buildLine(
          payablesAccount.id,
          0,
          totalEarnings,
          employeeId,
          `ذمم موظفين – ${employeeName}`
        )
      );

      await journalEntryService.createJournalEntry(
        {
          entry_type: "payroll_accrual",
          description: `استحقاق راتب ${monthYear} – ${employeeName}`,
          payroll_run_id: payrollRunId,
          reference_type: "employee",
          reference_id: employeeId,
          lines: accrualLines,
          created_by: createdBy,
        },
        transaction
      );
    }

    if (
      insuranceCompany > 0 &&
      !(await entryAlreadyExists(
        payrollRunId,
        employeeId,
        "payroll_insurance_company",
        transaction
      ))
    ) {
      const [insuranceExpense, insurancePayable] = await Promise.all([
        accountResolver.getSystemAccount(accountResolver.insuranceExpenseCode),
        accountResolver.getSystemAccount(accountResolver.insuranceCompanyPayableCode),
      ]);

      await journalEntryService.createJournalEntry(
        {
          entry_type: "payroll_insurance_company",
          description: `تأمينات اجتماعية – حصة الشركة ${monthYear} – ${employeeName}`,
          payroll_run_id: payrollRunId,
          reference_type: "employee",
          reference_id: employeeId,
          lines: [
            buildLine(
              insuranceExpense.id,
              insuranceCompany,
              0,
              employeeId,
              "مصروف تأمينات اجتماعية"
            ),
            buildLine(
              insurancePayable.id,
              0,
              insuranceCompany,
              employeeId,
              "تأمينات اجتماعية مستحقة – حصة الشركة"
            ),
          ],
          created_by: createdBy,
        },
        transaction
      );
    }

    if (
      totalEarnings > 0 &&
      !(await entryAlreadyExists(
        payrollRunId,
        employeeId,
        "payroll_settlement",
        transaction
      ))
    ) {
      const payablesAccount = await accountResolver.resolveEmployeeAccount(
        "payables",
        employeeId
      );
      const cashAccount = await accountResolver.getSystemAccount(
        accountResolver.cashBankCode
      );

      const settlementLines: JournalLineInput[] = [
        buildLine(
          payablesAccount.id,
          totalEarnings,
          0,
          employeeId,
          `ذمم موظفين – تسوية ${monthYear}`
        ),
      ];

      if (insuranceEmployee > 0) {
        const insuranceEmployeeAccount =
          await accountResolver.resolveEmployeeAccount(
            "insurance_employee",
            employeeId
          );
        settlementLines.push(
          buildLine(
            insuranceEmployeeAccount.id,
            0,
            insuranceEmployee,
            employeeId,
            "تأمينات الموظف"
          )
        );
      }

      if (loanDeduction > 0) {
        const loanAccount = await accountResolver.resolveEmployeeAccount(
          "loans",
          employeeId
        );
        settlementLines.push(
          buildLine(
            loanAccount.id,
            0,
            loanDeduction,
            employeeId,
            "سلف موظفين – خصم"
          )
        );
      }

      if (absenceDeduction > 0) {
        const absenceRevenue = await accountResolver.getSystemAccount(
          accountResolver.absenceRevenueCode
        );
        settlementLines.push(
          buildLine(
            absenceRevenue.id,
            0,
            absenceDeduction,
            employeeId,
            "إيرادات خصومات غياب"
          )
        );
      }

      if (netSalary > 0) {
        settlementLines.push(
          buildLine(
            cashAccount.id,
            0,
            netSalary,
            employeeId,
            "الصندوق/البنك – صافي الراتب"
          )
        );
      }

      await journalEntryService.createJournalEntry(
        {
          entry_type: "payroll_settlement",
          description: `تسوية وصرف راتب ${monthYear} – ${employeeName}`,
          payroll_run_id: payrollRunId,
          reference_type: "employee",
          reference_id: employeeId,
          lines: settlementLines,
          created_by: createdBy,
        },
        transaction
      );
    }
  }
}
