import { Request, Response, NextFunction } from "express";
import Shift from "../../../database/Models/shift.model";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";

class ShiftLogic {
  async createShift(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        name,
        type,
        work_days,
        start_time,
        end_time,
        grace_minutes,
        deduct_grace,
        salary_basis_days,
      } = req.body;

      const shift = await Shift.create({
        name,
        type,
        work_days,
        start_time,
        end_time,
        grace_minutes,
        deduct_grace,
        salary_basis_days,
      });

      return res
        .status(201)
        .json(formatResponse(201, "Shift created successfully", shift));
    } catch (error) {
      next(error);
    }
  }

  async allShift(req: Request, res: Response, next: NextFunction) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["name", "type"])
        .sort()
        .fields()
        .pagination();

      const { rows: shifts, count: totalItems } =
        await Shift.findAndCountAll({
          ...features.queryOptions,
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      return res.status(200).json(
        formatResponse(200, "success get all shifts", shifts, {
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

  async singleShift(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const shift = await checkItemFound.checkItem(id, Shift);

      return res
        .status(200)
        .json(formatResponse(200, "success get shift", shift));
    } catch (error) {
      next(error);
    }
  }

  async updateShift(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const shift: any = await checkItemFound.checkItem(id, Shift);

      const {
        name,
        type,
        work_days,
        start_time,
        end_time,
        grace_minutes,
        deduct_grace,
        salary_basis_days,
      } = req.body;

      shift.name = name ?? shift.name;
      shift.type = type ?? shift.type;
      shift.work_days = work_days ?? shift.work_days;
      shift.start_time = start_time ?? shift.start_time;
      shift.end_time = end_time ?? shift.end_time;
      shift.grace_minutes = grace_minutes ?? shift.grace_minutes;
      shift.deduct_grace = deduct_grace ?? shift.deduct_grace;
      shift.salary_basis_days =
        salary_basis_days ?? shift.salary_basis_days;

      await shift.save();

      return res
        .status(200)
        .json(
          formatResponse(200, "Shift updated successfully", shift)
        );
    } catch (error) {
      next(error);
    }
  }

  async deleteShift(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const shift: any = await checkItemFound.checkItem(id, Shift);

      shift.is_deleted = !shift.is_deleted;
      await shift.save();

      return res.status(200).json(
        formatResponse(
          200,
          shift.is_deleted
            ? "Shift is deleted"
            : "Shift is restored",
          shift
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const shiftLogic = new ShiftLogic();