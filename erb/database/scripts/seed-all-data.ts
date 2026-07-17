/**
 * Seed all tables with at least MIN records (default 50).
 * Run: npm run seed
 */
import dotenv from "dotenv";
import { sequelize } from "../db.connection";
import "../Models/relations";

import User from "../Models/user.model";
import Account from "../Models/Account";
import Shift from "../Models/shift.model";
import LeaveType from "../Models/leaveType.model";
import AbsenceType from "../Models/absence_type";
import BonusType from "../Models/bonus_types";
import InsuranceRate from "../Models/insurance_settings";
import Holiday from "../Models/official_holiday";
import Department from "../Models/department.model";
import Allowance from "../Models/allowance_types";
import Employee from "../Models/employee";
import EmployeeContract from "../Models/contracts";
import ContractAllowance from "../Models/contract_allowances";
import EmployeeLeaveBalance from "../Models/contract_leaves";
import EmployeeDocument from "../Models/employee_documents";
import EmployeeContact from "../Models/employee_relatives";
import EmployeeExperience from "../Models/employee_experience";
import LeaveRequest from "../Models/leave_requests";
import EmployeeAbsence from "../Models/absences";
import Attendance from "../Models/attendance";
import EmployeeBonus from "../Models/employee_bonuses";
import EmployeeAdvanceLoan from "../Models/employee_loans";
import CustodyTransfer from "../Models/custody";
import EmployeeMonthlyPayrollSummary from "../Models/employee_monthly_payroll_summary";
import PayrollRun from "../Models/payroll_runs";
import PayrollDetail from "../Models/payroll_details";
import JournalEntry from "../Models/journal_entries";
import JournalLine from "../Models/journal_lines";
import AccountingPeriod from "../Models/accounting_periods";
import AuditLog from "../Models/audit_logs";

dotenv.config();

const MIN = Number(process.env.SEED_MIN_RECORDS || 50);
const ROLES = ["HR", "ACCOUNTING", "ADMIN"] as const;
const FIRST_NAMES = [
  "أحمد", "محمد", "محمود", "علي", "حسن", "خالد", "يوسف", "عمر", "كريم", "طارق",
  "سارة", "فاطمة", "مريم", "نور", "هند", "دينا", "ياسمين", "رانيا", "سلمى", "لمياء",
];
const LAST_NAMES = [
  "حسن", "إبراهيم", "عبدالله", "سعيد", "فتحي", "عادل", "رمضان", "جمال", "شريف", "منصور",
];

function pad(n: number, len = 3) {
  return String(n).padStart(len, "0");
}

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function dateOnly(year: number, month: number, day: number) {
  return new Date(`${year}-${pad(month, 2)}-${pad(day, 2)}`);
}

async function countModel(model: any, where?: Record<string, unknown>) {
  try {
    return await model.count({ where: where ?? { is_deleted: false } });
  } catch {
    return await model.count();
  }
}

async function ensureCount(
  label: string,
  model: any,
  target: number,
  buildRows: (startIndex: number, count: number) => Record<string, unknown>[],
  where?: Record<string, unknown>
) {
  const current = await countModel(model, where);
  const need = Math.max(0, target - current);
  if (need === 0) {
    console.log(`✓ ${label}: ${current}`);
    return;
  }
  const rows = buildRows(current, need);
  await model.bulkCreate(rows, { validate: true });
  console.log(`✅ ${label}: +${need} → ${current + need}`);
}

async function getIds(model: any, where?: Record<string, unknown>) {
  const rows = await model.findAll({
    attributes: ["id"],
    where: where ?? { is_deleted: false },
    raw: true,
  });
  return rows.map((r: { id: number }) => r.id);
}

async function getCodes(model: any) {
  const rows = await model.findAll({
    attributes: ["code"],
    where: { is_deleted: false },
    raw: true,
  });
  return rows.map((r: { code: string }) => r.code);
}

