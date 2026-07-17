import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import User from "../../../database/Models/user.model";
import Employee from "../../../database/Models/employee";
import { ApiFeatures } from "../../utils/apiFeatures";
import { checkItemFound } from "../../middleware/chickiItemFound";
import Department from "../../../database/Models/department.model";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";
import { Op } from "sequelize";

class UserController {
  async createUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, name, phoneNumber, role, employee_id } = req.body;

      if (!employee_id) {
        return next(
          new AppError("employee_id is required — user must be linked to an employee", 400)
        );
      }

      const employee: any = await checkItemFound.checkItem(employee_id, Employee);

      const existingLink = await User.findOne({
        where: { employee_id, is_deleted: false },
      });
      if (existingLink) {
        return next(new AppError("This employee already has a user account", 400));
      }

      const finalEmail = (email || employee.email)?.trim();
      const finalPhone = phoneNumber || employee.phone_number;
      const finalName = name || employee.full_name;
      const finalRole = role || "EMPLOYEE";

      if (!finalEmail) {
        return next(new AppError("Email is required for user account", 400));
      }

      const emailTaken = await User.findOne({ where: { email: finalEmail } });
      if (emailTaken) {
        return next(new AppError("Email already used by another user", 400));
      }

      const code = Math.floor(100000 + Math.random() * 900000);
      const randomPassword = crypto.randomBytes(8).toString("hex");

      const user = await User.create({
        email: finalEmail,
        password: randomPassword,
        name: finalName,
        phoneNumber: finalPhone,
        uniqueCode: code,
        role: finalRole,
        employee_id,
        force_reset_password: true,
      });

      const { password: _, ...userWithoutPassword } = user.toJSON();

      res.status(201).json(
        formatResponse(201, "User created successfully", {
          user: userWithoutPassword,
          password: randomPassword,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search([
          "User.name",
          "User.phoneNumber",
          "$employee.code$",
          "$employee.full_name$",
          "$employee.phone_number$",
        ])
        .sort()
        .fields()
        .pagination();

      const where: any = {
        ...features.queryOptions.where,
        is_deleted: false,
      };

      if (req.query.employees_only === "true") {
        where.employee_id = { [Op.ne]: null };
      }

      const employeeRequired = req.query.employees_only === "true";
      const { rows: users, count: totalItems } =
        await User.findAndCountAll({
          ...features.queryOptions,
          where,
          subQuery: false,
          attributes: { exclude: ["password", "passwordResetToken", "resetCode"] },
          include: [
            {
              model: Employee,
              as: "employee",
              attributes: ["id", "code", "full_name", "email", "phone_number"],
              required: employeeRequired,
            },
          ],
          distinct: true,
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      res.status(200).json(
        formatResponse(200, "Users fetched successfully", users, {
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

  async getSingleUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, User);

      const user = await User.findOne({
        where: { id, is_deleted: false },
        include: [
          {
            model: Department,
            as: "departments",
          },
          {
            model: Employee,
            as: "employee",
            attributes: ["id", "code", "full_name"],
          },
        ],
      });

      res.status(200).json(
        formatResponse(200, "User fetched successfully", user)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { name, role, isActive, isBlock } = req.body;

      const user: any = await checkItemFound.checkItem(id, User);

      if (user.role === "SUPER-ADMIN" && role && role !== "SUPER-ADMIN") {
        return next(new AppError("Cannot change SUPER-ADMIN role", 400));
      }

      await user.update({
        name: name ?? user.name,
        role: role ?? user.role,
        isBlock,
        isActive,
      });

      res.status(200).json(
        formatResponse(200, "User updated successfully", user)
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const user: any = await checkItemFound.checkItem(id, User);

      await user.update({
        is_deleted: !user.is_deleted,
        isActive: !user.isActive,
      });

      res.status(200).json(
        formatResponse(
          200,
          user.is_deleted
            ? "User deleted successfully"
            : "User restored successfully",
          user
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const user: any = await checkItemFound.checkItem(id, User);

      const randomPassword = crypto.randomBytes(8).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 8);

      user.password = hashedPassword;
      user.force_reset_password = true;
      user.passwordChangedAt = new Date();

      await user.save();

      res.status(200).json(
        formatResponse(200, "Password reset successfully", {
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            email: user.email,
          },
          password: randomPassword,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
