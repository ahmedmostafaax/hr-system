import { Request, Response, NextFunction } from "express";
import Employee from "../../../database/Models/employee";
import EmployeeDocument from "../../../database/Models/employee_documents";
import EmployeeContact from "../../../database/Models/employee_relatives";
import EmployeeExperience from "../../../database/Models/employee_experience";
import EmployeeContract from "../../../database/Models/contracts";
import Department from "../../../database/Models/department.model";
import User from "../../../database/Models/user.model";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { calculateAge } from "../../utils/ageUtils";
import {
  buildAgeRange,
  buildSalaryRange,
  parseOptionalNumber,
  stripAdvancedFilters,
} from "../../utils/listQueryHelpers";
import { formatResponse } from "../../utils/responseFormatter";
import { AppError } from "../../utils/appError";
import { Op } from "sequelize";
import EmployeeAdvanceLoan from "../../../database/Models/employee_loans";
import EmployeeBonus from "../../../database/Models/employee_bonuses";
import EmployeeAbsence from "../../../database/Models/absences";
import LeaveRequest from "../../../database/Models/leave_requests";
import Attendance from "../../../database/Models/attendance";
import { auditFromRequest, toAuditSnapshot } from "../../service/audit/auditHelpers";
import { createEmployeeUser, resetEmployeeUserPassword as resetLinkedEmployeePassword } from "../../service/employeeUser.service";
import { buildEmployeeMySummary } from "../../service/employeeMySummary.service";
import Shift from "../../../database/Models/shift.model";
import { sequelize } from "../../../database/db.connection";

class EmployeeLogic {
  async createEmployee(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const {
        code, full_name, birth_date, gender, national_id,
        phone, email, address, marital_status,
        qualification, bank_name, bank_account, phone_number,
        user_role
      } = req.body;

      const normalizedCode = String(code ?? "").trim();
      const normalizedNationalId = String(national_id ?? "").trim();
      const normalizedPhone = String(phone_number ?? phone ?? "").trim();

    const existingEmployee = await Employee.findOne({
  where: {
    [Op.or]: [
      { code: normalizedCode },
      { national_id: normalizedNationalId },
      { phone_number: normalizedPhone }  
    ]
  }
});

if (existingEmployee) {
  if (existingEmployee.code === normalizedCode) {
    return next(new AppError("Employee code already exists", 400));
  }
  if (existingEmployee.national_id === normalizedNationalId) {
    return next(new AppError("Employee national_id already exists", 400));
  }
  if (existingEmployee.phone_number === normalizedPhone) {
    return next(new AppError("Employee phone_number already exists", 400));
  }
}

      if (!email) {
        return next(new AppError("Email is required to create employee login account", 400));
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const existingEmailEmployee = await Employee.findOne({
        where: { email: normalizedEmail, is_deleted: false },
      });
      if (existingEmailEmployee) {
        return next(new AppError("Employee email already exists", 400));
      }

      const existingEmailUser = await User.findOne({
        where: { email: normalizedEmail, is_deleted: false },
      });
      if (existingEmailUser) {
        return next(new AppError("Email already used by another user account", 400));
      }

      const user = (req as any).user;
      const age = calculateAge(birth_date);

      const { employee, userAccount } = await sequelize.transaction(async (t) => {
        const employee = await Employee.create({
          code: normalizedCode,
          full_name,
          birth_date,
          age,
          phone_number: normalizedPhone,
          gender,
          national_id: normalizedNationalId,
          email: normalizedEmail,
          address,
          marital_status,
          qualification,
          bank_name,
          bank_account,
          created_at: new Date(),
          created_by: user?.id || 1,
          updated_by: user?.id || 1,
          deleted_by: user?.id || 1,
        }, { transaction: t });

        const { user: linkedUser, plainPassword } = await createEmployeeUser({
          employeeId: employee.id,
          name: full_name,
          email: normalizedEmail,
          phoneNumber: normalizedPhone,
          role: user_role || "EMPLOYEE",
          transaction: t,
        });

        return {
          employee,
          userAccount: { ...linkedUser, password: plainPassword },
        };
      });

      await auditFromRequest(req, {
        action: "CREATE",
        entityType: "Employee",
        entityId: employee.id,
        newValues: toAuditSnapshot(employee),
      });

      return res.status(201).json(
        formatResponse(201, "Employee created successfully", {
          employee,
          userAccount,
        })
      );
    } catch (error) {
      if ((error as any).name === "SequelizeUniqueConstraintError") {
        return next(
          new AppError("Employee code or national_id already exists", 400)
        );
      }
      return next(error);
    }
  }

