import { Request, Response, NextFunction } from "express";
import Account from "../../../database/Models/Account";
import { ApiFeatures } from "../../utils/apiFeatures";
import Allowance from "../../../database/Models/allowance_types";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { AppError } from "../../utils/appError";
import { formatResponse } from "../../utils/responseFormatter";

class AccountController {
  async createAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, code, type, parent_id, description, currency } = req.body;

      const existing = await Account.findOne({ where: { code } });
      if (existing) {
        return next(new AppError("Account code already exists", 400));
      }

      let level = 1;
      let parent: any = null;

      if (parent_id) {
        parent = await Account.findByPk(parent_id);

        if (!parent) {
          return next(new AppError("Parent account not found", 404));
        }

        if (parent.is_posting) {
          return next(
            new AppError("Cannot add child to a posting account", 400)
          );
        }

        level = parent.level + 1;
      }

      const is_posting = level >= 3;

      let balance_type: "debit" | "credit" = "debit";
      if (["liability", "revenue", "equity"].includes(type)) {
        balance_type = "credit";
      }

      const account = await Account.create({
        name,
        code,
        type,
        parent_id: parent_id || null,
        level,
        is_posting,
        description,
        currency: currency || "EGP",
        balance_type,
      });

      return res
        .status(201)
        .json(formatResponse(201, "Account created successfully", account));
    } catch (error) {
      next(error);
    }
  }

  async getAllAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["name", "code"])
        .sort()
        .fields()
        .pagination();

      const { rows: accounts, count: totalItems } =
        await Account.findAndCountAll({
          ...features.queryOptions,
          where: {
            ...features.queryOptions.where,
          },
        });

      const totalPages = Math.ceil(totalItems / features.pageLimit);

      return res.status(200).json(
        formatResponse(200, "success get all accounts", accounts, {
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

  async singleAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, Account);

      const account = await Account.findOne({
        where: { id, is_deleted: false },
        include: [
          {
            model: Account,
            as: "children",
            include: [
              {
                model: Account,
                as: "children",
              },
            ],
          },
          {
          model: Allowance,
          as: "allowances",
          attributes: ["id", "name", "default_amount", "is_part_of_salary"],
        },
        ],
      });

      return res
        .status(200)
        .json(formatResponse(200, "success get account", account));
    } catch (error) {
      next(error);
    }
  }

  async updateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const account: any = await checkItemFound.checkItem(id, Account);

      const { name, code, type, parent_id, description, currency } = req.body;

      // check code uniqueness
      if (code && code !== account.code) {
        const existing = await Account.findOne({ where: { code } });

        if (existing) {
          return next(new AppError("Account code already exists", 400));
        }

        account.code = code;
      }

      // update fields
      account.name = name ?? account.name;
      account.type = type ?? account.type;
      account.description = description ?? account.description;
      account.currency = currency ?? account.currency;

      // parent logic
      if (parent_id !== undefined) {
        if (parent_id === null) {
          account.parent_id = null;
          account.level = 1;
        } else {
          const parent = await Account.findByPk(parent_id);

          if (!parent) {
            return next(new AppError("Parent account not found", 404));
          }

          if (parent.is_posting) {
            return next(
              new AppError(
                "Cannot assign a posting account as parent",
                400
              )
            );
          }

          account.parent_id = parent_id;
          account.level = parent.level + 1;
        }
      }

      account.is_posting = account.level >= 3;

      if (type) {
        account.balance_type = ["liability", "revenue", "equity"].includes(type)
          ? "credit"
          : "debit";
      }

      await account.save();

      return res
        .status(200)
        .json(formatResponse(200, "Account updated successfully", account));
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const account: any = await checkItemFound.checkItem(id, Account);

      if (account.is_deleted) {
        if (account.parent_id) {
          const parent = await Account.findByPk(account.parent_id);

          if (parent && parent.is_deleted) {
            return next(
              new AppError(
                "Cannot restore this account until its parent is restored",
                400
              )
            );
          }
        }
      }

      // toggle delete
      account.is_deleted = !account.is_deleted;
      await account.save();

      // cascade delete children
      const deleteChildren = async (parentId: number) => {
        const children = await Account.findAll({
          where: { parent_id: parentId },
        });

        for (const child of children) {
          child.is_deleted = true;
          await child.save();
          await deleteChildren(child.id);
        }
      };

      if (account.is_deleted) {
        await deleteChildren(account.id);
      }

      return res.status(200).json(
        formatResponse(
          200,
          account.is_deleted
            ? "Account and its children are deleted"
            : "Account restored successfully",
          account
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const account = new AccountController();