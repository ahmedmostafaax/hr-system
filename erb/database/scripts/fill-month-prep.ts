/**
 * Fill payroll-prep data for a month (attendance, absences, leaves, bonuses, loans)
 * and rebuild employee_monthly_payroll_summaries — WITHOUT creating a payroll run.
 *
 * Usage: npx ts-node database/scripts/fill-month-prep.ts [month] [year]
 * Example: npx ts-node database/scripts/fill-month-prep.ts 7 2026
 */
import dotenv from "dotenv";
import { Op, fn, col } from "sequelize";
import { sequelize } from "../db.connection";
import "../Models/relations";

import AccountingPeriod from "../Models/accounting_periods";
import EmployeeContract from "../Models/contracts";
import Shift from "../Models/shift.model";
import Employee from "../Models/employee";
import Attendance from "../Models/attendance";
import EmployeeAbsence from "../Models/absences";
import AbsenceType from "../Models/absence_type";
import LeaveRequest from "../Models/leave_requests";
import LeaveType from "../Models/leaveType.model";
import EmployeeBonus from "../Models/employee_bonuses";
import BonusType from "../Models/bonus_types";
import EmployeeAdvanceLoan from "../Models/employee_loans";
import EmployeeMonthlyPayrollSummary from "../Models/employee_monthly_payroll_summary";

dotenv.config();

const MONTH = Number(process.argv[2]) || 7;
const YEAR = Number(process.argv[3]) || new Date().getFullYear();

const DAY_INDEX: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function dateStr(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function monthRange(month: number, year: number) {
  const start = dateStr(year, month, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const end = dateStr(year, month, lastDay);
  return { start, end, lastDay };
}

function normalizeShiftWorkDays(workDays: unknown): Set<number> {
  const allowed = new Set<number>();
  if (Array.isArray(workDays)) {
    for (const item of workDays) {
      const key = String(item).toLowerCase();
      if (DAY_INDEX[key] !== undefined) allowed.add(DAY_INDEX[key]);
    }
  } else if (workDays && typeof workDays === "object") {
    for (const [key, val] of Object.entries(workDays as Record<string, unknown>)) {
      if (val) {
        const idx = DAY_INDEX[key.toLowerCase()];
        if (idx !== undefined) allowed.add(idx);
      }
    }
  }
  if (!allowed.size) {
    [0, 1, 2, 3, 4].forEach((d) => allowed.add(d));
  }
  return allowed;
}

function workDatesInMonth(month: number, year: number, workDays: unknown): string[] {
  const allowed = normalizeShiftWorkDays(workDays);
  const { lastDay } = monthRange(month, year);
  const dates: string[] = [];
  for (let day = 1; day <= lastDay; day++) {
    const dow = new Date(year, month - 1, day).getDay();
    if (allowed.has(dow)) dates.push(dateStr(year, month, day));
  }
  return dates;
}

function timeOnly(value: string | Date | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const raw = String(value);
  const match = raw.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}:00` : fallback;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${pad2(nh)}:${pad2(nm)}:00`;
}

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}

async function ensureOpenPeriod(month: number, year: number) {
  const [period] = await AccountingPeriod.findOrCreate({
    where: { month, year, is_deleted: false },
    defaults: { month, year, status: "open", is_deleted: false, created_by: 1 },
  });
  if (period.status === "closed") {
    await period.update({ status: "open", closed_by: null, closed_at: null });
    console.log(`Re-opened accounting period ${month}/${year}`);
  } else {
    console.log(`Accounting period ${month}/${year} is open`);
  }
}

