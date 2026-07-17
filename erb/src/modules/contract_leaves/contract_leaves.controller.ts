import { Request, Response, NextFunction } from "express";
import EmployeeLeaveBalance from "../../../database/Models/contract_leaves";
import EmployeeContract from "../../../database/Models/contracts";
import LeaveType from "../../../database/Models/leaveType.model";
import Employee from "../../../database/Models/employee";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";

class ContractLeavesLogic {
  async createContractLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const { contract_id, leave_type_id, used_days, year } = req.body;

      // Ensure that they exist
      await checkItemFound.checkItem(contract_id, EmployeeContract);
      await checkItemFound.checkItem(leave_type_id, LeaveType);

      const contractLeave = await EmployeeLeaveBalance.create({
        contract_id,
        leave_type_id,
        used_days: used_days || 0,
        year,
      });

      return res.status(201).json(
        formatResponse(201, "Contract leave created successfully", contractLeave)
      );
    } catch (error) {
      next(error);
    }
  }

  async allContractLeaves(req: Request, res: Response, next: NextFunction) {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["$EmployeeContract.Employee.full_name$", "$EmployeeContract.Employee.code$"])
        .sort()
        .fields()
        .pagination();

      const { rows: contractLeaves, count: totalItems } =
        await EmployeeLeaveBalance.findAndCountAll({
          ...features.queryOptions,
          subQuery: false,
          include: [
            { 
              model: EmployeeContract, 
              attributes: ["id", "job_title", "base_salary"],
              include: [{ model: Employee, attributes: ["id", "full_name", "code"] }]
            },
            { model: LeaveType, attributes: ["id", "name"] },
          ],
        });

      const totalPages = Math.ceil(totalItems / features.pageLimit);

      return res.status(200).json(
        formatResponse(200, "success get all contract leaves", contractLeaves, {
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

  async singleContractLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, EmployeeLeaveBalance);

      const contractLeave = await EmployeeLeaveBalance.findOne({
        where: { id, is_deleted: false },
        include: [
          { model: EmployeeContract, attributes: ["id", "job_title", "base_salary"] },
          { model: LeaveType },
        ],
      });

      return res.status(200).json(
        formatResponse(200, "success get contract leave", contractLeave)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateContractLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { contract_id, leave_type_id, used_days, year } = req.body;

      const contractLeave: any = await checkItemFound.checkItem(id, EmployeeLeaveBalance);

      if (contract_id) await checkItemFound.checkItem(contract_id, EmployeeContract);
      if (leave_type_id) await checkItemFound.checkItem(leave_type_id, LeaveType);

      contractLeave.contract_id = contract_id ?? contractLeave.contract_id;
      contractLeave.leave_type_id = leave_type_id ?? contractLeave.leave_type_id;
      contractLeave.used_days = used_days !== undefined ? used_days : contractLeave.used_days;
      contractLeave.year = year ?? contractLeave.year;

      await contractLeave.save();

      return res.status(200).json(
        formatResponse(200, "Contract leave updated successfully", contractLeave)
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteContractLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const contractLeave: any = await checkItemFound.checkItem(id, EmployeeLeaveBalance);

      contractLeave.is_deleted = !contractLeave.is_deleted;

      await contractLeave.save();

      return res.status(200).json(
        formatResponse(
          200,
          contractLeave.is_deleted
            ? "Contract leave deleted successfully"
            : "Contract leave restored successfully",
          contractLeave
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const contractLeavesLogic = new ContractLeavesLogic();
