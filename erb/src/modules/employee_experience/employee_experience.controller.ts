import { Request, Response, NextFunction } from "express";
import EmployeeExperience from "../../../database/Models/employee_experience";
import Employee from "../../../database/Models/employee";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import {
  parseOptionalNumber,
  stripAdvancedFilters,
} from "../../utils/listQueryHelpers";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";
import { Op } from "sequelize";

class EmployeeExperienceLogic {
  async createExperience(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { employee_id, company_name, position, from_date, to_date } = req.body;

      const employee: any = await checkItemFound.checkItem(employee_id, Employee);

      const experience = await EmployeeExperience.create({
        employee_id,
        company_name,
        position,
        employee_code: employee.code,
        from_date,
        to_date,
      });

      return res.status(201).json(
        formatResponse(201, "Employee experience created successfully", experience)
      );
    } catch (error) {
      next(error);
    }
  }

  async allExperiences(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const fromYear = parseOptionalNumber(req.query.from_year);
      const toYear = parseOptionalNumber(req.query.to_year);

      const features = new ApiFeatures(stripAdvancedFilters(req.query as Record<string, unknown>))
        .filter()
        .search(["company_name", "position", "employee_code", "$Employee.full_name$"])
        .sort()
        .fields()
        .pagination();

      const where: any = {
        ...features.queryOptions.where,
        is_deleted: false,
      };

      if (fromYear !== undefined) {
        where.from_date = { ...(where.from_date ?? {}), [Op.gte]: `${fromYear}-01-01` };
      }
      if (toYear !== undefined) {
        where.to_date = { ...(where.to_date ?? {}), [Op.lte]: `${toYear}-12-31` };
      }

      const { rows: experiences, count: totalItems } =
        await EmployeeExperience.findAndCountAll({
          ...features.queryOptions,
          where,
          subQuery: false,
          include: [{ model: Employee, as: "Employee", attributes: ["id", "full_name", "code"] }]
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      return res.status(200).json(
        formatResponse(200, "success get all experiences", experiences, {
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

  async singleExperience(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, EmployeeExperience);

      const experience = await EmployeeExperience.findOne({
        where: { id, is_deleted: false },
        include: [{ model: Employee, as: "Employee", attributes: ["id", "full_name", "code"] }]
      });

      return res.status(200).json(
        formatResponse(200, "success get experience", experience)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateExperience(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { employee_id, company_name, position, from_date, to_date, is_deleted } = req.body;

      const experience: any = await checkItemFound.checkItem(
        id,
        EmployeeExperience
      );

      if (employee_id && employee_id !== experience.employee_id) {
        const employee: any = await checkItemFound.checkItem(employee_id, Employee);
        experience.employee_id = employee_id;
        experience.employee_code = employee.code;
      }

      experience.company_name = company_name ?? experience.company_name;
      experience.position = position ?? experience.position;
      experience.from_date = from_date ?? experience.from_date;
      if (to_date !== undefined) experience.to_date = to_date;
      if (is_deleted !== undefined) experience.is_deleted = is_deleted;

      await experience.save();

      return res.status(200).json(
        formatResponse(
          200,
          "Employee experience updated successfully",
          experience
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteExperience(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const experience: any = await checkItemFound.checkItem(
        id,
        EmployeeExperience
      );

      // soft delete toggle
      experience.is_deleted = !experience.is_deleted;
      await experience.save();

      return res.status(200).json(
        formatResponse(
          200,
          experience.is_deleted ? "Employee experience deleted successfully" : "Employee experience restored successfully",
          experience
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const employeeExperienceLogic = new EmployeeExperienceLogic();
