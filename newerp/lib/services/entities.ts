/** Entity types extracted from erb/openapi.yaml */

export type UserRole = "SUPER-ADMIN" | "ADMIN" | "HR" | "ACCOUNTING" | "EMPLOYEE";

export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  employee_id?: number;
  isActive: boolean;
  employee?: {
    id: number;
    code: string;
    full_name: string;
    email?: string;
    phone_number?: string;
  };
  isBlock: boolean;
  is_deleted: boolean;
  force_reset_password?: boolean;
}

export interface Department {
  id: number;
  name: string;
  parent_id: number | null;
  type: string;
  isActive: boolean;
  is_deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  parent?: Pick<Department, "id" | "name">;
}

export type ShiftType = "morning" | "evening" | "between";
export type WorkDay = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

export interface Shift {
  id: number;
  name: string;
  type: ShiftType;
  work_days: WorkDay[];
  start_time: string;
  end_time: string;
  grace_minutes: number;
  deduct_grace: boolean;
  salary_basis_days: number;
  is_deleted: boolean;
}

export interface LeaveType {
  id: number;
  name: string;
  annual_balance: number;
  affects_deduction: boolean;
  is_deleted: boolean;
  /** @deprecated use annual_balance */
  default_days?: number;
  /** @deprecated use !affects_deduction */
  is_paid?: boolean;
}

export interface OfficialHoliday {
  id: number;
  name: string;
  start_date: string;
  days_count: number;
  is_deleted?: boolean;
}

export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export interface Account {
  id: number;
  name: string;
  code: string;
  type: AccountType;
  parent_id: number | null;
  description?: string | null;
  currency: string;
  is_deleted?: boolean;
}

export interface AllowanceType {
  id: number;
  name: string;
  default_amount: number;
  is_part_of_salary: boolean;
  account_code: string;
  is_deleted?: boolean;
}

export interface AbsenceType {
  id: number;
  name: string;
  deduct_days: number;
  requires_permission: boolean;
  is_deleted?: boolean;
}

export type BonusPaymentType = "cash" | "deferred";

export interface BonusType {
  id: number;
  name: string;
  payment_type: BonusPaymentType;
  default_amount: number | null;
  editable_amount: boolean;
  is_deleted?: boolean;
}

export interface InsuranceSetting {
  id: number;
  employee_rate: number;
  company_rate: number;
  effective_from: string;
  is_deleted?: boolean;
}

export type Gender = "M" | "F";
export type MaritalStatus = "single" | "married" | "divorced" | "widowed";

export interface Employee {
  id: number;
  code: string;
  full_name: string;
  birth_date: string;
  gender: Gender;
  national_id: string;
  phone_number: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  marital_status: MaritalStatus;
  qualification?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  department_id?: number | null;
  age?: number | null;
  Department?: { id: number; name: string } | null;
  is_active: boolean;
  is_deleted: boolean;
  relatives?: EmployeeRelative[];
  experiences?: EmployeeExperience[];
  documents?: EmployeeDocument[];
  contracts?: (Contract & {
    Department?: Pick<Department, "id" | "name">;
    Shift?: Pick<Shift, "id" | "name" | "start_time" | "end_time">;
  })[];
  loans?: EmployeeLoan[];
  bonuses?: EmployeeBonus[];
  absences?: Absence[];
  leave_requests?: LeaveRequest[];
  attendances?: Attendance[];
}

export interface EmployeeDocument {
  id: number;
  employee_id: number;
  doc_name: string;
  file_path: string;
  uploaded_at?: string;
  is_deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  Employee?: Pick<Employee, "id" | "full_name" | "code">;
}

export interface EmployeeRelative {
  id: number;
  employee_id: number;
  relation: string;
  name: string;
  phone: string;
  is_deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  Employee?: Pick<Employee, "id" | "full_name" | "code">;
}

export interface EmployeeExperience {
  id: number;
  employee_id: number;
  company_name: string;
  position?: string;
  from_date: string;
  to_date?: string | null;
  is_deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  Employee?: Pick<Employee, "id" | "full_name" | "code">;
}

export type ContractStatus = "active" | "suspended" | "resigned" | "dismissed";

export interface Contract {
  id: number;
  employee_id: number;
  department_id: number;
  shift_id: number;
  job_title: string;
  start_date: string;
  duration_years?: number | null;
  end_date?: string | null;
  base_salary: number;
  status: ContractStatus;
  overtime_enabled: boolean;
  notes?: string | null;
  attachment?: string | null;
  insurance_setting_id?: number | null;
  is_active: boolean;
  is_deleted?: boolean;
  employee?: Pick<Employee, "id" | "full_name" | "code">;
  department?: Pick<Department, "id" | "name">;
  shift?: Pick<Shift, "id" | "name">;
}

export interface ContractAllowance {
  id: number;
  contract_id: number;
  allowance_type_id: number;
  amount: number;
  is_deleted: boolean;
  EmployeeContract?: {
    job_title?: string;
    Employee?: Pick<Employee, "id" | "full_name" | "code">;
  };
  Allowance?: Pick<AllowanceType, "id" | "name">;
}

