import AbsenceType from "./absence_type";
import EmployeeAbsence from "./absences";
import Allowance from "./allowance_types";
import Attendance from "./attendance";
import BonusType from "./bonus_types";
import EmployeeAllowance from "./contract_allowances";
import EmployeeLeaveBalance from "./contract_leaves";
import EmployeeContract from "./contracts";
import CustodyTransfer from "./custody";
import Department from "./department.model";
import Employee from "./employee";
import EmployeeBonus from "./employee_bonuses";
import EmployeeDocument from "./employee_documents";
import EmployeeExperience from "./employee_experience";
import EmployeeAdvanceLoan from "./employee_loans";
import EmployeeContact from "./employee_relatives";
import JournalLine from "./journal_lines";
import JournalEntry from "./journal_entries";
import LeaveRequest from "./leave_requests";
import LeaveType from "./leaveType.model";
import PayrollDetail from "./payroll_details";
import PayrollRun from "./payroll_runs";
import Shift from "./shift.model";
import User from "./user.model";
import Account from "./Account";
import ContractAllowance from "./contract_allowances";
import InsuranceRate from "./insurance_settings";
import AccountingPeriod from "./accounting_periods";
import AuditLog from "./audit_logs";


// =======================
User.belongsTo(Employee, {
  foreignKey: "employee_id",
  as: "employee",
});

Employee.hasOne(User, {
  foreignKey: "employee_id",
  as: "user",
});

User.hasMany(Department, {
  foreignKey: "created_by",
  as: "departments",
});

// Department -> User
Department.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

// =======================
Account.hasMany(Account, {
  foreignKey: "parent_id",
  as: "children",
});

Account.belongsTo(Account, {
  foreignKey: "parent_id",
  as: "parent",
});

// =========================
Allowance.belongsTo(Account, {
  foreignKey: "account_code",
  targetKey: "code",
  as: "account",
});

Account.hasMany(Allowance, {
  foreignKey: "account_code",
  sourceKey: "code",
  as: "allowances",
});
// // =====================
// // Departments (Self Relation)
// // =====================
// Department.hasMany(Department, {
//   foreignKey: "parent_id",
//   as: "children",
// });

// Department.belongsTo(Department, {
//   foreignKey: "parent_id",
//   as: "parent",
// });


// =====================
// Employee Relations
// =====================
Employee.hasMany(EmployeeDocument, {
  foreignKey: "employee_id",
  as: "documents",
});

EmployeeDocument.belongsTo(Employee, {
  foreignKey: "employee_id",
  // as: "employee_documents",
});

Employee.hasMany(EmployeeContact, {
  foreignKey: "employee_id",
  as: "relatives",
});

EmployeeContact.belongsTo(Employee, {
  foreignKey: "employee_id",
});

Employee.hasMany(EmployeeExperience, {
  foreignKey: "employee_id",
  as: "experiences",
});

EmployeeExperience.belongsTo(Employee, {
  foreignKey: "employee_id",
});


// =====================
// Contracts
// =====================
Employee.hasMany(EmployeeContract, {
  foreignKey: "employee_id",
  as: "contracts",
});

EmployeeContract.belongsTo(Employee, {
  foreignKey: "employee_id",
});

Department.hasMany(EmployeeContract, {
  foreignKey: "department_id",
});

EmployeeContract.belongsTo(Department, {
  foreignKey: "department_id",
});

Shift.hasMany(EmployeeContract, {
  foreignKey: "shift_id",
});

EmployeeContract.belongsTo(Shift, {
  foreignKey: "shift_id",
});

EmployeeContract.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

EmployeeContract.belongsTo(User, {
  foreignKey: "updated_by",
  as: "updater",
});

EmployeeContract.belongsTo(InsuranceRate, {
  foreignKey: "insurance_setting_id",
  as: "insuranceSetting",
});

EmployeeContract.hasMany(ContractAllowance, {
  foreignKey: "contract_id",
  as: "allowances",
});

ContractAllowance.belongsTo(EmployeeContract, {
  foreignKey: "contract_id",
});

Allowance.hasMany(ContractAllowance, {
  foreignKey: "allowance_type_id",
});

ContractAllowance.belongsTo(Allowance, {
  foreignKey: "allowance_type_id",
});

EmployeeContract.hasMany(EmployeeLeaveBalance, {
  foreignKey: "contract_id",
  as: "leaveBalances",
});

EmployeeLeaveBalance.belongsTo(EmployeeContract, {
  foreignKey: "contract_id",
});

LeaveType.hasMany(EmployeeLeaveBalance, {
  foreignKey: "leave_type_id",
});

EmployeeLeaveBalance.belongsTo(LeaveType, {
  foreignKey: "leave_type_id",
});


// =====================
// Payroll
// =====================
PayrollRun.hasMany(PayrollDetail, {
  foreignKey: "payroll_run_id",
  as: "details",
});

