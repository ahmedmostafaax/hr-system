import { Request, Response, NextFunction } from "express";
import AccountingPeriod from "../../../database/Models/accounting_periods";
import User from "../../../database/Models/user.model";
import { ApiFeatures } from "../../utils/apiFeatures";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { AppError } from "../../utils/appError";
import { formatResponse } from "../../utils/responseFormatter";

class AccountingPeriodsController {
  async createAccountingPeriod(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { month, year, status = "open" } = req.body;
      const user = (req as any).user;

      const existing = await AccountingPeriod.findOne({
        where: { month, year, is_deleted: false },
      });

      if (existing) {
        return next(
          new AppError(
            `Accounting period for ${month}/${year} already exists`,
            400
          )
        );
      }

      const closedAt = status === "closed" ? new Date() : null;
      const closedBy = status === "closed" ? user?.id ?? null : null;

      const period = await AccountingPeriod.create({
        month,
        year,
        status,
        closed_by: closedBy,
        closed_at: closedAt,
        created_by: user?.id ?? null,
      });

      res
        .status(201)
        .json(
          formatResponse(201, "Accounting period created successfully", period)
        );
    } catch (error) {
      next(error);
    }
  }

  async getAllAccountingPeriods(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["status"])
        .sort()
        .fields()
        .pagination();

      const { rows: periods, count: totalItems } =
        await AccountingPeriod.findAndCountAll({
          ...features.queryOptions,
          where: {
            is_deleted: false,
            ...features.queryOptions.where,
          },
          include: [
            { model: User, as: "creator", attributes: ["id", "name"] },
            { model: User, as: "closer", attributes: ["id", "name"] },
          ],
        });

      const totalPages = Math.ceil(totalItems / features.pageLimit);

      res.status(200).json(
        formatResponse(200, "success get all accounting periods", periods, {
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

  async getSingleAccountingPeriod(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, AccountingPeriod);

      const period = await AccountingPeriod.findOne({
        where: { id, is_deleted: false },
        include: [
          { model: User, as: "creator", attributes: ["id", "name"] },
          { model: User, as: "closer", attributes: ["id", "name"] },
        ],
      });

      res
        .status(200)
        .json(
          formatResponse(200, "success get accounting period", period)
        );
    } catch (error) {
      next(error);
    }
  }

  async updateAccountingPeriod(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { status } = req.body;
      const user = (req as any).user;

      const period: any = await checkItemFound.checkItem(id, AccountingPeriod);

      if (status === period.status) {
        return next(
          new AppError(`Accounting period is already ${status}`, 400)
        );
      }

      period.status = status;

      if (status === "closed") {
        period.closed_by = user?.id ?? null;
        period.closed_at = new Date();
      } else {
        period.closed_by = null;
        period.closed_at = null;
      }

      await period.save();

      res
        .status(200)
        .json(
          formatResponse(200, "Accounting period updated successfully", period)
        );
    } catch (error) {
      next(error);
    }
  }
}

export const accountingPeriodsController = new AccountingPeriodsController();
