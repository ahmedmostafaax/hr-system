import { Request, Response, NextFunction } from "express";
import Allowance from "../../../database/Models/allowance_types";
import Account from "../../../database/Models/Account";
import { ApiFeatures } from "../../utils/apiFeatures";
import { AppError } from "../../utils/appError";
import { formatResponse } from "../../utils/responseFormatter";
import { checkItemFound } from "../../middleware/chickiItemFound";

class AllowanceController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, default_amount, is_part_of_salary, account_code } =
        req.body;

      // check account exists
      const account = await Account.findOne({
        where: { code: account_code },
      });

    
      if (!account) {
        return next(new AppError("Account code not found", 404));
      }

      const allowance = await Allowance.create({
        name,
        default_amount,
        is_part_of_salary,
        account_code,
      });

      return res
        .status(201)
        .json(formatResponse(201, "Allowance created", allowance));
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const features = new ApiFeatures(req.query)
        .search(["name","account_code"])
        .filter()
        .sort()
        .fields()
        .pagination();

      const { rows, count } = await Allowance.findAndCountAll({
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

    await checkItemFound.checkItem(id, Allowance);

    const allowance = await Allowance.findOne({
      where: { id, is_deleted: false },
      include: [
        {
          model: Account,
          as: "account",
          attributes: ["id", "name", "code", "type"],
        },
      ],
    });

    return res
      .status(200)
      .json(formatResponse(200, "success", allowance));
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

      const allowance: any = await checkItemFound.checkItem(id, Allowance);

      const { name, default_amount, is_part_of_salary, account_code } =
        req.body;

      // check account if changed
      if (account_code && account_code !== allowance.account_code) {
        const account = await Account.findOne({
          where: { code: account_code },
        });

        if (!account) {
          return next(new AppError("Account code not found", 404));
        }

        allowance.account_code = account_code;
      }

      allowance.name = name ?? allowance.name;
      allowance.default_amount =
        default_amount ?? allowance.default_amount;
      allowance.is_part_of_salary =
        is_part_of_salary ?? allowance.is_part_of_salary;

      await allowance.save();

      return res
        .status(200)
        .json(formatResponse(200, "updated successfully", allowance));
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

    const allowance: any = await checkItemFound.checkItem(id, Allowance);

    // toggle soft delete
    allowance.is_deleted = !allowance.is_deleted;

    await allowance.save();

    return res.status(200).json(
      formatResponse(
        200,
        allowance.is_deleted
          ? "Allowance deleted successfully"
          : "Allowance restored successfully",
        allowance
      )
    );
  } catch (error) {
    next(error);
  }
}
}

export const allowanceController = new AllowanceController();