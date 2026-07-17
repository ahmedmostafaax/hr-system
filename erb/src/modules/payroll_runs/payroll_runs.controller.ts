import { Request, Response, NextFunction } from "express";
import { Op, Sequelize } from "sequelize";
import PayrollRun from "../../../database/Models/payroll_runs";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { sequelize } from "../../../database/db.connection";
import { AppError } from "../../utils/appError";
import { payrollDetailsService } from "../payroll_details/payroll_details.services";
import { erpEmitter, EVENTS } from "../../events/eventEmitter";
import { assertPeriodOpen } from "../../utils/periodGuard";
import { auditFromRequest, toAuditSnapshot } from "../../service/audit/auditHelpers";
import { parsePayrollKeyword } from "../../utils/payrollSearchKeyword";
import {
  parsePeriod,
  stripPeriodKeys,
  mergePeriodWhere,
  payrollRunPeriodWhere,
} from "../../utils/periodFilter";

class PayrollRunsLogic {
  async createPayrollRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { month, year, auto_process = true } = req.body;

      await assertPeriodOpen(month, year);

      if (auto_process) {
        const { payrollRun, processResult } =
          await payrollDetailsService.createAndProcessPayrollWithAccounting(
            month,
            year,
            req.user?.id ?? null
          );

        res.status(201).json(
          formatResponse(
            201,
            "Payroll run created and processed successfully (all employees calculated)",
            { payrollRun, processResult }
          )
        );

        await auditFromRequest(req, {
          action: "CREATE",
          entityType: "PayrollRun",
          entityId: payrollRun.id,
          newValues: toAuditSnapshot(payrollRun),
        });
        return;
      }

      const payrollRun = await PayrollRun.create({
        month,
        year,
        status: "draft",
        processed_by: req.user?.id || null,
      });

      res.status(201).json(
        formatResponse(201, "Payroll run created successfully", {
          payrollRun,
          processResult: null,
        })
      );

