import { Request, Response, NextFunction } from "express";
import LeaveType from "../../../database/Models/leaveType.model";
import { ApiFeatures } from "../../utils/apiFeatures";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";

class LeaveTypes {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, annual_balance, affects_deduction } = req.body;

      const leaveType = await LeaveType.create({
        name,
        annual_balance,
        affects_deduction,
      });

      return res.status(201).json(
        formatResponse(
          201,
          "Leave type created successfully",
          leaveType
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async allLeaveType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["name"])
        .sort()
        .fields()
        .pagination();

      const { rows: leaveTypes, count: totalItems } =
        await LeaveType.findAndCountAll({
          ...features.queryOptions,
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      return res.status(200).json(
        formatResponse(
          200,
          "success get all leave types",
          leaveTypes,
          {
            page: features.pageNumber,
            limit: features.pageLimit,
            totalItems,
            totalPages,
          }
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async singleLeaveType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const leaveType = await checkItemFound.checkItem(
        id,
        LeaveType
      );

      return res.status(200).json(
        formatResponse(200, "success get leave type", leaveType)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateLeaveType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { name, annual_balance, affects_deduction } =
        req.body;

      const leaveType: any = await checkItemFound.checkItem(
        id,
        LeaveType
      );

      leaveType.name = name ?? leaveType.name;
      leaveType.annual_balance =
        annual_balance ?? leaveType.annual_balance;
      leaveType.affects_deduction =
        affects_deduction ?? leaveType.affects_deduction;

      await leaveType.save();

      return res.status(200).json(
        formatResponse(
          200,
          "Leave type updated successfully",
          leaveType
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteLeaveType(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const leaveType: any = await checkItemFound.checkItem(
        id,
        LeaveType
      );

      leaveType.is_deleted = !leaveType.is_deleted;
      await leaveType.save();

      return res.status(200).json(
        formatResponse(
          200,
          leaveType.is_deleted
            ? "Leave type deleted successfully"
            : "Leave type restored successfully"
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const leaveTypes = new LeaveTypes();