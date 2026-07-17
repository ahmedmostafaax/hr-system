import { Request, Response, NextFunction } from "express";
import { ApiFeatures } from "../../utils/apiFeatures";
import { AppError } from "../../utils/appError";
import { formatResponse } from "../../utils/responseFormatter";
import { checkItemFound } from "../../middleware/chickiItemFound";
import AbsenceType from "../../../database/Models/absence_type";

class AbsenceTypeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, deduct_days, requires_permission } = req.body;

      const existing = await AbsenceType.findOne({
        where: { name },
      });

      if (existing) {
        return next(new AppError("Absence type already exists", 400));
      }

      const absenceType = await AbsenceType.create({
        name,
        deduct_days,
        requires_permission,
      });

      return res
        .status(201)
        .json(formatResponse(201, "Created successfully", absenceType));
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["name"])
        .sort()
        .fields()
        .pagination();

      const { rows, count } = await AbsenceType.findAndCountAll({
        ...features.queryOptions,
      });

      return res.status(200).json(
        formatResponse(200, "success", rows, {
          totalItems: count,
          page: features.pageNumber,
          limit: features.pageLimit,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async single(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const absenceType: any = await checkItemFound.checkItem(
        id,
        AbsenceType
      );

      return res
        .status(200)
        .json(formatResponse(200, "success", absenceType));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const absenceType: any = await checkItemFound.checkItem(
        id,
        AbsenceType
      );

      const { name, deduct_days, requires_permission } = req.body;

      if (name) {
        const existing = await AbsenceType.findOne({
          where: { name },
        });

        if (existing && existing.id !== absenceType.id) {
          return next(new AppError("Name already exists", 400));
        }

        absenceType.name = name;
      }

      absenceType.deduct_days =
        deduct_days ?? absenceType.deduct_days;

      absenceType.requires_permission =
        requires_permission ?? absenceType.requires_permission;

      await absenceType.save();

      return res
        .status(200)
        .json(formatResponse(200, "Updated successfully", absenceType));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const absenceType: any = await checkItemFound.checkItem(
        id,
        AbsenceType
      );

      absenceType.is_deleted = !absenceType.is_deleted;


      await absenceType.save();

      return res.status(200).json(
        formatResponse(
          200,
          absenceType.is_deleted
            ? "Deleted successfully"
            : "Restored successfully",
          absenceType
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const absenceTypeController = new AbsenceTypeController();