import { Request, Response, NextFunction } from "express";
import Department from "../../../database/Models/department.model";
import User from "../../../database/Models/user.model";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";

class DepartmentLogic {
  async createDepartment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { parent_id, name, type } = req.body;

      const user = (req as any).user;

      const department = await Department.create({
        name,
        parent_id,
        type,
        create_at: new Date(),
        created_by: user?.id || null,
      });

      return res.status(201).json(
        formatResponse(201, "Department created successfully", department)
      );
    } catch (error) {
      next(error);
    }
  }

  async allDepartment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["name", "type"])
        .sort()
        .fields()
        .pagination();

      const { rows: departments, count: totalItems } =
        await Department.findAndCountAll({
          ...features.queryOptions,
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      return res.status(200).json(
        formatResponse(200, "success get all departments", departments, {
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

  async singleDepartment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, Department);

      const department = await Department.findOne({
        where: { id, is_deleted: false },
        include: [
          {
            model: User,
            as: "creator",
            attributes: [
              "id",
              "name",
              "role",
              "phoneNumber",
              "uniqueCode",
              "email",
            ],
          },
        ],
      });

      return res.status(200).json(
        formatResponse(200, "success get department", department)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateDepartment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { name, type, parent_id, isActive } = req.body;

      const department: any = await checkItemFound.checkItem(
        id,
        Department
      );

      department.name = name ?? department.name;
      department.type = type ?? department.type;
      department.parent_id = parent_id ?? department.parent_id;
      department.isActive = isActive ?? department.isActive;

      await department.save();

      return res.status(200).json(
        formatResponse(
          200,
          "Department updated successfully",
          department
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteDepartment(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const department: any = await checkItemFound.checkItem(
        id,
        Department
      );

      // toggle soft delete
      department.isActive = !department.isActive;
      department.is_deleted = !department.is_deleted;

      await department.save();

      return res.status(200).json(
        formatResponse(
          200,
          department.is_deleted
            ? "Department deleted successfully"
            : "Department restored successfully",
          department
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const departmentLogic = new DepartmentLogic();