async function main() {
  await sequelize.authenticate();
  console.log(`🔄 Seeding database (min ${MIN} records per table)...\n`);

  let admin = await User.findOne({ where: { email: "admin@company.com" } });
  if (!admin) {
    admin = await User.create({
      name: "أحمد السيد",
      email: "admin@company.com",
      phoneNumber: "01000000001",
      password: "01000000001",
      role: "SUPER-ADMIN",
      force_reset_password: false,
      uniqueCode: 123456,
      isActive: true,
      isBlock: false,
      is_deleted: false,
    });
  }
  const adminId = admin.id;

  await ensureCount("users", User, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => {
      const idx = start + i + 1;
      return {
        name: `${pick(FIRST_NAMES, idx)} ${pick(LAST_NAMES, idx)}`,
        email: `user${pad(idx, 4)}@company.com`,
        phoneNumber: `010${pad(1000000 + idx, 7)}`,
        password: "Password123",
        role: pick([...ROLES], idx),
        uniqueCode: 100000 + idx,
        isActive: true,
        isBlock: false,
        is_deleted: false,
      };
    })
  );

  await ensureCount("accounts", Account, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => {
      const idx = start + i + 1;
      const types = ["asset", "liability", "equity", "revenue", "expense"] as const;
      const type = pick([...types], idx);
      return {
        name: `حساب ${idx}`,
        code: `${1000 + idx}`,
        type,
        level: 1,
        is_posting: true,
        currency: "EGP",
        balance_type: type === "asset" || type === "expense" ? "debit" : "credit",
        is_deleted: false,
      };
    })
  );

  const accountIds = await getIds(Account);
  const accountCodes = await getCodes(Account);

  await ensureCount("shifts", Shift, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => {
      const idx = start + i + 1;
      return {
        name: `وردية ${idx}`,
        type: idx % 2 === 0 ? "fixed" : "flexible",
        work_days: { sun: true, mon: true, tue: true, wed: true, thu: true },
        start_time: "09:00",
        end_time: "17:00",
        grace_minutes: 15,
        deduct_grace: false,
        salary_basis_days: 30,
        is_deleted: false,
      };
    })
  );

  await ensureCount("leave_types", LeaveType, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      name: `نوع إجازة ${start + i + 1}`,
      is_deleted: false,
    }))
  );

  await ensureCount("absence_types", AbsenceType, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      name: `نوع غياب ${start + i + 1}`,
      deduct_days: (i % 3) + 0.5,
      is_deleted: false,
    }))
  );

  await ensureCount("bonus_types", BonusType, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      name: `نوع مكافأة ${start + i + 1}`,
      payment_type: i % 2 === 0 ? "cash" : "deferred",
      default_amount: 500 + i * 50,
      editable_amount: true,
      is_deleted: false,
    }))
  );

  await ensureCount("insurance_rates", InsuranceRate, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      employee_rate: 11,
      company_rate: 18.75,
      effective_from: dateOnly(2020 + (i % 5), 1, 1),
      is_deleted: false,
    }))
  );

  await ensureCount("holidays", Holiday, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => {
      const idx = start + i + 1;
      return {
        name: `عطلة رسمية ${idx}`,
        start_date: dateOnly(2025, (idx % 12) + 1, (idx % 28) + 1),
        is_deleted: false,
      };
    })
  );

  await ensureCount("departments", Department, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => {
      const idx = start + i + 1;
      return {
        name: `قسم ${idx}`,
        type: pick(["إداري", "تشغيلي", "مالي", "موارد بشرية"], idx),
        created_by: adminId,
        is_deleted: false,
      };
    })
  );

  await ensureCount("allowances", Allowance, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => {
      const idx = start + i + 1;
      return {
        name: `بدل ${idx}`,
        default_amount: 200 + i * 25,
        is_part_of_salary: i % 2 === 0,
        account_code: pick(accountCodes, idx),
        is_deleted: false,
      };
    })
  );

  const departmentIds = await getIds(Department);
  const shiftIds = await getIds(Shift);
  const leaveTypeIds = await getIds(LeaveType);
  const absenceTypeIds = await getIds(AbsenceType);
  const bonusTypeIds = await getIds(BonusType);
  const insuranceIds = await getIds(InsuranceRate);
  const allowanceIds = await getIds(Allowance);

  await ensureCount("employees", Employee, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => {
      const idx = start + i + 1;
      return {
        code: `EMP${pad(idx, 4)}`,
        full_name: `${pick(FIRST_NAMES, idx)} ${pick(LAST_NAMES, idx)}`,
        birth_date: dateOnly(1985 + (idx % 15), (idx % 12) + 1, (idx % 28) + 1),
        phone_number: `01${idx % 2 === 0 ? "0" : "1"}${pad(10000000 + idx, 8)}`,
        gender: idx % 2 === 0 ? "M" : "F",
        national_id: `2900101${pad(idx, 7)}`,
        email: `employee${pad(idx, 4)}@company.com`,
        address: `القاهرة - شارع ${idx}`,
        marital_status: pick(["single", "married", "divorced", "widowed"], idx),
        qualification: pick(["بكالوريوس", "ماجستير", "دبلوم", "ثانوية عامة"], idx),
        bank_name: "البنك الأهلي",
        bank_account: `${1000000000 + idx}`,
        department_id: pick(departmentIds, idx),
        created_by: adminId,
        updated_by: adminId,
        deleted_by: adminId,
        is_active: true,
        is_deleted: false,
      };
    })
  );

  const employeeIds = await getIds(Employee);

  await ensureCount("employee_contracts", EmployeeContract, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => {
      const idx = start + i;
      return {
        employee_id: pick(employeeIds, idx),
        department_id: pick(departmentIds, idx),
        job_title: pick(["محاسب", "مطور", "مدير موارد بشرية", "موظف مبيعات", "فني"], idx),
        start_date: dateOnly(2022, 1, 1),
        base_salary: 5000 + (idx % 20) * 500,
        shift_id: pick(shiftIds, idx),
        status: "active",
        overtime_enabled: idx % 3 === 0,
        insurance_setting_id: pick(insuranceIds, idx),
        created_by: adminId,
        updated_by: adminId,
        is_active: true,
        is_deleted: false,
      };
    })
  );

  const allContractIds = await getIds(EmployeeContract);

  await ensureCount("contract_allowances", ContractAllowance, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      contract_id: pick(allContractIds, start + i),
      allowance_type_id: pick(allowanceIds, start + i),
      amount: 300 + i * 20,
      is_deleted: false,
    }))
  );

  await ensureCount("employee_leave_balances", EmployeeLeaveBalance, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      contract_id: pick(allContractIds, start + i),
      leave_type_id: pick(leaveTypeIds, start + i),
      year: 2025,
      balance_days: 14,
      is_deleted: false,
    }))
  );

  await ensureCount("employee_documents", EmployeeDocument, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      employee_id: pick(employeeIds, start + i),
      doc_name: `مستند ${start + i + 1}`,
      file_path: `/uploads/doc-${start + i + 1}.pdf`,
      is_deleted: false,
    }))
  );

  await ensureCount("employee_contacts", EmployeeContact, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      employee_id: pick(employeeIds, start + i),
      relation: pick(["زوج/ة", "أب", "أم", "أخ", "ابن"], i),
      name: `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i)}`,
      phone: `010${pad(2000000 + start + i, 7)}`,
      is_deleted: false,
    }))
  );

  await ensureCount("employee_experiences", EmployeeExperience, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      employee_id: pick(employeeIds, start + i),
      company_name: `شركة ${start + i + 1}`,
      from_date: dateOnly(2015 + (i % 5), 1, 1),
      to_date: dateOnly(2020 + (i % 4), 12, 31),
      is_deleted: false,
    }))
  );

  await ensureCount("leave_requests", LeaveRequest, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      employee_id: pick(employeeIds, start + i),
      leave_type_id: pick(leaveTypeIds, start + i),
      start_date: dateOnly(2025, 6, 1),
      end_date: dateOnly(2025, 6, 3),
      days_count: 3,
      status: pick(["pending", "approved", "rejected"], i),
      is_deleted: false,
    }))
  );

  await ensureCount("employee_absences", EmployeeAbsence, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      employee_id: pick(employeeIds, start + i),
      absence_type_id: pick(absenceTypeIds, start + i),
      absence_date: dateOnly(2025, 5, (i % 28) + 1),
      deduction_days: 1,
      is_deleted: false,
    }))
  );

  await ensureCount("attendance", Attendance, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      employee_id: pick(employeeIds, start + i),
      department_id: pick(departmentIds, start + i),
      work_date: dateOnly(2025, 6, (i % 28) + 1),
      check_in: "09:00",
      check_out: "17:00",
      is_deleted: false,
    }))
  );

  const approvalStatuses = ["pending", "approved", "rejected"] as const;

  await ensureCount("employee_bonuses", EmployeeBonus, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      employee_id: pick(employeeIds, start + i),
      bonus_type_id: pick(bonusTypeIds, start + i),
      amount: 1000 + i * 100,
      grant_date: dateOnly(2025, 4, (i % 28) + 1),
      is_paid: i % 2 === 0,
      payment_month: 5,
      payment_year: 2025,
      approval_status: pick([...approvalStatuses], i),
      is_deleted: false,
    }))
  );

  await ensureCount("employee_advances_loans", EmployeeAdvanceLoan, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      employee_id: pick(employeeIds, start + i),
      type: i % 2 === 0 ? "loan" : "advance",
      amount: 3000 + i * 200,
      grant_date: dateOnly(2025, 3, (i % 28) + 1),
      installment_amount: 500,
      paid_amount: i * 50,
      status: "active",
      approval_status: pick([...approvalStatuses], i),
      is_deleted: false,
    }))
  );

  await ensureCount("custody_transfers", CustodyTransfer, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      from_employee_id: pick(employeeIds, start + i),
      to_employee_id: pick(employeeIds, start + i + 1),
      item_name: `عهدة ${start + i + 1}`,
      transfer_type: "handover",
      transfer_date: dateOnly(2025, 2, (i % 28) + 1),
      is_deleted: false,
    }))
  );

  await ensureCount(
    "employee_monthly_payroll_summaries",
    EmployeeMonthlyPayrollSummary,
    MIN,
    (start, n) =>
      Array.from({ length: n }, (_, i) => {
        const idx = start + i;
        return {
          employee_id: pick(employeeIds, idx),
          month: (idx % 12) + 1,
          year: 2025 + Math.floor(idx / 12),
          gross_salary: 7000,
          net_salary: 6500,
        };
      }),
    {}
  );

  await ensureCount("payroll_runs", PayrollRun, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => {
      const idx = start + i;
      return {
        month: (idx % 12) + 1,
        year: 2020 + Math.floor(idx / 12),
        status: pick(["draft", "confirmed", "paid"], i),
        created_by: adminId,
        is_deleted: false,
      };
    })
  );

  const payrollRunIds = await getIds(PayrollRun);

  await ensureCount("payroll_details", PayrollDetail, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      payroll_run_id: pick(payrollRunIds, start + i),
      employee_id: pick(employeeIds, start + i),
      base_salary: 5000,
      total_earnings: 6000,
      total_deductions: 400,
      net_salary: 5600,
      is_deleted: false,
    }))
  );

  await ensureCount("journal_entries", JournalEntry, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      entry_type: "payroll",
      posting_date: dateOnly(2025, 6, (i % 28) + 1),
      description: `قيد يومية ${start + i + 1}`,
      total_debit: 10000,
      total_credit: 10000,
      status: "posted",
      payroll_run_id: pick(payrollRunIds, i),
      created_by: adminId,
      is_deleted: false,
    }))
  );

  const journalEntryIds = await getIds(JournalEntry);

  // Legacy duplicate FK pointed journal_entry_id to empty payroll_entries table
  await sequelize.query(
    'ALTER TABLE journal_lines DROP CONSTRAINT IF EXISTS journal_lines_journal_entry_id_fkey1'
  );

  await ensureCount("journal_lines", JournalLine, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => ({
      journal_entry_id: pick(journalEntryIds, start + i),
      account_id: pick(accountIds, start + i),
      debit: i % 2 === 0 ? 1000 : 0,
      credit: i % 2 === 0 ? 0 : 1000,
      employee_id: pick(employeeIds, start + i),
    })),
    {}
  );

  await ensureCount("accounting_periods", AccountingPeriod, MIN, (start, n) =>
    Array.from({ length: n }, (_, i) => {
      const idx = start + i;
      return {
        month: (idx % 12) + 1,
        year: 2020 + Math.floor(idx / 12),
        status: i % 3 === 0 ? "closed" : "open",
        created_by: adminId,
        is_deleted: false,
      };
    })
  );

  await ensureCount(
    "audit_logs",
    AuditLog,
    MIN,
    (start, n) =>
      Array.from({ length: n }, (_, i) => ({
        action: pick(["CREATE", "UPDATE", "DELETE", "APPROVE"], i),
        entity_type: pick(["Employee", "PayrollRun", "EmployeeLoan", "EmployeeBonus"], i),
        entity_id: pick(employeeIds, start + i),
        user_id: adminId,
        ip_address: "127.0.0.1",
      })),
    {}
  );

  console.log("\n✅ Seeding completed successfully.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
