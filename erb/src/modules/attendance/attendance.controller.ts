import { Request, Response, NextFunction } from "express";
import Attendance from "../../../database/Models/attendance";
import Employee from "../../../database/Models/employee";
import Department from "../../../database/Models/department.model";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import EmployeeContract from "../../../database/Models/contracts";
import Shift from "../../../database/Models/shift.model";
import { PayrollAccumulatorService } from "../payroll_summary/payroll_accumulator.service";
import { assertPeriodOpenForDate } from "../../utils/periodGuard";
import { AppError } from "../../utils/appError";
import {
  parsePeriod,
  stripPeriodKeys,
  dateFieldBetween,
  mergePeriodWhere,
} from "../../utils/periodFilter";
import {
  calculateLateHours,
  currentTimeString,
  localWorkDate,
  normalizeTimeValue,
  roundHours,
  timeToMinutes,
} from "./attendanceTime.utils";

type ScanAction = "auto" | "check_in" | "check_out";

interface AttendanceSummarySnapshot {
  employee_id: number;
  work_date: string | Date;
  check_in: string | null;
  overtime_hours: number;
  is_deleted: boolean;
}

class AttendanceLogic {
  private getMonthYear(workDate: string | Date) {
    const date = new Date(workDate);
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  }

  private snapshotForSummary(record: any): AttendanceSummarySnapshot {
    return {
      employee_id: Number(record.employee_id),
      work_date: record.work_date,
      check_in: record.check_in ?? null,
      overtime_hours: parseFloat(record.overtime_hours || 0),
      is_deleted: !!record.is_deleted,
    };
  }

  /** Sync attended_days + overtime_hours in the monthly summary for one attendance row */
  private async applySummaryForRecord(
    record: AttendanceSummarySnapshot,
    direction: "add" | "remove"
  ) {
    if (!record.check_in || record.is_deleted) {
      return;
    }

    const sign = direction === "add" ? 1 : -1;
    const { month, year } = this.getMonthYear(record.work_date);

    await PayrollAccumulatorService.incrementAttendedDays(
      record.employee_id,
      month,
      year,
      sign
    );

    if (record.overtime_hours > 0) {
      await PayrollAccumulatorService.incrementOvertime(
        record.employee_id,
        month,
        year,
        sign * record.overtime_hours
      );
    }
  }