  async allEmployee(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const ageMin = parseOptionalNumber(req.query.age_min);
      const ageMax = parseOptionalNumber(req.query.age_max);
      const salaryMin = parseOptionalNumber(req.query.salary_min);
      const salaryMax = parseOptionalNumber(req.query.salary_max);
      const departmentId =
        parseOptionalNumber(req.query.department_id) ??
        parseOptionalNumber(req.query.contract_department_id);
      const hasContract = req.query.has_contract as string | undefined;
      const hasExperience = req.query.has_experience as string | undefined;

      const features = new ApiFeatures(stripAdvancedFilters(req.query as Record<string, unknown>))
        .filter()
        .search(["full_name", "code", "national_id", "email", "phone_number"])
        .sort()
        .fields()
        .pagination();

      const where: any = {
        ...features.queryOptions.where,
        is_deleted: false,
      };

      if (where.is_active === "true") where.is_active = true;
      if (where.is_active === "false") where.is_active = false;

      const ageRange = buildAgeRange(ageMin, ageMax);
      if (ageRange) {
        where.age = ageRange;
      }

      const include: any[] = [
        {
          model: Department,
          attributes: ["id", "name"],
          required: false,
        },
      ];

      const contractWhere: any = { is_deleted: false, status: "active" };

      if (hasContract === "true") {
        // active contract required — contractWhere already active
      }

      const salaryRange = buildSalaryRange(salaryMin, salaryMax);
      if (salaryRange) {
        contractWhere.base_salary = salaryRange;
      }

      if (departmentId !== undefined) {
        contractWhere.department_id = departmentId;
      }

      const needsContractJoin =
        departmentId !== undefined ||
        hasContract === "true" ||
        hasContract === "false" ||
        !!salaryRange;

      if (needsContractJoin) {
        include.push({
          model: EmployeeContract,
          as: "contracts",
          attributes: ["id", "base_salary", "department_id", "status", "job_title"],
          where: contractWhere,
          required: departmentId !== undefined || hasContract === "true" || !!salaryRange,
          include: [{ model: Department, attributes: ["id", "name"] }],
        });
      } else {
        include.push({
          model: EmployeeContract,
          as: "contracts",
          attributes: ["id", "department_id", "status"],
          where: { is_deleted: false, status: "active" },
          required: false,
          include: [{ model: Department, attributes: ["id", "name"] }],
        });
      }

      if (hasContract === "false") {
        const contractInclude = include.find((item) => item.as === "contracts");
        if (contractInclude) {
          contractInclude.required = false;
          contractInclude.where = { status: "active", is_deleted: false };
        }
        where["$contracts.id$"] = null;
      }

      if (hasExperience === "true") {
        include.push({
          model: EmployeeExperience,
          as: "experiences",
          attributes: ["id"],
          where: { is_deleted: false },
          required: true,
        });
      }

      const { rows: employees, count: totalItems } =
        await Employee.findAndCountAll({
          ...features.queryOptions,
          where,
          include,
          distinct: true,
          subQuery: false,
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      return res.status(200).json(
        formatResponse(200, "success get all employees", employees, {
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

  async myEmployeeSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user?.employee_id) {
        return next(new AppError("No employee profile linked to this account", 404));
      }

      const summary = await buildEmployeeMySummary(
        user.employee_id,
        req.query.month,
        req.query.year
      );

      return res.status(200).json(
        formatResponse(200, "success get my employee summary", summary)
      );
    } catch (error) {
      next(error);
    }
  }

  async myEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user?.employee_id) {
        return next(new AppError("No employee profile linked to this account", 404));
      }

      const employee = await Employee.findOne({
        where: { id: user.employee_id, is_deleted: false },
        include: [
          { model: Department, attributes: ["id", "name"] },
          {
            model: EmployeeContract,
            as: "contracts",
            where: { is_deleted: false, status: "active" },
            required: false,
            include: [
              { model: Department, attributes: ["id", "name"] },
              { model: Shift, attributes: ["id", "name", "start_time", "end_time"] },
            ],
          },
        ],
      });

      if (!employee) {
        return next(new AppError("Employee profile not found", 404));
      }

      return res.status(200).json(
        formatResponse(200, "success get my profile", employee)
      );
    } catch (error) {
      next(error);
    }
  }