async function rebuildSummaries(
  employeeIds: number[],
  contractMap: Map<number, { id: number }>,
  month: number,
  year: number
) {
  const { start, end } = monthRange(month, year);

  const { PayrollSourceService } = await import(
    "../../src/modules/payroll_summary/payroll_source.service"
  );

  const sources = await PayrollSourceService.fetchForBatch(
    employeeIds,
    contractMap,
    month,
    year
  );

  for (const employeeId of employeeIds) {
    const attended_days = await Attendance.count({
      where: {
        employee_id: employeeId,
        is_deleted: false,
        work_date: { [Op.between]: [start, end] },
        check_in: { [Op.ne]: null },
      },
    });

    const overtimeRow = (await Attendance.findOne({
      where: {
        employee_id: employeeId,
        is_deleted: false,
        work_date: { [Op.between]: [start, end] },
      },
      attributes: [[fn("COALESCE", fn("SUM", col("overtime_hours")), 0), "total"]],
      raw: true,
    })) as { total?: string } | null;

    const overtime_hours = parseFloat(String(overtimeRow?.total ?? 0)) || 0;
    const source = sources.get(employeeId) ?? {
      total_allowances: 0,
      total_bonus: 0,
      absence_days: 0,
      loan_deductions: 0,
      paid_leave_days: 0,
    };

    await EmployeeMonthlyPayrollSummary.upsert({
      employee_id: employeeId,
      month,
      year,
      attended_days,
      overtime_hours: parseFloat(overtime_hours.toFixed(2)),
      absence_days: source.absence_days,
      paid_leave_days: source.paid_leave_days,
      unpaid_leave_days: 0,
      total_bonus: source.total_bonus,
      total_allowances: source.total_allowances,
      loan_deductions: source.loan_deductions,
      total_deductions: 0,
      gross_salary: 0,
      net_salary: 0,
      version: 1,
    });
  }
}

