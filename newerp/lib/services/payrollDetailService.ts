import api from "@/lib/api";
import type { ListParams, ListResponse } from "./types";
import type { PayrollDetail, PayrollRun } from "./entities";
import { normalizeServiceError, unwrapResponseData } from "./serviceUtils";

type ReportEmployee = {
  employee_id: number;
  full_name?: string;
  code?: string;
  base_salary?: number;
  overtime_pay?: number;
  total_allowances?: number;
  total_bonuses?: number;
  total_earnings?: number;
  insurance_employee?: number;
  insurance_company?: number;
  loan_deduction?: number;
  absence_days?: number;
  absence_deduction?: number;
  total_deductions?: number;
  net_salary?: number;
};

type PayrollRunReport = {
  payroll_run?: PayrollRun;
  summary?: Record<string, number>;
  employees?: ReportEmployee[];
};

type EmployeePayrollReport = {
  payroll_run?: PayrollRun;
  employee?: ReportEmployee;
};

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mapReportEmployeeToDetail(
  emp: ReportEmployee,
  payrollRunId: number
): PayrollDetail {
  return {
    id: emp.employee_id,
    employee_id: emp.employee_id,
    payroll_run_id: payrollRunId,
    base_salary: num(emp.base_salary),
    overtime_pay: num(emp.overtime_pay),
    total_bonuses: num(emp.total_bonuses),
    total_earnings: num(emp.total_earnings),
    insurance_employee: num(emp.insurance_employee),
    insurance_company: num(emp.insurance_company),
    loan_deduction: num(emp.loan_deduction),
    absence_days: num(emp.absence_days),
    absence_deduction: num(emp.absence_deduction),
    total_deductions: num(emp.total_deductions),
    net_salary: num(emp.net_salary),
    Employee: {
      id: emp.employee_id,
      full_name: emp.full_name ?? "—",
      code: emp.code ?? "",
    },
  };
}

export type PayrollRunDetailsResponse = ListResponse<PayrollDetail> & {
  payroll_run?: PayrollRun;
  summary?: Record<string, number>;
};

const payrollDetailService = {
  getByRunId: async (
    payrollRunId: number | string,
    params: ListParams = {}
  ): Promise<PayrollRunDetailsResponse> => {
    try {
      const r = await api.get(`/payrollDetail/${payrollRunId}`, { params });
      const report = unwrapResponseData<PayrollRunReport>(r.data);
      const runId = Number(payrollRunId);
      const employees = Array.isArray(report.employees) ? report.employees : [];
      const data = employees.map((emp) => mapReportEmployeeToDetail(emp, runId));

      return {
        data,
        meta: {
          pagination: {
            page: 1,
            limit: data.length || 1,
            totalItems: data.length,
            totalPages: 1,
          },
        },
        payroll_run: report.payroll_run,
        summary: report.summary,
      };
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب تفاصيل دورة الرواتب");
    }
  },

  getByEmployeeAndRun: async (
    employeeId: number | string,
    payrollRunId: number | string
  ): Promise<PayrollDetail> => {
    try {
      const r = await api.get(`/payrollDetail/${employeeId}/${payrollRunId}`);
      const report = unwrapResponseData<EmployeePayrollReport>(r.data);
      const emp = report.employee;

      if (!emp) {
        throw { message: "Payroll detail not found for this employee" };
      }

      return mapReportEmployeeToDetail(emp, Number(payrollRunId));
    } catch (error) {
      normalizeServiceError(error, "حدث خطأ في جلب مسير الموظف");
    }
  },
};

export default payrollDetailService;
export { payrollDetailService };
