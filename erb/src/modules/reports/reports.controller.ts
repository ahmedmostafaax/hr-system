import { Request, Response, NextFunction } from "express";
import { AppError } from "../../utils/appError";
import { formatResponse } from "../../utils/responseFormatter";
import { reportsService } from "./reports.services";

export class ReportsController {
  
  public getPayrollCostReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { payroll_run_id } = req.params;

      if (!payroll_run_id) {
        throw new AppError("payroll_run_id is required", 400);
      }

      const report = await reportsService.getPayrollCostReport(Number(payroll_run_id));
      
      return res.status(200).json(
        formatResponse(
          200,
          "Payroll cost report fetched successfully.",
          report
        )
      );
    } catch (error) {
      next(error);
    }
  };

  public getLoansReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reportsService.getLoansReport();
      
      return res.status(200).json(
        formatResponse(
          200,
          "Loans report fetched successfully.",
          report
        )
      );
    } catch (error) {
      next(error);
    }
  };

  public getDeductionsAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { payroll_run_id } =req.params;

      if (!payroll_run_id) {
        throw new AppError("payroll_run_id is required", 400);
      }

      const report = await reportsService.getDeductionsAnalysis(Number(payroll_run_id));
      
      return res.status(200).json(
        formatResponse(
          200,
          "Deductions analysis fetched successfully.",
          report
        )
      );
    } catch (error) {
      next(error);
    }
  };

  public getMonthlyKPIs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { payroll_run_id } = req.params;

      if (!payroll_run_id) {
        throw new AppError("payroll_run_id is required", 400);
      }

      const report = await reportsService.getMonthlyKPIs(Number(payroll_run_id));
      
      return res.status(200).json(
        formatResponse(
          200,
          "Monthly KPIs fetched successfully.",
          report
        )
      );
    } catch (error) {
      next(error);
    }
  };

  public getYearlyKPIs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reportsService.getYearlyKPIs();
      
      return res.status(200).json(
        formatResponse(
          200,
          "Yearly KPIs fetched successfully.",
          report
        )
      );
    } catch (error) {
      next(error);
    }
  };

  public getHrStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await reportsService.getHrStats();

      return res.status(200).json(
        formatResponse(200, "HR statistics fetched successfully.", report)
      );
    } catch (error) {
      next(error);
    }
  };
}

export const reportsController = new ReportsController();