      await auditFromRequest(req, {
        action: "CREATE",
        entityType: "PayrollRun",
        entityId: payrollRun.id,
        newValues: toAuditSnapshot(payrollRun),
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return next(error);
      }
      next(new AppError(`Failed to process payroll: ${error.message}`, 500));
    }
  }

  async allPayrollRuns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawQuery = { ...req.query } as Record<string, unknown>;
      const keyword =
        typeof rawQuery.keyword === "string" ? rawQuery.keyword.trim() : "";
      delete rawQuery.keyword;

      let keywordConsumed = false;
      if (keyword) {
        const parsed = parsePayrollKeyword(keyword);
        if (parsed.month !== undefined && rawQuery.month === undefined) {
          rawQuery.month = String(parsed.month);
        }
        if (parsed.year !== undefined && rawQuery.year === undefined) {
          rawQuery.year = String(parsed.year);
        }
        if (parsed.status !== undefined && rawQuery.status === undefined) {
          rawQuery.status = parsed.status;
        }
        keywordConsumed = parsed.consumed;
      }

      const period = parsePeriod(rawQuery);
      const queryForFeatures = stripPeriodKeys(rawQuery);

      const features = new ApiFeatures(queryForFeatures)
        .filter()
        .sort()
        .fields()
        .pagination();

      mergePeriodWhere(
        features,
        period,
        period ? payrollRunPeriodWhere(period) : null
      );

      if (keyword && !keywordConsumed) {
        features.queryOptions.where = {
          ...features.queryOptions.where,
          [Op.or]: [
            Sequelize.where(Sequelize.cast(Sequelize.col("month"), "varchar"), {
              [Op.iLike]: `%${keyword}%`,
            }),
            Sequelize.where(Sequelize.cast(Sequelize.col("year"), "varchar"), {
              [Op.iLike]: `%${keyword}%`,
            }),
            Sequelize.where(Sequelize.cast(Sequelize.col("status"), "varchar"), {
              [Op.iLike]: `%${keyword}%`,
            }),
          ],
        };
      }

      const { rows: payrollRuns, count: totalItems } =
        await PayrollRun.findAndCountAll({
          ...features.queryOptions,
        });

      const totalPages = Math.ceil(totalItems / features.pageLimit);

      res.status(200).json(
        formatResponse(200, "success get all payroll runs", payrollRuns, {
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

  async singlePayrollRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, PayrollRun);

      const payrollRun = await PayrollRun.findOne({
        where: { id, is_deleted: false },
      });

      res.status(200).json(
        formatResponse(200, "success get payroll run", payrollRun)
      );
    } catch (error) {
      next(error);
    }
  }

  async deletePayrollRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const payrollRun: any = await checkItemFound.checkItem(id, PayrollRun);

      const oldSnapshot = toAuditSnapshot(payrollRun);

      await assertPeriodOpen(payrollRun.month, payrollRun.year);

      payrollRun.is_deleted = !payrollRun.is_deleted;
      await payrollRun.save();

      // Trigger reversal entry if deleted
      if (payrollRun.is_deleted) {
        erpEmitter.emit(EVENTS.PAYROLL_DELETED, payrollRun.id, req.user);
      }

      await auditFromRequest(req, {
        action: "DELETE",
        entityType: "PayrollRun",
        entityId: payrollRun.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(payrollRun),
      });

      res.status(200).json(
        formatResponse(
          200,
          payrollRun.is_deleted
            ? "Payroll run deleted successfully"
            : "Payroll run restored successfully",
          payrollRun
        )
      );
    } catch (error) {
      next(error);
    }
  }

  updatePayrollRun = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { month, year, status, is_deleted } = req.body;

      const payrollRun: any = await checkItemFound.checkItem(id, PayrollRun);

      const oldSnapshot = toAuditSnapshot(payrollRun);

      await assertPeriodOpen(payrollRun.month, payrollRun.year);

      const previousStatus = payrollRun.status;

      // Lock Data: Prevent modifying month/year if payroll is already confirmed or paid
      if ((previousStatus === "confirmed" || previousStatus === "paid") && (month !== undefined || year !== undefined)) {
        throw new AppError("Cannot modify month or year of a confirmed or paid payroll run.", 403);
      }

      if (month !== undefined) payrollRun.month = month;
      if (year !== undefined) payrollRun.year = year;

      if (month !== undefined || year !== undefined) {
        await assertPeriodOpen(payrollRun.month, payrollRun.year);
      }

      if (is_deleted !== undefined) {
        const wasDeleted = payrollRun.is_deleted;
        payrollRun.is_deleted = is_deleted;
        if (is_deleted === true && !wasDeleted) {
          erpEmitter.emit(EVENTS.PAYROLL_DELETED, payrollRun.id, req.user);
        }
      }

      const confirming =
        status !== undefined &&
        status !== previousStatus &&
        status === "confirmed" &&
        previousStatus === "draft";

      if (status !== undefined) {
        if (previousStatus === "draft" && status === "paid") {
          throw new AppError("Payroll must be confirmed before it can be paid.", 400);
        }

        if (!confirming) {
          payrollRun.status = status;

          if (status === "paid") {
            payrollRun.processed_at = new Date();
            const user = req.user;
            if (user) payrollRun.processed_by = user.id;
          }
        }
      }

      await payrollRun.save();

      if (confirming) {
        await payrollDetailsService.confirmPayrollRun(
          payrollRun.id,
          req.user?.id ?? null
        );
        await payrollRun.reload();
      } else if (
        status !== undefined &&
        status !== previousStatus &&
        status === "paid"
      ) {
        erpEmitter.emit(EVENTS.PAYROLL_PAID, payrollRun.id, req.user);
      }

      await auditFromRequest(req, {
        action: "UPDATE",
        entityType: "PayrollRun",
        entityId: payrollRun.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(payrollRun),
      });

      res.status(200).json(
        formatResponse(200, "Payroll run updated successfully", payrollRun)
      );

    } catch (error) {
      next(error);
    }
  };
  async recalculatePayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const payrollRun: any = await checkItemFound.checkItem(id, PayrollRun);

      if (payrollRun.status !== "draft") {
        throw new AppError("Can only recalculate payroll in draft status", 400);
      }

      await assertPeriodOpen(payrollRun.month, payrollRun.year);

      const processResult = await payrollDetailsService.recalculateForAllEmployees(payrollRun.id);

      res.status(200).json(
        formatResponse(200, "Payroll recalculated successfully", {
          payrollRun,
          processResult,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const payrollRunsLogic = new PayrollRunsLogic();