async function main() {
  if (MONTH < 1 || MONTH > 12) throw new Error("month must be 1-12");

  await sequelize.authenticate();
  console.log(`\n=== Fill payroll prep data: ${MONTH}/${YEAR} (no payroll run) ===\n`);

  await ensureOpenPeriod(MONTH, YEAR);

  const contracts = await EmployeeContract.findAll({
    where: { status: "active", is_deleted: false },
    include: [
      { model: Employee, attributes: ["id", "full_name", "code"] },
      { model: Shift },
    ],
  });

  if (!contracts.length) {
    throw new Error("No active contracts found");
  }

  const absenceType = await AbsenceType.findOne({
    where: { is_deleted: false },
    order: [["id", "ASC"]],
  });
  const leaveType = await LeaveType.findOne({
    where: { is_deleted: false },
    order: [["id", "ASC"]],
  });
  const bonusType = await BonusType.findOne({
    where: { is_deleted: false },
    order: [["id", "ASC"]],
  });

  if (!absenceType || !leaveType || !bonusType) {
    throw new Error("Missing absence type, leave type, or bonus type in DB");
  }

  const stats = {
    attendance: 0,
    absences: 0,
    leaves: 0,
    bonuses: 0,
    loans: 0,
    summaries: 0,
  };

  const employeeIds: number[] = [];
  const contractMap = new Map<number, { id: number }>();

  for (let i = 0; i < contracts.length; i++) {
    const contract = contracts[i] as any;
    const employeeId = Number(contract.employee_id);
    const shift = contract.Shift as Shift | undefined;
    const emp = contract.Employee as Employee | undefined;
    employeeIds.push(employeeId);
    contractMap.set(employeeId, { id: contract.id });

    const workDates = workDatesInMonth(MONTH, YEAR, shift?.work_days);
    const shiftStart = timeOnly(shift?.start_time, "09:00:00");
    const shiftEnd = timeOnly(shift?.end_time, "17:00:00");

    const skipDays = new Set<string>();
    if (i % 5 === 0 && workDates.length > 5) {
      skipDays.add(workDates[10]);
    }

    for (const workDate of workDates) {
      if (skipDays.has(workDate)) continue;

      const exists = await Attendance.findOne({
        where: { employee_id: employeeId, work_date: workDate, is_deleted: false },
      });
      if (exists) continue;

      const lateProfile = i % 4 === 0;
      const overtimeProfile = i % 6 === 0;

      const check_in = lateProfile ? addMinutes(shiftStart, 45) : shiftStart;
      let check_out = shiftEnd;
      let overtime_hours = 0;
      let late_hours = lateProfile ? 0.75 : 0;

      if (overtimeProfile && workDates.indexOf(workDate) % 3 === 0) {
        check_out = addMinutes(shiftEnd, 90);
        overtime_hours = 1.5;
      }

      const working_hours = parseFloat(
        hoursBetween(check_in, check_out).toFixed(2)
      );

      await Attendance.create({
        employee_id: employeeId,
        department_id: contract.department_id,
        work_date: workDate,
        check_in,
        check_out,
        late_hours,
        overtime_hours,
        working_hours,
        notes: `بيانات تجريبية ${MONTH}/${YEAR}`,
        is_deleted: false,
      });
      stats.attendance++;
    }

    if (i % 5 === 0) {
      const absenceDate = dateStr(YEAR, MONTH, 15);
      const hasAbsence = await EmployeeAbsence.findOne({
        where: {
          employee_id: employeeId,
          absence_date: absenceDate,
          is_deleted: false,
        },
      });
      if (!hasAbsence) {
        await EmployeeAbsence.create({
          employee_id: employeeId,
          absence_type_id: absenceType.id,
          absence_date: absenceDate as unknown as Date,
          deduction_days: 1,
          notes: `غياب ${MONTH}/${YEAR}`,
          is_deleted: false,
        });
        stats.absences++;
      }
    }

    if (i % 7 === 0) {
      const { start, end } = monthRange(MONTH, YEAR);
      const hasLeave = await LeaveRequest.findOne({
        where: {
          employee_id: employeeId,
          status: "approved",
          is_deleted: false,
          start_date: { [Op.lte]: end },
          end_date: { [Op.gte]: start },
        },
      });
      if (!hasLeave) {
        await LeaveRequest.create({
          employee_id: employeeId,
          leave_type_id: leaveType.id,
          start_date: dateStr(YEAR, MONTH, 20) as unknown as Date,
          end_date: dateStr(YEAR, MONTH, 22) as unknown as Date,
          days_count: 3,
          status: "approved",
          approved_by: 1,
          reason: `إجازة ${MONTH}/${YEAR}`,
          request_date: dateStr(YEAR, MONTH, 18) as unknown as Date,
          is_deleted: false,
        });
        stats.leaves++;
      }
    }

    if (i % 3 === 0) {
      const hasBonus = await EmployeeBonus.findOne({
        where: {
          employee_id: employeeId,
          approval_status: "approved",
          payment_month: MONTH,
          payment_year: YEAR,
          is_deleted: false,
        },
      });
      if (!hasBonus) {
        await EmployeeBonus.create({
          employee_id: employeeId,
          bonus_type_id: bonusType.id,
          amount: 500 + (i % 5) * 300,
          grant_date: dateStr(YEAR, MONTH, 5) as unknown as Date,
          is_paid: false,
          payment_month: MONTH,
          payment_year: YEAR,
          approval_status: "approved",
          approved_by: 1,
          approved_at: new Date(),
          is_deleted: false,
        });
        stats.bonuses++;
      }
    }

    const activeLoan = await EmployeeAdvanceLoan.findOne({
      where: {
        employee_id: employeeId,
        status: "active",
        approval_status: "approved",
        is_deleted: false,
      },
    });
    if (!activeLoan && i % 4 === 0) {
      await EmployeeAdvanceLoan.create({
        employee_id: employeeId,
        type: i % 8 === 0 ? "loan" : "advance",
        amount: i % 8 === 0 ? 6000 : 2500,
        grant_date: dateStr(YEAR, MONTH > 1 ? MONTH - 1 : MONTH, 10) as unknown as Date,
        installment_amount: i % 8 === 0 ? 800 : 0,
        paid_amount: 0,
        status: "active",
        approval_status: "approved",
        approved_by: 1,
        approved_at: new Date(),
        is_deleted: false,
      });
      stats.loans++;
    }

    if (emp) {
      console.log(`  ✓ ${emp.code} — ${emp.full_name}`);
    }
  }

  await rebuildSummaries(employeeIds, contractMap, MONTH, YEAR);
  stats.summaries = employeeIds.length;

  console.log("\n=== Done (payroll run NOT created) ===");
  console.log(`Period: ${MONTH}/${YEAR}`);
  console.log(`Employees with active contracts: ${employeeIds.length}`);
  console.log(`Attendance rows created: ${stats.attendance}`);
  console.log(`Absences created: ${stats.absences}`);
  console.log(`Leave requests created: ${stats.leaves}`);
  console.log(`Bonuses created: ${stats.bonuses}`);
  console.log(`Loans/advances created: ${stats.loans}`);
  console.log(`Monthly summaries upserted: ${stats.summaries}`);
  console.log("\nYou can now create & run payroll manually from the UI.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
