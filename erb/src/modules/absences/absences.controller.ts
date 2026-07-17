import { Request, Response, NextFunction } from "express";
import EmployeeAbsence from "../../../database/Models/absences";
import Employee from "../../../database/Models/employee";
import AbsenceType from "../../../database/Models/absence_type";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { assertPeriodOpenForDate } from "../../utils/periodGuard";
import { AppError } from "../../utils/appError";
import {
  parsePeriod,
  stripPeriodKeys,
  dateFieldBetween,
  mergePeriodWhere,
} from "../../utils/periodFilter";

class AbsencesLogic {
  async createAbsence(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { employee_id, absence_type_id, absence_date, deduction_days, notes } = req.body;

      await assertPeriodOpenForDate(absence_date);

      await checkItemFound.checkItem(employee_id, Employee);
      await checkItemFound.checkItem(absence_type_id, AbsenceType);

      const absence = await EmployeeAbsence.create({
        employee_id,
        absence_type_id,
        absence_date,
        deduction_days,
        notes,
      });

      return res.status(201).json(
        formatResponse(201, "Employee absence created successfully", absence)
      );
    } catch (error) {
      next(error);
    }
  }

  async allAbsences(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const period = parsePeriod(req.query as Record<string, unknown>);
      const query = stripPeriodKeys(req.query as Record<string, unknown>);

      const features = new ApiFeatures(query)
        .filter()
        .search(["notes", "$Employee.full_name$", "$Employee.code$"])
        .sort()
        .fields()
        .pagination();

      mergePeriodWhere(
        features,
        period,
        period ? dateFieldBetween("absence_date", period) : null
      );

      const { rows: absences, count: totalItems } =
        await EmployeeAbsence.findAndCountAll({
          ...features.queryOptions,
          subQuery: false,
          include: [
            { model: Employee, attributes: ["id", "full_name", "code"] },
            { model: AbsenceType, attributes: ["id", "name"] }
          ]
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      return res.status(200).json(
        formatResponse(200, "success get all absences", absences, {
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

  async singleAbsence(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, EmployeeAbsence);

      const absence = await EmployeeAbsence.findOne({
        where: { id, is_deleted: false },
        include: [
          { model: Employee, attributes: ["id", "full_name", "code"] },
          { model: AbsenceType, attributes: ["id", "name","deduct_days"] }
        ]
      });

      return res.status(200).json(
        formatResponse(200, "success get absence", absence)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateAbsence(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { employee_id, absence_type_id, absence_date, deduction_days, notes, is_deleted } = req.body;

      const absence: any = await checkItemFound.checkItem(
        id,
        EmployeeAbsence
      );

      await assertPeriodOpenForDate(absence.absence_date);
      if (absence_date !== undefined) {
        await assertPeriodOpenForDate(absence_date);
      }

      if (employee_id && employee_id !== absence.employee_id) {
        await checkItemFound.checkItem(employee_id, Employee);
        absence.employee_id = employee_id;
      }

      if (absence_type_id && absence_type_id !== absence.absence_type_id) {
        await checkItemFound.checkItem(absence_type_id, AbsenceType);
        absence.absence_type_id = absence_type_id;
      }

      if (absence_date !== undefined) absence.absence_date = absence_date;
      if (deduction_days !== undefined) absence.deduction_days = deduction_days;
      if (notes !== undefined) absence.notes = notes;
      if (is_deleted !== undefined) absence.is_deleted = is_deleted;

      await absence.save();

      return res.status(200).json(
        formatResponse(
          200,
          "Employee absence updated successfully",
          absence
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteAbsence(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const absence: any = await checkItemFound.checkItem(
        id,
        EmployeeAbsence
      );

      await assertPeriodOpenForDate(absence.absence_date);

      // soft delete toggle
      absence.is_deleted = !absence.is_deleted;
      await absence.save();

      return res.status(200).json(
        formatResponse(
          200,
          absence.is_deleted ? "Employee absence deleted successfully" : "Employee absence restored successfully",
          absence
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const absencesLogic = new AbsencesLogic();