  private async reconcileSummaryChange(
    before: AttendanceSummarySnapshot,
    after: AttendanceSummarySnapshot
  ) {
    await this.applySummaryForRecord(before, "remove");
    await this.applySummaryForRecord(after, "add");
  }

async createAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      employee_id,
      work_date: workDateInput,
      check_in,
      check_out,
      notes,
      action: actionInput,
    } = req.body;

    const action: ScanAction =
      actionInput === "check_in" || actionInput === "check_out"
        ? actionInput
        : "auto";

    const work_date =
      workDateInput != null
        ? String(workDateInput).slice(0, 10)
        : localWorkDate();

    await assertPeriodOpenForDate(work_date);

    await checkItemFound.checkItem(employee_id, Employee);

    const contract = await EmployeeContract.findOne({
      where: {
        employee_id,
        status: "active",
        is_deleted: false,
      },
    });

    if (!contract) {
      return next(
        new AppError("لا يوجد عقد نشط لهذا الموظف", 404)
      );
    }

    const department_id = contract.department_id;

    const shift = await Shift.findByPk(contract.shift_id);

    if (!shift) {
      return next(new AppError("الشيفت غير موجود", 404));
    }

    const now = normalizeTimeValue(
      check_in || check_out || currentTimeString()
    );

    const shiftStartMinutes = timeToMinutes(shift.start_time);
    const shiftEndMinutes = timeToMinutes(shift.end_time);
    const graceMinutes = Number(shift.grace_minutes) || 0;

    const attendanceExists = await Attendance.findOne({
      where: {
        employee_id,
        work_date,
        is_deleted: false,
      },
    });

    if (!attendanceExists) {
      if (action === "check_out") {
        return next(
          new AppError("لم يسجّل الموظف حضوراً اليوم — لا يمكن تسجيل الانصراف", 400)
        );
      }

      const checkInMinutes = timeToMinutes(check_in || now);
      const late_hours = calculateLateHours(
        checkInMinutes,
        shiftStartMinutes,
        graceMinutes
      );

      const attendance = await Attendance.create({
        employee_id,
        department_id,
        work_date,
        check_in: check_in || now,
        late_hours,
        notes,
      });

      const workDateObj = new Date(work_date);
      await PayrollAccumulatorService.incrementAttendedDays(
        Number(employee_id),
        workDateObj.getMonth() + 1,
        workDateObj.getFullYear(),
        1
      );

      return res.status(201).json(
        formatResponse(201, "Check-in recorded", {
          ...attendance.toJSON(),
          scan_action: "check_in",
        })
      );
    }

    if (!attendanceExists.check_out) {
      if (action === "check_in") {
        return next(
          new AppError("الموظف مسجّل حضوره بالفعل اليوم", 400)
        );
      }

      const checkInMinutes = timeToMinutes(attendanceExists.check_in);
      const checkOutMinutes = timeToMinutes(check_out || now);

      const late_hours = calculateLateHours(
        checkInMinutes,
        shiftStartMinutes,
        graceMinutes
      );

      const working_hours = roundHours((checkOutMinutes - checkInMinutes) / 60);

      const overtime_hours =
        checkOutMinutes > shiftEndMinutes
          ? roundHours((checkOutMinutes - shiftEndMinutes) / 60)
          : 0;

      attendanceExists.check_out = check_out || now;
      attendanceExists.late_hours = late_hours;
      attendanceExists.working_hours = working_hours;
      attendanceExists.overtime_hours = overtime_hours;

      await attendanceExists.save();

      if (overtime_hours > 0) {
        const workDateObj = new Date(attendanceExists.work_date);
        await PayrollAccumulatorService.incrementOvertime(
          Number(employee_id),
          workDateObj.getMonth() + 1,
          workDateObj.getFullYear(),
          overtime_hours
        );
      }

      return res.status(200).json(
        formatResponse(200, "Check-out recorded", {
          ...attendanceExists.toJSON(),
          scan_action: "check_out",
        })
      );
    }

    return next(
      new AppError("تم تسجيل الحضور والانصراف لهذا اليوم مسبقاً", 400)
    );
  } catch (error) {
    next(error);
  }
}

  async allAttendance(
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
        period ? dateFieldBetween("work_date", period) : null
      );

      const { rows: attendanceRecords, count: totalItems } =
        await Attendance.findAndCountAll({
          ...features.queryOptions,
          subQuery: false,
          include: [
            { model: Employee, attributes: ["id", "full_name", "code"] },
            { model: Department, attributes: ["id", "name"] }
          ]
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      return res.status(200).json(
        formatResponse(200, "success get all attendance records", attendanceRecords, {
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

  async singleAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, Attendance);

      const attendance = await Attendance.findOne({
        where: { id, is_deleted: false },
        include: [
          { model: Employee, attributes: ["id", "full_name", "code"] },
          { model: Department, attributes: ["id", "name"] }
        ]
      });

      return res.status(200).json(
        formatResponse(200, "success get attendance", attendance)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { employee_id, department_id, work_date, check_in, check_out, late_hours, overtime_hours, working_hours, notes, is_deleted } = req.body;

      const attendance: any = await checkItemFound.checkItem(
        id,
        Attendance
      );

      await assertPeriodOpenForDate(attendance.work_date);
      if (work_date !== undefined) {
        await assertPeriodOpenForDate(work_date);
      }

      const beforeSnapshot = this.snapshotForSummary(attendance);

      if (employee_id && employee_id !== attendance.employee_id) {
        await checkItemFound.checkItem(employee_id, Employee);
        attendance.employee_id = employee_id;
      }

      if (department_id && department_id !== attendance.department_id) {
        await checkItemFound.checkItem(department_id, Department);
        attendance.department_id = department_id;
      }

      if (work_date !== undefined) attendance.work_date = work_date;
      if (check_in !== undefined) attendance.check_in = check_in;
      if (check_out !== undefined) attendance.check_out = check_out;
      if (late_hours !== undefined) attendance.late_hours = late_hours;
      if (overtime_hours !== undefined) attendance.overtime_hours = overtime_hours;
      if (working_hours !== undefined) attendance.working_hours = working_hours;
      if (notes !== undefined) attendance.notes = notes;
      if (is_deleted !== undefined) attendance.is_deleted = is_deleted;

      await attendance.save();

      await this.reconcileSummaryChange(
        beforeSnapshot,
        this.snapshotForSummary(attendance)
      );

      return res.status(200).json(
        formatResponse(
          200,
          "Employee attendance updated successfully",
          attendance
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteAttendance(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const attendance: any = await checkItemFound.checkItem(
        id,
        Attendance
      );

      await assertPeriodOpenForDate(attendance.work_date);

      const beforeSnapshot = this.snapshotForSummary(attendance);
      attendance.is_deleted = !attendance.is_deleted;
      await attendance.save();

      await this.reconcileSummaryChange(
        beforeSnapshot,
        this.snapshotForSummary(attendance)
      );

      return res.status(200).json(
        formatResponse(
          200,
          attendance.is_deleted ? "Employee attendance deleted successfully" : "Employee attendance restored successfully",
          attendance
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceLogic = new AttendanceLogic();
