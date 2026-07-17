import { Request, Response, NextFunction } from "express";
import PayrollDetail from "../../../database/Models/payroll_details";
import Employee from "../../../database/Models/employee";
import PayrollRun from "../../../database/Models/payroll_runs";
import { AppError } from "../../utils/appError";
import { formatResponse } from "../../utils/responseFormatter";
import { payrollDetailsService } from "./payroll_details.services";



class PayrollDetailsController {

  async getEmployeePayroll(req: Request, res: Response, next: NextFunction) {
    try {
      const { employee_id, payroll_run_id } = req.params;

      if (!employee_id || isNaN(parseInt(employee_id as any))) {
        throw new AppError("employee_id is required and must be a valid number", 400);
      }

      if (!payroll_run_id || isNaN(parseInt(payroll_run_id as any))) {
        throw new AppError("payroll_run_id is required and must be a valid number", 400);
      }

      const report = await payrollDetailsService.buildEmployeePayroll(parseInt(employee_id as any), parseInt(payroll_run_id as any));

      return res.status(200).json(
        formatResponse(
          200,
          `تم جلب راتب ${report.employee.full_name} بنجاح`,
          report
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async getPayrollByRunId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id as any))) {
        throw new AppError("id is required and must be a valid number", 400);
      }

      const report = await payrollDetailsService.buildReport(parseInt(id as any));

      return res.status(200).json(
        formatResponse(
          200,
          `تم جلب رواتب ${report.summary.total_employees} موظف بنجاح`,
          report
        )
      );
    } catch (error) {
      next(error);
    }
  }

}

export const payrollDetailsController = new PayrollDetailsController();



