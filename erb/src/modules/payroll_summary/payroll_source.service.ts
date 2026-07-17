import { Op, Transaction, fn, col } from "sequelize";
import ContractAllowance from "../../../database/Models/contract_allowances";
import EmployeeBonus from "../../../database/Models/employee_bonuses";
import EmployeeAbsence from "../../../database/Models/absences";
import EmployeeAdvanceLoan from "../../../database/Models/employee_loans";
import LeaveRequest from "../../../database/Models/leave_requests";

export interface PayrollSourceData {
  total_allowances: number;
  total_bonus: number;
  absence_days: number;
  loan_deductions: number;
  paid_leave_days: number;
}

const round2 = (value: unknown): number => {
  const num = parseFloat(String(value ?? 0));
  return isNaN(num) ? 0 : parseFloat(num.toFixed(2));
};

const monthDateRange = (month: number, year: number) => {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate, lastDay };
};

export function calculateLoanMonthlyDeduction(loan: {
  type: "advance" | "loan";
  amount: number | string;
  paid_amount: number | string;
  installment_amount?: number | string | null;
}): number {
  const remaining = round2(Number(loan.amount) - Number(loan.paid_amount ?? 0));
  if (remaining <= 0) {
    return 0;
  }

  if (loan.type === "advance") {
    return remaining;
  }

  const installment = round2(loan.installment_amount ?? 0);
  return Math.min(installment, remaining);
}

function leaveDaysInMonth(
  startDate: Date | string,
  endDate: Date | string,
  month: number,
  year: number
): number {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const start = new Date(startDate);
  const end = new Date(endDate);

  const overlapStart = start > monthStart ? start : monthStart;
  const overlapEnd = end < monthEnd ? end : monthEnd;

  if (overlapStart > overlapEnd) {
    return 0;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return round2((overlapEnd.getTime() - overlapStart.getTime()) / msPerDay + 1);
}

export class PayrollSourceService {
  static async fetchForBatch(
    employeeIds: number[],
    contractByEmployee: Map<number, { id: number }>,
    month: number,
    year: number,
    transaction?: Transaction
  ): Promise<Map<number, PayrollSourceData>> {
    const result = new Map<number, PayrollSourceData>();

    if (employeeIds.length === 0) {
      return result;
    }

    const emptySource = (): PayrollSourceData => ({
      total_allowances: 0,
      total_bonus: 0,
      absence_days: 0,
      loan_deductions: 0,
      paid_leave_days: 0,
    });

    for (const employeeId of employeeIds) {
      result.set(employeeId, emptySource());
    }

    const contractIds = [...contractByEmployee.values()].map((c) => c.id);
    const { startDate, endDate } = monthDateRange(month, year);

    if (contractIds.length > 0) {
      const allowanceRows: any[] = await ContractAllowance.findAll({
        where: { contract_id: { [Op.in]: contractIds }, is_deleted: false },
        attributes: [
          "contract_id",
          [fn("SUM", col("amount")), "total"],
        ],
        group: ["contract_id"],
        raw: true,
        transaction,
      });

      const allowanceByContract = new Map<number, number>(
        allowanceRows.map((row) => [Number(row.contract_id), round2(row.total)])
      );

      for (const [employeeId, contract] of contractByEmployee.entries()) {
        const source = result.get(employeeId)!;
        source.total_allowances = allowanceByContract.get(contract.id) ?? 0;
      }
    }

    const bonusRows: any[] = await EmployeeBonus.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds },
        approval_status: "approved",
        is_paid: false,
        payment_month: month,
        payment_year: year,
        is_deleted: false,
      },
      attributes: ["employee_id", [fn("SUM", col("amount")), "total"]],
      group: ["employee_id"],
      raw: true,
      transaction,
    });

    for (const row of bonusRows) {
      const source = result.get(Number(row.employee_id));
      if (source) {
        source.total_bonus = round2(row.total);
      }
    }

    const absenceRows: any[] = await EmployeeAbsence.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds },
        is_deleted: false,
        absence_date: { [Op.between]: [startDate, endDate] },
      },
      attributes: ["employee_id", [fn("SUM", col("deduction_days")), "total"]],
      group: ["employee_id"],
      raw: true,
      transaction,
    });

    for (const row of absenceRows) {
      const source = result.get(Number(row.employee_id));
      if (source) {
        source.absence_days = round2(row.total);
      }
    }

    const activeLoans = await EmployeeAdvanceLoan.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds },
        status: "active",
        approval_status: "approved",
        is_deleted: false,
      },
      transaction,
    });

    for (const loan of activeLoans) {
      const source = result.get(loan.employee_id);
      if (!source) {
        continue;
      }
      source.loan_deductions = round2(
        source.loan_deductions + calculateLoanMonthlyDeduction(loan)
      );
    }

    const approvedLeaves = await LeaveRequest.findAll({
      where: {
        employee_id: { [Op.in]: employeeIds },
        status: "approved",
        is_deleted: false,
        start_date: { [Op.lte]: endDate },
        end_date: { [Op.gte]: startDate },
      },
      transaction,
    });

    for (const leave of approvedLeaves) {
      const source = result.get(leave.employee_id);
      if (!source) {
        continue;
      }
      source.paid_leave_days = round2(
        source.paid_leave_days +
          leaveDaysInMonth(leave.start_date, leave.end_date, month, year)
      );
    }

    return result;
  }
}
