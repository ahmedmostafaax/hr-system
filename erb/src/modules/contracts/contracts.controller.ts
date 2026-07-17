import { Request, Response, NextFunction } from "express";
import EmployeeContract from "../../../database/Models/contracts";
import Employee from "../../../database/Models/employee";
import Department from "../../../database/Models/department.model";
import Shift from "../../../database/Models/shift.model";
import ContractAllowance from "../../../database/Models/contract_allowances";
import EmployeeLeaveBalance from "../../../database/Models/contract_leaves";
import CustodyTransfer from "../../../database/Models/custody";
import User from "../../../database/Models/user.model";
import InsuranceRate from "../../../database/Models/insurance_settings";
import Allowance from "../../../database/Models/allowance_types";
import LeaveType from "../../../database/Models/leaveType.model";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import {
  buildBirthDateRange,
  buildSalaryRange,
  parseOptionalNumber,
  stripAdvancedFilters,
} from "../../utils/listQueryHelpers";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";
import { Op } from "sequelize";
import { auditFromRequest, toAuditSnapshot } from "../../service/audit/auditHelpers";

class ContractLogic {
  private async assertNoOtherActiveContract(
    employee_id: number,
    excludeContractId?: number
  ): Promise<void> {
    const where: any = {
      employee_id,
      status: "active",
      is_deleted: false,
    };

    if (excludeContractId != null) {
      where.id = { [Op.ne]: excludeContractId };
    }

    const existing = await EmployeeContract.findOne({ where });

    if (existing) {
      throw new AppError(
        "Employee already has an active contract. Close or suspend the existing contract before activating another.",
        400
      );
    }
  }

  async createContract(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        employee_id,
        department_id,
        shift_id,
        job_title,
        start_date,
        duration_years,
        end_date,
        base_salary,
        status,
        overtime_enabled,
        notes,
        attachment,
        insurance_setting_id
      } = req.body;

      const user = (req as any).user;

      await checkItemFound.checkItem(employee_id, Employee);
      await checkItemFound.checkItem(department_id, Department);
      await checkItemFound.checkItem(shift_id, Shift);

      if (status === "active") {
        await this.assertNoOtherActiveContract(employee_id);
      }

      const contract = await EmployeeContract.create({
        employee_id,
        department_id,
        shift_id,
        job_title,
        start_date,
        duration_years,
        end_date,
        base_salary,
        status,
        overtime_enabled,
        notes,
        attachment,
        created_by: user?.id || 1,
        updated_by: user?.id || 1,
    insurance_setting_id
      });

      await auditFromRequest(req, {
        action: "CREATE",
        entityType: "Contract",
        entityId: contract.id,
        newValues: toAuditSnapshot(contract),
      });

