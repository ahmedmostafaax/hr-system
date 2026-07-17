import { Request, Response, NextFunction } from "express";
import EmployeeAdvanceLoan from "../../../database/Models/employee_loans";
import Employee from "../../../database/Models/employee";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { sequelize } from "../../../database/db.connection";
import { erpEmitter, EVENTS } from "../../events/eventEmitter";
import { PayrollAccumulatorService } from "../payroll_summary/payroll_accumulator.service";
import { calculateLoanMonthlyDeduction } from "../payroll_summary/payroll_source.service";
import { assertPeriodOpenForDate } from "../../utils/periodGuard";
import { auditFromRequest, toAuditSnapshot } from "../../service/audit/auditHelpers";
import { assertCanChangeApprovalStatus } from "../../utils/approvalGuard";
import { AppError } from "../../utils/appError";
import {
  parsePeriod,
  stripPeriodKeys,
  dateFieldBetween,
  mergePeriodWhere,
} from "../../utils/periodFilter";

function loanMonthlyDeductionForRecord(loan: {
  type: "advance" | "loan";
  amount: number | string;
  paid_amount: number | string;
  installment_amount?: number | string | null;
  grant_date: Date | string;
}): { monthlyDeduction: number; month: number; year: number } {
  const grantDate = new Date(loan.grant_date);
  const monthlyDeduction = calculateLoanMonthlyDeduction({
    type: loan.type,
    amount: loan.amount,
    paid_amount: loan.paid_amount ?? 0,
    installment_amount: loan.installment_amount,
  });
  return {
    monthlyDeduction,
    month: grantDate.getMonth() + 1,
    year: grantDate.getFullYear(),
  };
}

class EmployeeLoansLogic {
  async createLoan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      let { employee_id, type, amount, grant_date, installment_amount, paid_amount, status } = req.body;
      const user = (req as any).user;

      if (user?.employee_id) {
        employee_id = user.employee_id;
        status = "active";
        paid_amount = 0;
      } else if (!employee_id) {
        return next(new AppError("employee_id is required", 400));
      }

      await assertPeriodOpenForDate(grant_date);
      await checkItemFound.checkItem(employee_id, Employee);

      const loan = await EmployeeAdvanceLoan.create({
        employee_id,
        type,
        amount,
        grant_date,
        installment_amount,
        paid_amount: paid_amount || 0,
        status: status || "active",
        approval_status: "pending",
      });

      await auditFromRequest(req, {
        action: "CREATE",
        entityType: "EmployeeLoan",
        entityId: loan.id,
        newValues: toAuditSnapshot(loan),
      });

