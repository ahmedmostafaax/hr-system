import { Op } from "sequelize";
import Employee from "../../database/Models/employee";
import EmployeeContact from "../../database/Models/employee_relatives";
import EmployeeExperience from "../../database/Models/employee_experience";
import EmployeeContract from "../../database/Models/contracts";
import EmployeeLeaveBalance from "../../database/Models/contract_leaves";
import Department from "../../database/Models/department.model";
import Shift from "../../database/Models/shift.model";
import LeaveRequest from "../../database/Models/leave_requests";
import LeaveType from "../../database/Models/leaveType.model";
import EmployeeAbsence from "../../database/Models/absences";
import AbsenceType from "../../database/Models/absence_type";
import EmployeeBonus from "../../database/Models/employee_bonuses";
import BonusType from "../../database/Models/bonus_types";
import EmployeeAdvanceLoan from "../../database/Models/employee_loans";
import Attendance from "../../database/Models/attendance";
import PayrollRun from "../../database/Models/payroll_runs";
import PayrollDetail from "../../database/Models/payroll_details";
import { AppError } from "../utils/appError";
import { calculateAge } from "../utils/ageUtils";

function parsePeriod(monthRaw?: unknown, yearRaw?: unknown) {
  const now = new Date();
  const month = Number(monthRaw) || now.getMonth() + 1;
  const year = Number(yearRaw) || now.getFullYear();

  if (month < 1 || month > 12) {
    throw new AppError("month must be between 1 and 12", 400);
  }
  if (year < 2000 || year > 2100) {
    throw new AppError("year is out of range", 400);
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  return { month, year, startStr, endStr };
}

function fix2(value: unknown) {
  const n = parseFloat(String(value ?? 0));
  return Number.isFinite(n) ? parseFloat(n.toFixed(2)) : 0;
}

export async function buildEmployeeMySummary(
  employeeId: number,
  monthRaw?: unknown,
  yearRaw?: unknown
) {
  const { month, year, startStr, endStr } = parsePeriod(monthRaw, yearRaw);

  const employee: any = await Employee.findOne({
    where: { id: employeeId, is_deleted: false },
    include: [{ model: Department, attributes: ["id", "name"] }],
  });

  if (!employee) {
    throw new AppError("Employee profile not found", 404);
  }

  const [contracts, relatives, experiences, leaveRequests, absences, bonuses, loans, attendance] =
    await Promise.all([
      EmployeeContract.findAll({
        where: { employee_id: employeeId, is_deleted: false },
        include: [
          { model: Department, attributes: ["id", "name"] },
          { model: Shift, attributes: ["id", "name", "start_time", "end_time"] },
          {
            model: EmployeeLeaveBalance,
            as: "leaveBalances",
            include: [{ model: LeaveType, attributes: ["id", "name"] }],
          },
        ],
        order: [["start_date", "DESC"]],
      }),
      EmployeeContact.findAll({
        where: { employee_id: employeeId, is_deleted: false },
        order: [["id", "ASC"]],
      }),
      EmployeeExperience.findAll({
        where: { employee_id: employeeId, is_deleted: false },
        order: [["from_date", "DESC"]],
      }),
      LeaveRequest.findAll({
        where: {
          employee_id: employeeId,
          is_deleted: false,
          [Op.or]: [
            { start_date: { [Op.between]: [startStr, endStr] } },
            { end_date: { [Op.between]: [startStr, endStr] } },
            {
              [Op.and]: [
                { start_date: { [Op.lte]: startStr } },
                { end_date: { [Op.gte]: endStr } },
              ],
            },
          ],
        },
        include: [{ model: LeaveType, attributes: ["id", "name"] }],
        order: [["start_date", "DESC"]],
      }),
      EmployeeAbsence.findAll({
        where: {
          employee_id: employeeId,
          is_deleted: false,
          absence_date: { [Op.between]: [startStr, endStr] },
        },
        include: [{ model: AbsenceType, attributes: ["id", "name"] }],
        order: [["absence_date", "DESC"]],
      }),
      EmployeeBonus.findAll({
        where: {
          employee_id: employeeId,
          is_deleted: false,
          approval_status: "approved",
          [Op.or]: [
            { payment_month: month, payment_year: year },
            { grant_date: { [Op.between]: [startStr, endStr] } },
          ],
        },
        include: [{ model: BonusType, attributes: ["id", "name"] }],
        order: [["grant_date", "DESC"]],
      }),
      EmployeeAdvanceLoan.findAll({
        where: {
          employee_id: employeeId,
          is_deleted: false,
          approval_status: "approved",
        },
        order: [["id", "DESC"]],
      }),
      Attendance.findAll({
        where: {
          employee_id: employeeId,
          is_deleted: false,
          work_date: { [Op.between]: [startStr, endStr] },
        },
        order: [["work_date", "ASC"]],
      }),
    ]);

  const payrollRun: any = await PayrollRun.findOne({
    where: { month, year, is_deleted: false },
  });

  let payroll: any = null;
  if (payrollRun) {
    payroll = await PayrollDetail.findOne({
      where: {
        employee_id: employeeId,
        payroll_run_id: payrollRun.id,
        is_deleted: false,
      },
    });
  }

  const activeContract =
    contracts.find((c: any) => c.status === "active") ?? contracts[0] ?? null;

  const age =
    employee.birth_date != null
      ? calculateAge(employee.birth_date)
      : employee.age ?? null;

  const deductions = payroll
    ? {
        insurance: fix2(payroll.insurance_employee),
        loan: fix2(payroll.loan_deduction),
        absence: fix2(payroll.absence_deduction),
        total: fix2(payroll.total_deductions),
      }
    : {
        insurance: 0,
        loan: 0,
        absence: absences.reduce((s, a: any) => s + fix2(a.deduction_days), 0),
        total: 0,
      };

  if (!payroll && deductions.absence === 0) {
    deductions.total = 0;
  }

  const salary = payroll
    ? {
        payroll_run_id: payrollRun.id,
        payroll_status: payrollRun.status,
        base_salary: fix2(payroll.base_salary),
        total_allowances: fix2(payroll.total_allowances),
        overtime_pay: fix2(payroll.overtime_pay),
        total_bonuses: fix2(payroll.total_bonuses),
        total_earnings: fix2(payroll.total_earnings),
        net_salary: fix2(payroll.net_salary),
        deductions,
      }
    : activeContract
      ? {
          payroll_run_id: null,
          payroll_status: null,
          base_salary: fix2(activeContract.base_salary),
          total_allowances: 0,
          overtime_pay: 0,
          total_bonuses: bonuses.reduce((s, b: any) => s + fix2(b.amount), 0),
          total_earnings: fix2(activeContract.base_salary),
          net_salary: null,
          deductions,
          note: "no_payroll_run",
        }
      : null;

  return {
    period: { month, year, start: startStr, end: endStr },
    employee: {
      id: employee.id,
      code: employee.code,
      full_name: employee.full_name,
      email: employee.email,
      phone_number: employee.phone_number,
      national_id: employee.national_id,
      birth_date: employee.birth_date,
      age,
      gender: employee.gender,
      address: employee.address,
      marital_status: employee.marital_status,
      qualification: employee.qualification,
      bank_name: employee.bank_name,
      bank_account: employee.bank_account,
      is_active: employee.is_active,
      department: employee.Department ?? null,
    },
    contracts,
    active_contract: activeContract,
    relatives,
    experiences,
    leave_requests: leaveRequests,
    absences,
    bonuses,
    loans,
    attendance,
    salary,
  };
}
