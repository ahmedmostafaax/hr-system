export interface EmployeeMySummary {
  period: { month: number; year: number; start: string; end: string };
  employee: {
    id: number;
    code: string;
    full_name: string;
    email?: string | null;
    phone_number?: string | null;
    national_id: string;
    birth_date?: string;
    age?: number | null;
    gender?: string;
    address?: string | null;
    marital_status?: string | null;
    qualification?: string | null;
    bank_name?: string | null;
    bank_account?: string | null;
    is_active?: boolean;
    department?: { id: number; name: string } | null;
  };
  contracts: Record<string, unknown>[];
  active_contract: Record<string, unknown> | null;
  relatives: Record<string, unknown>[];
  experiences: Record<string, unknown>[];
  leave_requests: Record<string, unknown>[];
  absences: Record<string, unknown>[];
  bonuses: Record<string, unknown>[];
  loans: Record<string, unknown>[];
  attendance: Record<string, unknown>[];
  salary: {
    payroll_run_id?: number | null;
    payroll_status?: string | null;
    base_salary: number;
    total_allowances: number;
    overtime_pay: number;
    total_bonuses: number;
    total_earnings: number;
    net_salary: number | null;
    deductions: {
      insurance: number;
      loan: number;
      absence: number;
      total: number;
    };
    note?: string;
  } | null;
}
