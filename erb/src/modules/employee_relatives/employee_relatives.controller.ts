import { Request, Response, NextFunction } from "express";
import EmployeeContact from "../../../database/Models/employee_relatives";
import Employee from "../../../database/Models/employee";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";

class EmployeeRelativeLogic {
  async createRelative(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { employee_id, relation, name, phone } = req.body;

      const employee: any = await checkItemFound.checkItem(employee_id, Employee);

      const relative = await EmployeeContact.create({
        employee_id,
        relation,
        name,
        employee_code: employee.code,
        phone,
      });

      return res.status(201).json(
        formatResponse(201, "Employee relative created successfully", relative)
      );
    } catch (error) {
      next(error);
    }
  }

  async allRelatives(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["name", "relation", "phone", "employee_code", "$Employee.full_name$"])
        .sort()
        .fields()
        .pagination();

      const { rows: relatives, count: totalItems } =
        await EmployeeContact.findAndCountAll({
          ...features.queryOptions,
          subQuery: false,
          include: [{ model: Employee, as: "Employee", attributes: ["id", "full_name", "code"] }]
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      return res.status(200).json(
        formatResponse(200, "success get all relatives", relatives, {
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

  async singleRelative(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, EmployeeContact);

      const relative = await EmployeeContact.findOne({
        where: { id, is_deleted: false },
        include: [{ model: Employee, as: "Employee", attributes: ["id", "full_name", "code"] }]
      });

      return res.status(200).json(
        formatResponse(200, "success get relative", relative)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateRelative(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { employee_id, relation, name, phone, is_deleted } = req.body;

      const relative: any = await checkItemFound.checkItem(
        id,
        EmployeeContact
      );

      if (employee_id && employee_id !== relative.employee_id) {
        const employee: any = await checkItemFound.checkItem(employee_id, Employee);
        relative.employee_id = employee_id;
        relative.employee_code = employee.code;
      }

      relative.relation = relation ?? relative.relation;
      relative.name = name ?? relative.name;
      relative.phone = phone ?? relative.phone;
      if (is_deleted !== undefined) relative.is_deleted = is_deleted;

      await relative.save();

      return res.status(200).json(
        formatResponse(
          200,
          "Employee relative updated successfully",
          relative
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteRelative(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const relative: any = await checkItemFound.checkItem(
        id,
        EmployeeContact
      );

      // soft delete toggle
      relative.is_deleted = !relative.is_deleted;
      await relative.save();

      return res.status(200).json(
        formatResponse(
          200,
          relative.is_deleted ? "Employee relative deleted successfully" : "Employee relative restored successfully",
          relative
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const employeeRelativeLogic = new EmployeeRelativeLogic();
