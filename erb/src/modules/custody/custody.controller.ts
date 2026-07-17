import { Request, Response, NextFunction } from "express";
import CustodyTransfer from "../../../database/Models/custody";
import Employee from "../../../database/Models/employee";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";
import {
  parsePeriod,
  stripPeriodKeys,
  dateFieldBetween,
  mergePeriodWhere,
} from "../../utils/periodFilter";

class CustodyLogic {
  async createCustody(req: Request, res: Response, next: NextFunction) {
    try {
      const { from_employee_id, to_employee_id, item_name, transfer_type, transfer_date, notes } = req.body;

      await checkItemFound.checkItem(to_employee_id, Employee);
      if (from_employee_id) await checkItemFound.checkItem(from_employee_id, Employee);

      const custody = await CustodyTransfer.create({
        from_employee_id: from_employee_id || null,
        to_employee_id,
        item_name,
        transfer_type,
        transfer_date,
        notes,
      });

      return res.status(201).json(
        formatResponse(201, "Custody created successfully", custody)
      );
    } catch (error) {
      next(error);
    }
  }

  async allCustodies(req: Request, res: Response, next: NextFunction) {
    try {
      const period = parsePeriod(req.query as Record<string, unknown>);
      const query = stripPeriodKeys(req.query as Record<string, unknown>);

      const features = new ApiFeatures(query)
        .filter()
        .sort()
        .fields()
        .search([
          "$fromEmployee.full_name$",
          "$fromEmployee.code$",
          "$toEmployee.full_name$",
          "$toEmployee.code$",
          "item_name",
        ])
        .pagination();

      mergePeriodWhere(
        features,
        period,
        period ? dateFieldBetween("transfer_date", period) : null
      );

      const { rows: custodies, count: totalItems } =
        await CustodyTransfer.findAndCountAll({
          ...features.queryOptions,
          subQuery: false,
          include: [
            { model: Employee, as: "fromEmployee", attributes: ["id", "full_name", "code"] },
            { model: Employee, as: "toEmployee", attributes: ["id", "full_name", "code"] },
          ],
        });

      const totalPages = Math.ceil(totalItems / features.pageLimit);

      return res.status(200).json(
        formatResponse(200, "success get all custodies", custodies, {
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

  async singleCustody(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, CustodyTransfer);

      const custody = await CustodyTransfer.findOne({
        where: { id, is_deleted: false },
        include: [
          { model: Employee, as: "fromEmployee", attributes: ["id", "full_name", "code"] },
          { model: Employee, as: "toEmployee", attributes: ["id", "full_name", "code"] },
        ],
      });

      return res.status(200).json(
        formatResponse(200, "success get custody", custody)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateCustody(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { from_employee_id, to_employee_id, item_name, transfer_type, transfer_date, notes } = req.body;

      const custody: any = await checkItemFound.checkItem(id, CustodyTransfer);

      if (to_employee_id) await checkItemFound.checkItem(to_employee_id, Employee);
      if (from_employee_id) await checkItemFound.checkItem(from_employee_id, Employee);

      custody.from_employee_id = from_employee_id !== undefined ? from_employee_id : custody.from_employee_id;
      custody.to_employee_id = to_employee_id ?? custody.to_employee_id;
      custody.item_name = item_name ?? custody.item_name;
      custody.transfer_type = transfer_type ?? custody.transfer_type;
      custody.transfer_date = transfer_date ?? custody.transfer_date;
      custody.notes = notes !== undefined ? notes : custody.notes;

      await custody.save();

      return res.status(200).json(
        formatResponse(200, "Custody updated successfully", custody)
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteCustody(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const custody: any = await checkItemFound.checkItem(id, CustodyTransfer);

      custody.is_deleted = !custody.is_deleted;

      await custody.save();

      return res.status(200).json(
        formatResponse(
          200,
          custody.is_deleted ? "Custody deleted successfully" : "Custody restored successfully",
          custody
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const custodyLogic = new CustodyLogic();
