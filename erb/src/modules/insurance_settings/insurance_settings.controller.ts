import { Request, Response, NextFunction } from "express";
import InsuranceRate from "../../../database/Models/insurance_settings";
import { ApiFeatures } from "../../utils/apiFeatures";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { AppError } from "../../utils/appError";
import { formatResponse } from "../../utils/responseFormatter";

class InsuranceSettingsController {
  async createInsuranceSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const { employee_rate, company_rate, effective_from } = req.body;

      const existing = await InsuranceRate.findOne({ where: { effective_from } });
      if (existing) {
        return next(new AppError("An insurance rate for this effective date already exists", 400));
      }

      const insuranceRate = await InsuranceRate.create({
        employee_rate,
        company_rate,
        effective_from,
      });

      return res
        .status(201)
        .json(formatResponse(201, "Insurance rate created successfully", insuranceRate));
    } catch (error) {
      next(error);
    }
  }

  async getAllInsuranceSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .sort()
        .fields()
        .pagination();

      const { rows: insuranceRates, count: totalItems } =
        await InsuranceRate.findAndCountAll({
          ...features.queryOptions,
          where: {
            ...features.queryOptions.where,
          },
        });

      const totalPages = Math.ceil(totalItems / features.pageLimit);

      return res.status(200).json(
        formatResponse(200, "success get all insurance rates", insuranceRates, {
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

  async singleInsuranceSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, InsuranceRate);

      const insuranceRate = await InsuranceRate.findOne({
        where: { id, is_deleted: false },
      });

      return res
        .status(200)
        .json(formatResponse(200, "success get insurance rate", insuranceRate));
    } catch (error) {
      next(error);
    }
  }

  async updateInsuranceSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const insuranceRate: any = await checkItemFound.checkItem(id, InsuranceRate);

      const { employee_rate, company_rate, effective_from } = req.body;

      if (effective_from && effective_from !== insuranceRate.effective_from) {
        const existing = await InsuranceRate.findOne({ where: { effective_from } });

        if (existing) {
          return next(new AppError("An insurance rate for this effective date already exists", 400));
        }

        insuranceRate.effective_from = effective_from;
      }

      insuranceRate.employee_rate = employee_rate ?? insuranceRate.employee_rate;
      insuranceRate.company_rate = company_rate ?? insuranceRate.company_rate;

      await insuranceRate.save();

      return res
        .status(200)
        .json(formatResponse(200, "Insurance rate updated successfully", insuranceRate));
    } catch (error) {
      next(error);
    }
  }

  async deleteInsuranceSetting(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const insuranceRate: any = await checkItemFound.checkItem(id, InsuranceRate);

     

      insuranceRate.is_deleted = !insuranceRate.is_deleted;
      await insuranceRate.save();

      return res.status(200).json(
        formatResponse(
          200,
          insuranceRate.is_deleted
            ? "Insurance rate deleted successfully"
            : "Insurance rate restored successfully",
          insuranceRate
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const insuranceSettingsController = new InsuranceSettingsController();