export interface ContractLeave {
  id: number;
  contract_id: number;
  leave_type_id: number;
  used_days: number;
  year: number;
  is_deleted?: boolean;
  LeaveType?: Pick<LeaveType, "id" | "name">;
  EmployeeContract?: {
    id?: number;
    job_title?: string;
    Employee?: Pick<Employee, "id" | "full_name" | "code">;
  };
}

export type CustodyTransferType = "handover" | "receive" | "transfer";

export interface Custody {
  id: number;
  from_employee_id: number | null;
  to_employee_id: number;
  item_name: string;
  transfer_type: CustodyTransferType;
  transfer_date: string;
  notes?: string | null;
  is_deleted: boolean;
  fromEmployee?: Pick<Employee, "id" | "full_name" | "code">;
  toEmployee?: Pick<Employee, "id" | "full_name" | "code">;
}

export type LoanType = "advance" | "loan";
export type LoanStatus = "active" | "settled";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface EmployeeLoan {
  id: number;
  employee_id: number;
  type: LoanType;
  amount: number;
  grant_date: string;
  installment_amount?: number | null;
  paid_amount: number;
  status: LoanStatus;
  approval_status: ApprovalStatus;
  approved_by?: number | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  is_deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  employee?: Pick<Employee, "id" | "full_name" | "code">;
  Employee?: Pick<Employee, "id" | "full_name" | "code">;
}

export interface EmployeeBonus {
  id: number;
  employee_id: number;
  bonus_type_id: number;
  amount: number;
  grant_date: string;
  is_paid: boolean;
  payment_month?: number | null;
  payment_year?: number | null;
  approval_status: ApprovalStatus;
  approved_by?: number | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  is_deleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  employee?: Pick<Employee, "id" | "full_name" | "code">;
  Employee?: Pick<Employee, "id" | "full_name" | "code">;
  bonus_type?: Pick<BonusType, "id" | "name">;
  BonusType?: Pick<BonusType, "id" | "name" | "payment_type" | "default_amount">;
}

export interface Absence {
  id: number;
  employee_id: number;
  absence_type_id: number;
  absence_date: string;
  deduction_days: number;
  notes?: string | null;
  is_deleted: boolean;
  Employee?: Pick<Employee, "id" | "full_name" | "code">;
  AbsenceType?: Pick<AbsenceType, "id" | "name">;
}

export type LeaveRequestStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  days_count: number;
  status: LeaveRequestStatus;
  reason?: string | null;
  is_deleted: boolean;
  employee?: Pick<Employee, "id" | "full_name" | "code">;
  Employee?: Pick<Employee, "id" | "full_name" | "code">;
  leave_type?: Pick<LeaveType, "id" | "name">;
  LeaveType?: Pick<LeaveType, "id" | "name">;
}

export interface Attendance {
  id: number;
  employee_id: number;
  work_date: string;
  check_in?: string | null;
  check_out?: string | null;
  late_hours: number;
  overtime_hours: number;
  notes?: string | null;
  is_deleted: boolean;
  Employee?: Pick<Employee, "id" | "full_name" | "code">;
}

export type PayrollRunStatus = "draft" | "confirmed" | "paid";

export interface PayrollRun {
  id: number;
  month: number;
  year: number;
  status: PayrollRunStatus;
  processed_at?: string | null;
  processed_by?: number | null;
  is_deleted: boolean;
}

export interface PayrollDetail {
  id: number;
  employee_id: number;
  payroll_run_id: number;
  base_salary: number;
  total_bonuses: number;
  overtime_pay: number;
  total_earnings: number;
  insurance_employee: number;
  insurance_company: number;
  loan_deduction: number;
  absence_days: number;
  absence_deduction: number;
  total_deductions: number;
  net_salary: number;
  Employee?: Pick<Employee, "full_name" | "code" | "id">;
  employee?: Pick<Employee, "full_name" | "code" | "id">;
}

export type JournalEntryStatus = "draft" | "posted" | "cancelled";

export interface JournalLine {
  id: number;
  journal_entry_id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  description?: string | null;
  employee_id?: number | null;
  cost_center_id?: number | null;
}

export interface JournalEntry {
  id: number;
  entry_type: string;
  description: string;
  payroll_run_id?: number | null;
  reference_type?: string | null;
  reference_id?: number | null;
  posting_date: string;
  total_debit: number;
  total_credit: number;
  status: JournalEntryStatus;
  created_by?: number | null;
  is_deleted: boolean;
  lines?: JournalLine[];
}

export type AccountingPeriodStatus = "open" | "closed";

export interface AccountingPeriod {
  id: number;
  month: number;
  year: number;
  status: AccountingPeriodStatus;
  closed_by?: number | null;
  closed_at?: string | null;
  created_by?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT";

export interface AuditLog {
  id: number;
  user_id?: number | null;
  user_name?: string | null;
  user_role?: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id?: number | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
}