  async resetEmployeeUserPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, Employee);
      const result = await resetLinkedEmployeePassword(id);

      return res.status(200).json(
        formatResponse(200, "Employee password reset successfully", result)
      );
    } catch (error) {
      next(error);
    }
  }

  async createEmployeeUserAccount(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const employee: any = await checkItemFound.checkItem(id, Employee);
      if (!employee.email) {
        return next(new AppError("Employee must have an email to create login account", 400));
      }

      const { user, plainPassword } = await createEmployeeUser({
        employeeId: employee.id,
        name: employee.full_name,
        email: employee.email,
        phoneNumber: employee.phone_number,
      });

      return res.status(201).json(
        formatResponse(201, "Employee user account created", {
          user,
          password: plainPassword,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async singleEmployee(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, Employee);

      const employee = await Employee.findOne(
        {
          where: { id, is_deleted: false },
          include: [
            {
              model: EmployeeDocument,
              as: "documents",
            },
            {
              model: EmployeeContact,
              as: "relatives",
            },
            {
              model: EmployeeExperience,
              as: "experiences",
            },
            {
              model: EmployeeAdvanceLoan,
            },
            {
              model: EmployeeBonus,
            },
            {
              model: EmployeeAbsence,
            },
            {
              model: LeaveRequest,
            },
            {
              model: Attendance,
            }
          ],
        }
      );

      return res.status(200).json(
        formatResponse(200, "success get employee", employee)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const {
        code, full_name, birth_date, gender, national_id,
        phone, email, address, marital_status,
        qualification, bank_name, bank_account, phone_number,
        is_active, is_deleted
      } = req.body;

      const employee: any = await checkItemFound.checkItem(
        id,
        Employee
      );

      const oldSnapshot = toAuditSnapshot(employee);

      const user = (req as any).user;

      if (code && code !== employee.code) {
        const existingCode = await Employee.findOne({ where: { code } });
        if (existingCode) {
          return next(new AppError("Employee code already exists", 400));
        }
        employee.code = code;
      }

      if (national_id && national_id !== employee.national_id) {
        const existingNationalId = await Employee.findOne({ where: { national_id } });
        if (existingNationalId) {
          return next(new AppError("Employee national_id already exists", 400));
        }
        employee.national_id = national_id;
      }

      if (phone_number && phone_number !== employee.phone_number) {
        const existingPhoneNumber = await Employee.findOne({ where: { phone_number } });
        if (existingPhoneNumber) {
          return next(new AppError("Employee phone_number already exists", 400));
        }
        employee.phone_number = phone_number;
      } 

      employee.full_name = full_name ?? employee.full_name;
      if (birth_date !== undefined) {
        employee.birth_date = birth_date;
        employee.age = calculateAge(birth_date);
      }
      employee.gender = gender ?? employee.gender;
      employee.phone_number = phone_number ?? employee.phone_number;
      employee.email = email ?? employee.email;
      employee.address = address ?? employee.address;
      employee.marital_status = marital_status ?? employee.marital_status;
      employee.qualification = qualification ?? employee.qualification;
      employee.bank_name = bank_name ?? employee.bank_name;
      employee.bank_account = bank_account ?? employee.bank_account;
      if (is_active !== undefined) employee.is_active = is_active;
      if (is_deleted !== undefined) employee.is_deleted = is_deleted;
      
      employee.updated_by = user?.id || employee.updated_by;

      await employee.save();

      await auditFromRequest(req, {
        action: "UPDATE",
        entityType: "Employee",
        entityId: employee.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(employee),
      });

      return res.status(200).json(
        formatResponse(
          200,
          "Employee updated successfully",
          employee
        )
      );
    } catch (error) {
      if ((error as any).name === "SequelizeUniqueConstraintError") {
        return res.status(400).json(formatResponse(400, "Employee code or national_id already exists"));
      }
      next(error);
    }
  }

  async deleteEmployee(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const user = (req as any).user;

      const employee: any = await checkItemFound.checkItem(
        id,
        Employee
      );

      const oldSnapshot = toAuditSnapshot(employee);

      // toggle soft delete
      employee.is_active = !employee.is_active;
      employee.is_deleted = !employee.is_deleted;
      employee.deleted_by = user?.id || employee.deleted_by;

      await employee.save();

      if (employee.is_deleted) {
        await EmployeeDocument.update({ is_deleted: true }, { where: { employee_id: id } });  
        await EmployeeContact.update({ is_deleted: true }, { where: { employee_id: id } });
        await EmployeeExperience.update({ is_deleted: true }, { where: { employee_id: id } });
      }

      await auditFromRequest(req, {
        action: "DELETE",
        entityType: "Employee",
        entityId: employee.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(employee),
      });

      return res.status(200).json(
        formatResponse(
          200,
          employee.is_deleted
            ? "Employee deleted successfully"
            : "Employee restored successfully",
          employee
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const employeeLogic = new EmployeeLogic();