      res.status(201).json(
        formatResponse(201, "Employee loan/advance created successfully", loan)
      );
    } catch (error) {
      next(error);
    }
  }

  async allLoans(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = (req as any).user;
      const period = parsePeriod(req.query as Record<string, unknown>);
      const scopedQuery = stripPeriodKeys({ ...req.query } as Record<string, unknown>);

      if (user?.role === "EMPLOYEE" || user?.employee_id) {
        if (!user.employee_id) {
          return next(new AppError("No employee profile linked to this account", 403));
        }
        scopedQuery.employee_id = String(user.employee_id);
      }

      const features = new ApiFeatures(scopedQuery)
        .filter()
        .search(["type", "status", "approval_status", "$Employee.full_name$", "$Employee.code$"])
        .sort()
        .fields()
        .pagination();

      mergePeriodWhere(
        features,
        period,
        period ? dateFieldBetween("grant_date", period) : null
      );

      const { rows: loans, count: totalItems } =
        await EmployeeAdvanceLoan.findAndCountAll({
          ...features.queryOptions,
          subQuery: false,
          include: [{ model: Employee, attributes: ["id", "full_name", "code"] }]
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      res.status(200).json(
        formatResponse(200, "success get all loans", loans, {
          page: features.pageNumber,
          limit: features.pageLimit,
          totalItems,
          totalPages,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async singleLoan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, EmployeeAdvanceLoan);

      const loan = await EmployeeAdvanceLoan.findOne({
        where: { id, is_deleted: false },
        include: [{ model: Employee, attributes: ["id", "full_name", "code"] }]
      });

      const user = (req as any).user;
      if (user?.employee_id && loan?.employee_id !== user.employee_id) {
        return next(new AppError("You can only view your own loan requests", 403));
      }

      res.status(200).json(
        formatResponse(200, "success get loan", loan)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateLoan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const transaction = await sequelize.transaction();
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const {
        employee_id,
        type,
        amount,
        grant_date,
        installment_amount,
        paid_amount,
        status,
        approval_status,
        rejection_reason,
        is_deleted,
      } = req.body;

      const loan: any = await checkItemFound.checkItem(
        id,
        EmployeeAdvanceLoan,
        { transaction }
      );

      const oldSnapshot = toAuditSnapshot(loan);
      const oldApprovalStatus = loan.approval_status;
      const oldAmount = parseFloat(String(loan.amount));

      await assertPeriodOpenForDate(loan.grant_date);
      if (grant_date !== undefined) {
        await assertPeriodOpenForDate(grant_date);
      }

      if (employee_id && employee_id !== loan.employee_id) {
        await checkItemFound.checkItem(employee_id, Employee);
        loan.employee_id = employee_id;
      }

      loan.type = type ?? loan.type;
      loan.amount = amount ?? loan.amount;
      loan.grant_date = grant_date ?? loan.grant_date;
      if (installment_amount !== undefined) loan.installment_amount = installment_amount;
      if (paid_amount !== undefined) loan.paid_amount = paid_amount;
      loan.status = status ?? loan.status;
      if (is_deleted !== undefined) loan.is_deleted = is_deleted;

      let approvalChanged = false;
      if (approval_status !== undefined && approval_status !== oldApprovalStatus) {
        assertCanChangeApprovalStatus(req);
        approvalChanged = true;

        if (approval_status === "approved") {
          loan.approved_by = (req as any).user.id;
          loan.approved_at = new Date();
          loan.rejection_reason = null;
        } else if (approval_status === "rejected") {
          loan.rejection_reason =
            rejection_reason !== undefined ? rejection_reason || null : loan.rejection_reason;
          loan.approved_by = null;
          loan.approved_at = null;
        }

        loan.approval_status = approval_status;
      } else if (rejection_reason !== undefined && loan.approval_status === "rejected") {
        assertCanChangeApprovalStatus(req);
        loan.rejection_reason = rejection_reason || null;
      }

      await loan.save({ transaction });

      if (approvalChanged && approval_status === "approved" && oldApprovalStatus !== "approved") {
        const { monthlyDeduction, month, year } = loanMonthlyDeductionForRecord(loan);
        if (monthlyDeduction > 0) {
          await PayrollAccumulatorService.incrementLoanDeduction(
            loan.employee_id,
            month,
            year,
            monthlyDeduction,
            transaction
          );
        }
      }

      if (approvalChanged && approval_status === "rejected" && oldApprovalStatus === "approved") {
        const { monthlyDeduction, month, year } = loanMonthlyDeductionForRecord(loan);
        if (monthlyDeduction > 0) {
          await PayrollAccumulatorService.incrementLoanDeduction(
            loan.employee_id,
            month,
            year,
            -monthlyDeduction,
            transaction
          );
        }
      }

      await transaction.commit();

      if (approvalChanged && approval_status === "approved" && oldApprovalStatus !== "approved") {
        erpEmitter.emit(EVENTS.LOAN_CREATED, loan.id, req.user);
        erpEmitter.emit(EVENTS.LOAN_APPROVED, {
          employeeId: loan.employee_id,
          amount: parseFloat(String(loan.amount)),
          type: loan.type,
        });
      }

      if (approvalChanged && approval_status === "rejected" && oldApprovalStatus === "approved") {
        erpEmitter.emit(
          EVENTS.LOAN_DELETED,
          {
            loanId: loan.id,
            originalAmount: parseFloat(String(loan.amount)),
            employeeId: loan.employee_id,
            grantDate: loan.grant_date,
          },
          req.user
        );
      }

      const newAmount = parseFloat(String(loan.amount));
      if (
        amount !== undefined &&
        oldAmount !== newAmount &&
        loan.approval_status === "approved"
      ) {
        erpEmitter.emit(
          EVENTS.LOAN_UPDATED,
          {
            loanId: loan.id,
            oldAmount,
            newAmount,
            employeeId: loan.employee_id,
          },
          req.user
        );
      }

      let auditAction: "UPDATE" | "APPROVE" | "REJECT" = "UPDATE";
      if (approvalChanged) {
        if (approval_status === "approved") auditAction = "APPROVE";
        else if (approval_status === "rejected") auditAction = "REJECT";
      }

      await auditFromRequest(req, {
        action: auditAction,
        entityType: "EmployeeLoan",
        entityId: loan.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(loan),
      });

      res.status(200).json(
        formatResponse(
          200,
          "Employee loan updated successfully",
          loan
        )
      );
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async deleteLoan(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const transaction = await sequelize.transaction();
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const loan: any = await checkItemFound.checkItem(
        id,
        EmployeeAdvanceLoan,
        { transaction }
      );

      const oldSnapshot = toAuditSnapshot(loan);

      await assertPeriodOpenForDate(loan.grant_date);

      const wasDeleted = loan.is_deleted;
      const wasApproved = loan.approval_status === "approved";

      loan.is_deleted = !loan.is_deleted;
      await loan.save({ transaction });

      if (loan.is_deleted && !wasDeleted && wasApproved) {
        const { monthlyDeduction, month, year } = loanMonthlyDeductionForRecord(loan);
        if (monthlyDeduction > 0) {
          await PayrollAccumulatorService.incrementLoanDeduction(
            loan.employee_id,
            month,
            year,
            -monthlyDeduction,
            transaction
          );
        }
      }

      await transaction.commit();

      if (loan.is_deleted && !wasDeleted && wasApproved) {
        erpEmitter.emit(
          EVENTS.LOAN_DELETED,
          {
            loanId: loan.id,
            originalAmount: parseFloat(String(loan.amount)),
            employeeId: loan.employee_id,
            grantDate: loan.grant_date,
          },
          req.user
        );
      }

      await auditFromRequest(req, {
        action: "DELETE",
        entityType: "EmployeeLoan",
        entityId: loan.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(loan),
      });

      res.status(200).json(
        formatResponse(
          200,
          loan.is_deleted ? "Employee loan deleted successfully" : "Employee loan restored successfully",
          loan
        )
      );
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
}

export const employeeLoansLogic = new EmployeeLoansLogic();
