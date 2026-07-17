import { Request, Response, NextFunction } from "express";
import ContractAllowance from "../../../database/Models/contract_allowances";
import EmployeeContract from "../../../database/Models/contracts";
import Allowance from "../../../database/Models/allowance_types";
import Employee from "../../../database/Models/employee";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";

class ContractAllowancesLogic {
  async createContractAllowance(req: Request, res: Response, next: NextFunction) {
    try {
      const { contract_id, allowance_type_id, amount } = req.body;

      // Ensure that they exist
      await checkItemFound.checkItem(contract_id, EmployeeContract);
      const allowance:any = await checkItemFound.checkItem(allowance_type_id, Allowance);

      const contractAllowance = await ContractAllowance.create({
        contract_id,
        allowance_type_id,
        amount:amount??allowance.default_amount
      });

      return res.status(201).json(
        formatResponse(201, "Contract allowance created successfully", contractAllowance)
      );
    } catch (error) {
      next(error);
    }
  }

  async allContractAllowances(req: Request, res: Response, next: NextFunction) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["$EmployeeContract.Employee.full_name$", "$EmployeeContract.Employee.code$"])
        .sort()
        .fields()
        .pagination();

      const { rows: contractAllowances, count: totalItems } =
        await ContractAllowance.findAndCountAll({
          ...features.queryOptions,
          subQuery: false,
          include: [
            { 
              model: EmployeeContract, 
              attributes: ["id", "job_title", "base_salary"],
              include: [{ model: Employee, attributes: ["id", "full_name", "code"] }]
            },
            { model: Allowance, attributes: ["id", "name"] },
          ],
        });

      const totalPages = Math.ceil(totalItems / features.pageLimit);

      return res.status(200).json(
        formatResponse(200, "success get all contract allowances", contractAllowances, {
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

  async singleContractAllowance(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, ContractAllowance );

      const contractAllowance = await ContractAllowance.findOne({
        where: { id, is_deleted: false },
        include: [
          { model: EmployeeContract, attributes: ["id", "job_title", "base_salary"] },
          { model: Allowance},
        ],
      });

      return res.status(200).json(
        formatResponse(200, "success get contract allowance", contractAllowance)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateContractAllowance(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { contract_id, allowance_type_id, amount, is_deleted } = req.body;

      const contractAllowance: any = await checkItemFound.checkItem(id, ContractAllowance );

      if (contract_id) await checkItemFound.checkItem(contract_id, EmployeeContract);
      if (allowance_type_id) await checkItemFound.checkItem(allowance_type_id, Allowance);

      contractAllowance.contract_id = contract_id ?? contractAllowance.contract_id;
      contractAllowance.allowance_type_id = allowance_type_id ?? contractAllowance.allowance_type_id;
      contractAllowance.amount = amount !== undefined ? amount : contractAllowance.amount;
      contractAllowance.is_deleted = is_deleted ?? contractAllowance.is_deleted;

      await contractAllowance.save();

      return res.status(200).json(
        formatResponse(200, "Contract allowance updated successfully", contractAllowance)
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteContractAllowance(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const contractAllowance: any = await checkItemFound.checkItem(id, ContractAllowance  );

      contractAllowance.is_deleted = !contractAllowance.is_deleted;

      await contractAllowance.save();

      return res.status(200).json(
        formatResponse(
          200,
          contractAllowance.is_deleted
            ? "Contract allowance deleted successfully"
            : "Contract allowance restored successfully",
          contractAllowance
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const contractAllowancesLogic = new ContractAllowancesLogic();