PayrollDetail.belongsTo(PayrollRun, {
  foreignKey: "payroll_run_id",
});

Employee.hasMany(PayrollDetail, {
  foreignKey: "employee_id",
});

PayrollDetail.belongsTo(Employee, {
  foreignKey: "employee_id",
});

PayrollRun.hasMany(JournalEntry, {
  foreignKey: "payroll_run_id",
  as: "entries",
});

JournalEntry.belongsTo(PayrollRun, {
  foreignKey: "payroll_run_id",
});

Department.hasMany(Employee, {
  foreignKey: "department_id",
});
Employee.belongsTo(Department, {
  foreignKey: "department_id",
});

// =====================
// Journal Accounting
// =====================
JournalEntry.hasMany(JournalLine, {
  foreignKey: "journal_entry_id",
  as: "lines",
});

JournalLine.belongsTo(JournalEntry, {
  foreignKey: "journal_entry_id",
});

JournalLine.belongsTo(Account, {
  foreignKey: "account_id",
  as: "account",
});

Account.hasMany(JournalLine, {
  foreignKey: "account_id",
  as: "journalLines",
});

Employee.hasMany(JournalLine, {
  foreignKey: "employee_id",
  as: "journalLines",
});

JournalLine.belongsTo(Employee, {
  foreignKey: "employee_id",
});


// // =====================
// // Leave & Attendance
// // =====================
Employee.hasMany(LeaveRequest, {
  foreignKey: "employee_id",
});

LeaveRequest.belongsTo(Employee, {
  foreignKey: "employee_id",
});

LeaveType.hasMany(LeaveRequest, {
  foreignKey: "leave_type_id",
});

LeaveRequest.belongsTo(LeaveType, {
  foreignKey: "leave_type_id",
});

Employee.hasMany(EmployeeAbsence, {
  foreignKey: "employee_id",
});

EmployeeAbsence.belongsTo(Employee, {
  foreignKey: "employee_id",
});

AbsenceType.hasMany(EmployeeAbsence, {
  foreignKey: "absence_type_id",
});

EmployeeAbsence.belongsTo(AbsenceType, {
  foreignKey: "absence_type_id",
});

Employee.hasMany(Attendance, {
  foreignKey: "employee_id",
});

Attendance.belongsTo(Employee, {
  foreignKey: "employee_id",
});

Department.hasMany(Attendance, {
  foreignKey: "department_id",
});

Attendance.belongsTo(Department, {
  foreignKey: "department_id",
});


// // =====================
// // Bonuses / Loans
// // =====================
Employee.hasMany(EmployeeAdvanceLoan, {
  foreignKey: "employee_id",
});

EmployeeAdvanceLoan.belongsTo(Employee, {
  foreignKey: "employee_id",
});

User.hasMany(EmployeeAdvanceLoan, {
  foreignKey: "approved_by",
  as: "approvedLoans",
});

EmployeeAdvanceLoan.belongsTo(User, {
  foreignKey: "approved_by",
  as: "approver",
});

Employee.hasMany(EmployeeBonus, {
  foreignKey: "employee_id",
});

EmployeeBonus.belongsTo(Employee, {
  foreignKey: "employee_id",
});

BonusType.hasMany(EmployeeBonus, {
  foreignKey: "bonus_type_id",
});

EmployeeBonus.belongsTo(BonusType, {
  foreignKey: "bonus_type_id",
});

User.hasMany(EmployeeBonus, {
  foreignKey: "approved_by",
  as: "approvedBonuses",
});

EmployeeBonus.belongsTo(User, {
  foreignKey: "approved_by",
  as: "approver",
});


// =====================
// CustodyTransfer
// =====================
Employee.hasMany(CustodyTransfer, {
  foreignKey: "from_employee_id",
  as: "givenCustodies",
});

Employee.hasMany(CustodyTransfer, {
  foreignKey: "to_employee_id",
  as: "receivedCustodies",
});

CustodyTransfer.belongsTo(Employee, {
  foreignKey: "from_employee_id",
  as: "fromEmployee",
});

CustodyTransfer.belongsTo(Employee, {
  foreignKey: "to_employee_id",
  as: "toEmployee",
});

// =====================
// Accounting Periods
// =====================
User.hasMany(AccountingPeriod, {
  foreignKey: "created_by",
  as: "createdAccountingPeriods",
});

AccountingPeriod.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

User.hasMany(AccountingPeriod, {
  foreignKey: "closed_by",
  as: "closedAccountingPeriods",
});

AccountingPeriod.belongsTo(User, {
  foreignKey: "closed_by",
  as: "closer",
});

// =====================
// Audit Logs
// =====================
User.hasMany(AuditLog, {
  foreignKey: "user_id",
  as: "auditLogs",
});

AuditLog.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});


// // =====================
// // Insurance Settings (no relations needed usually)
// // =====================