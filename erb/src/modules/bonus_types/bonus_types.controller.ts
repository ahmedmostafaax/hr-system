import { Request, Response, NextFunction } from "express";
import BonusType from "../../../database/Models/bonus_types";
import { ApiFeatures } from "../../utils/apiFeatures";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { AppError } from "../../utils/appError";
import { formatResponse } from "../../utils/responseFormatter";

class BonusTypesController {
  async createBonusType(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, payment_type, default_amount, editable_amount } = req.body;

      const existing = await BonusType.findOne({ where: { name } });
      if (existing) {
        return next(new AppError("Bonus type name already exists", 400));
      }

      const bonusType = await BonusType.create({
        name,
        payment_type,
        default_amount: default_amount || null,
        editable_amount: editable_amount ?? true,
      });

      return res
        .status(201)
        .json(formatResponse(201, "Bonus type created successfully", bonusType));
    } catch (error) {
      next(error);
    }
  }

  async getAllBonusTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["name"])
        .sort()
        .fields()
        .pagination();

      const { rows: bonusTypes, count: totalItems } =
        await BonusType.findAndCountAll({
          ...features.queryOptions,
          where: {
            ...features.queryOptions.where,
          },
        });

      const totalPages = Math.ceil(totalItems / features.pageLimit);

      return res.status(200).json(
        formatResponse(200, "success get all bonus types", bonusTypes, {
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

  async singleBonusType(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, BonusType);

      const bonusType = await BonusType.findOne({
        where: { id, is_deleted: false },
      });

      return res
        .status(200)
        .json(formatResponse(200, "success get bonus type", bonusType));
    } catch (error) {
      next(error);
    }
  }

  async updateBonusType(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const bonusType: any = await checkItemFound.checkItem(id, BonusType);

      const { name, payment_type, default_amount, editable_amount } = req.body;

      // check name uniqueness
      if (name && name !== bonusType.name) {
        const existing = await BonusType.findOne({ where: { name } });

        if (existing) {
          return next(new AppError("Bonus type name already exists", 400));
        }

        bonusType.name = name;
      }

      // update fields
      bonusType.payment_type = payment_type ?? bonusType.payment_type;
      bonusType.default_amount =
        default_amount !== undefined ? default_amount : bonusType.default_amount;
      bonusType.editable_amount =
        editable_amount ?? bonusType.editable_amount;

      await bonusType.save();

      return res
        .status(200)
        .json(formatResponse(200, "Bonus type updated successfully", bonusType));
    } catch (error) {
      next(error);
    }
  }

  async deleteBonusType(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const bonusType: any = await checkItemFound.checkItem(id, BonusType);

      // toggle delete
      bonusType.is_deleted = !bonusType.is_deleted;
      await bonusType.save();

      return res.status(200).json(
        formatResponse(
          200,
          bonusType.is_deleted
            ? "Bonus type deleted successfully"
            : "Bonus type restored successfully",
          bonusType
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const bonusTypesController = new BonusTypesController();