      return res.status(201).json(
        formatResponse(201, "Contract created successfully", contract)
      );
    } catch (error) {
      next(error);
    }
  }

  async allContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const salaryMin = parseOptionalNumber(req.query.salary_min);
      const salaryMax = parseOptionalNumber(req.query.salary_max);
      const employeeAgeMin = parseOptionalNumber(req.query.employee_age_min);
      const employeeAgeMax = parseOptionalNumber(req.query.employee_age_max);

      const features = new ApiFeatures(stripAdvancedFilters(req.query as Record<string, unknown>))
        .filter()
        .search(["job_title", "$Employee.full_name$", "$Employee.code$"])
        .sort()
        .fields()
        .pagination();

      const where: any = {
        ...features.queryOptions.where,
        is_deleted: false,
      };

      const salaryRange = buildSalaryRange(salaryMin, salaryMax);
      if (salaryRange) {
        where.base_salary = salaryRange;
      }

      const employeeWhere: any = {};
      const birthDateRange = buildBirthDateRange(employeeAgeMin, employeeAgeMax);
      if (birthDateRange) {
        employeeWhere.birth_date = birthDateRange;
      }

      const { rows: contracts, count: totalItems } =
        await EmployeeContract.findAndCountAll({
          ...features.queryOptions,
          where,
          subQuery: false,
          include: [
            {
              model: Employee,
              attributes: ["id", "full_name", "code", "birth_date", "gender"],
              where: birthDateRange ? employeeWhere : undefined,
            },
            { model: Department, attributes: ["id", "name"] },
            { model: Shift, attributes: ["id", "name"] },
            { model: User, as: "creator", attributes: ["id", "name"] },
            { model: User, as: "updater", attributes: ["id", "name"] },
            { model: InsuranceRate, as: "insuranceSetting" },
          ],
        });

      const totalPages = Math.ceil(totalItems / features.pageLimit);

      return res.status(200).json(
        formatResponse(200, "success get all contracts", contracts, {
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

  async singleContract(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, EmployeeContract);

      const contract = await EmployeeContract.findOne({
        where: { id, is_deleted: false },
        include: [
          { model: Employee, attributes: ["id", "full_name", "code"] },
          { model: Department, attributes: ["id", "name"] },
          { model: Shift, attributes: ["id", "name", "start_time", "end_time"] },
          { model: User, as: "creator", attributes: ["id", "name"] },
          { model: User, as: "updater", attributes: ["id", "name"] },
          { model: InsuranceRate, as: "insuranceSetting" },
          { 
            model: ContractAllowance, 
            as: "allowances",
            include: [{ model: Allowance, attributes: ["id", "name", "is_part_of_salary"] }]
          },
          { 
            model: EmployeeLeaveBalance, 
            as: "leaveBalances",
            include: [{ model: LeaveType, attributes: ["id", "name"] }]
          },
        ],
      });

      return res.status(200).json(
        formatResponse(200, "success get contract", contract)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateContract(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const {
        employee_id,
        department_id,
        shift_id,
        job_title,
        start_date,
        duration_years,
        end_date,
        base_salary,
        status,
        overtime_enabled,
        notes,
        attachment,
        is_active,
      } = req.body;
      const user = (req as any).user;

      const contract: any = await checkItemFound.checkItem(id, EmployeeContract);

      const oldSnapshot = toAuditSnapshot(contract);

      if (employee_id) await checkItemFound.checkItem(employee_id, Employee);
      if (department_id) await checkItemFound.checkItem(department_id, Department);
      if (shift_id) await checkItemFound.checkItem(shift_id, Shift);

      const nextStatus = status ?? contract.status;
      const nextEmployeeId = employee_id ?? contract.employee_id;

      if (nextStatus === "active") {
        await this.assertNoOtherActiveContract(nextEmployeeId, contract.id);
      }

      contract.employee_id = employee_id ?? contract.employee_id;
      contract.department_id = department_id ?? contract.department_id;
      contract.shift_id = shift_id ?? contract.shift_id;
      contract.job_title = job_title ?? contract.job_title;
      contract.start_date = start_date ?? contract.start_date;
      contract.duration_years = duration_years !== undefined ? duration_years : contract.duration_years;
      contract.end_date = end_date !== undefined ? end_date : contract.end_date;
      contract.base_salary = base_salary ?? contract.base_salary;
      contract.status = status ?? contract.status;
      contract.overtime_enabled = overtime_enabled ?? contract.overtime_enabled;
      contract.notes = notes !== undefined ? notes : contract.notes;
      contract.attachment = attachment !== undefined ? attachment : contract.attachment;
      contract.is_active = is_active ?? contract.is_active;

      contract.updated_by = user?.id || 1;

      await contract.save();

      await auditFromRequest(req, {
        action: "UPDATE",
        entityType: "Contract",
        entityId: contract.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(contract),
      });

      return res.status(200).json(
        formatResponse(200, "Contract updated successfully", contract)
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteContract(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const contract: any = await checkItemFound.checkItem(id, EmployeeContract);

      const oldSnapshot = toAuditSnapshot(contract);

      contract.is_active = !contract.is_active;
      contract.is_deleted = !contract.is_deleted;
      
      const user = (req as any).user;
      contract.updated_by = user?.id || 1;

      await contract.save();

      await ContractAllowance.update(
        { is_deleted: contract.is_deleted },
        { where: { contract_id: contract.id } }
      );

      await EmployeeLeaveBalance.update(
        { is_deleted: contract.is_deleted },
        { where: { contract_id: contract.id } }
      );

      await CustodyTransfer.update(
        { is_deleted: contract.is_deleted },
        { where: { to_employee_id: contract.employee_id } }
      );

      await auditFromRequest(req, {
        action: "DELETE",
        entityType: "Contract",
        entityId: contract.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(contract),
      });

      return res.status(200).json(
        formatResponse(
          200,
          contract.is_deleted
            ? "Contract deleted successfully"
            : "Contract restored successfully",
          contract
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const contractLogic = new ContractLogic();
