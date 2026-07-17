import { NextFunction, Request, Response } from "express";
import Holiday from "../../../database/Models/official_holiday";
import { ApiFeatures } from "../../utils/apiFeatures";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";

class OfficialHolidays {
  async create_official_holidays(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, start_date, days_count } = req.body;

      const holiday = await Holiday.create({
        name,
        start_date,
        days_count,
      });

      res
        .status(201)
        .json(
          formatResponse(
            201,
            "Holiday created successfully",
            holiday
          )
        );
    } catch (error) {
      next(error);
    }
  }

  async all_official_holidays(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["name"])
        .sort()
        .fields()
        .pagination();

      const { rows: holidays, count: totalItems } =
        await Holiday.findAndCountAll({
          ...features.queryOptions,
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      res.status(200).json(
        formatResponse(
          200,
          "success get all holidays",
          holidays,
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

  async single_official_holidays(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const officialHoliday = await checkItemFound.checkItem(
        id,
        Holiday
      );

      res.status(200).json(
        formatResponse(
          200,
          "success get holiday",
          officialHoliday
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async update_official_holidays(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { name, start_date, days_count } = req.body;

      const officialHoliday: any =
        await checkItemFound.checkItem(id, Holiday);

      officialHoliday.name = name ?? officialHoliday.name;
      officialHoliday.start_date =
        start_date ?? officialHoliday.start_date;
      officialHoliday.days_count =
        days_count ?? officialHoliday.days_count;

      await officialHoliday.save();

      res.status(200).json(
        formatResponse(
          200,
          "Holiday updated successfully",
          officialHoliday
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async delete_official_holidays(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const officialHoliday: any =
        await checkItemFound.checkItem(id, Holiday);

      officialHoliday.is_deleted = !officialHoliday.is_deleted;

      await officialHoliday.save();

      res.status(200).json(
        formatResponse(
          200,
          officialHoliday.is_deleted
            ? "Holiday deleted successfully"
            : "Holiday restored successfully",
          officialHoliday
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const officialHolidays = new OfficialHolidays();