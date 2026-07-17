import { Request, Response, NextFunction } from "express";
import LeaveRequest from "../../../database/Models/leave_requests";
import Employee from "../../../database/Models/employee";
import LeaveType from "../../../database/Models/leaveType.model";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { sequelize } from "../../../database/db.connection";
import EmployeeLeaveBalance from "../../../database/Models/contract_leaves";
import { Transaction } from "sequelize";
import { AppError } from "../../utils/appError";
import {
  parsePeriod,
  stripPeriodKeys,
  dateFieldBetween,
  leavePeriodWhere,
  mergePeriodWhere,
} from "../../utils/periodFilter";
import { PayrollAccumulatorService } from "../payroll_summary/payroll_accumulator.service";
import { assertPeriodOpenForDate } from "../../utils/periodGuard";
import { auditFromRequest, toAuditSnapshot } from "../../service/audit/auditHelpers";
import { resolveActiveContractForLeave } from "../../service/leave/leaveContract.service";
import { erpEmitter, EVENTS } from "../../events/eventEmitter";

class LeaveRequestsLogic {



  /**
   * Helper to manage leave balance updates
   */
  private handleBalanceUpdate = async (
    employee_id: number,
    leave_type_id: number,
    days: number,
    date: Date | string,
    action: "deduct" | "restore",
    transaction: Transaction,
    actorUserId: number | null = null
  ) => {
    const leaveType: any = await LeaveType.findByPk(leave_type_id, { transaction });
    if (!leaveType) {
      throw new AppError("نوع الإجازة غير موجود", 404);
    }

    const contract = await resolveActiveContractForLeave(
      employee_id,
      actorUserId,
      transaction,
      { allowAutoCreate: action === "deduct" }
    );

    const year = new Date(date).getFullYear();
    const dayCount = Number(days);

    const [leaveBalance]: [any, boolean] = await EmployeeLeaveBalance.findOrCreate({
      where: {
        contract_id: contract.id,
        leave_type_id,
        year,
        is_deleted: false,
      },
      defaults: {
        contract_id: contract.id,
        leave_type_id,
        year,
        used_days: 0,
      },
      transaction,
    });

    if (action === "deduct") {
      const annualBalance = Number(leaveType.annual_balance ?? 0);
      const usedDays = Number(leaveBalance.used_days ?? 0);
      const remainingBalance = annualBalance - usedDays;

      if (remainingBalance < dayCount) {
        throw new AppError(
          `رصيد الإجازة غير كافٍ. المتبقي: ${remainingBalance} يوم، المطلوب: ${dayCount} يوم`,
          400
        );
      }
      leaveBalance.used_days = usedDays + dayCount;
    } else {
      leaveBalance.used_days = Math.max(0, Number(leaveBalance.used_days ?? 0) - dayCount);
    }

    await leaveBalance.save({ transaction });
  };

  private syncPaidLeaveAccumulator = async (
    employee_id: number,
    start_date: Date | string,
    days_count: number,
    action: "add" | "remove",
    transaction: Transaction
  ) => {
    const date = new Date(start_date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const delta = action === "add" ? Number(days_count) : -Number(days_count);

    if (delta === 0) {
      return;
    }

    await PayrollAccumulatorService.incrementPaidLeaveDays(
      employee_id,
      month,
      year,
      delta,
      transaction
    );
  }





  createLeaveRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let { employee_id, leave_type_id, start_date, end_date, days_count, status } = req.body;
      const user = (req as any).user;

      if (user?.employee_id) {
        employee_id = user.employee_id;
        if (!status || user?.role === "EMPLOYEE") {
          status = "pending";
        }
      } else if (!employee_id) {
        return next(new AppError("employee_id is required", 400));
      }

      await assertPeriodOpenForDate(start_date);

      await checkItemFound.checkItem(employee_id, Employee);
      const leaveType: any = await checkItemFound.checkItem(leave_type_id, LeaveType);

      let approvedBy = null;
      if (status === "approved" && user) {
        approvedBy = user.id;
      }

      const result = await sequelize.transaction(async (t: Transaction) => {
        // If status is approved, we need to deduct balance
        if (status === "approved") {
          await this.handleBalanceUpdate(employee_id, leave_type_id, days_count, start_date, "deduct", t, user?.id ?? null);
          await this.syncPaidLeaveAccumulator(employee_id, start_date, days_count, "add", t);
        }

        const leaveRequest = await LeaveRequest.create({
          employee_id,
          leave_type_id,
          start_date,
          end_date,
          days_count,
          status: status || "pending",
          approved_by: approvedBy,
        }, { transaction: t });

        return leaveRequest;
      });

      const auditAction =
        status === "approved"
          ? "APPROVE"
          : status === "rejected"
            ? "REJECT"
            : "CREATE";

      await auditFromRequest(req, {
        action: auditAction as any,
        entityType: "LeaveRequest",
        entityId: result.id,
        newValues: toAuditSnapshot(result),
      });

      if (status === "approved") {
        erpEmitter.emit(EVENTS.LEAVE_APPROVED, {
          employeeId: employee_id,
          days: days_count,
          leaveType: leaveType.name,
        });
      } else if (status === "rejected") {
        erpEmitter.emit(EVENTS.LEAVE_REJECTED, {
          employeeId: employee_id,
          reason: req.body.reason,
          leaveType: leaveType.name,
          days: days_count,
        });
      }

      return res.status(201).json(
        formatResponse(201, "Leave request created successfully", result)
      );
    } catch (error: any) {
      console.log("ERROR => ", error.message);
      console.log(error);
      next(error);
    }
  }

  

  allLeaveRequests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = (req as any).user;
      const period = parsePeriod(req.query as Record<string, unknown>);
      const scopedQuery = stripPeriodKeys({ ...req.query } as Record<string, unknown>);

      if (user?.role === "EMPLOYEE" || user?.employee_id) {
        if (!user.employee_id) {
          return next(new AppError("No employee profile linked to this account", 403));
        }
        scopedQuery.employee_id = String(user.employee_id);
      }

      const features = new ApiFeatures(scopedQuery)
        .filter()
        .search(["status", "$Employee.full_name$", "$Employee.code$"])
        .sort()
        .fields()
        .pagination();

      mergePeriodWhere(
        features,
        period,
        period ? leavePeriodWhere(period) : null
      );

      const { rows: leaveRequests, count: totalItems } =
        await LeaveRequest.findAndCountAll({
          ...features.queryOptions,
          subQuery: false,
          include: [
            { model: Employee, attributes: ["id", "full_name", "code"] },
            { model: LeaveType, attributes: ["id", "name"] }
          ]
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      return res.status(200).json(
        formatResponse(200, "success get all leave requests", leaveRequests, {
          page: features.pageNumber,
          limit: features.pageLimit,
          totalItems,
          totalPages,
        })
      );
    } catch (error: any) {
      console.log("ERROR => ", error.message);
      console.log(error);
      next(error);
    }
  }

  singleLeaveRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, LeaveRequest);

      const leaveRequest = await LeaveRequest.findOne({
        where: { id, is_deleted: false },
        include: [
          { model: Employee, attributes: ["id", "full_name", "code"] },
          { model: LeaveType, attributes: ["id", "name"] }
        ]
      });

      const user = (req as any).user;
      if (
        user?.employee_id &&
        leaveRequest?.employee_id !== user.employee_id
      ) {
        return next(new AppError("You are not allowed to view this leave request", 403));
      }

      return res.status(200).json(
        formatResponse(200, "success get leave request", leaveRequest)
      );
    } catch (error: any) {
      console.log("ERROR => ", error.message);
      console.log(error);
      next(error);
    }
  }

   updateLeaveRequest=async(
    req: Request,
    res: Response,
    next: NextFunction
  )=> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { reason,employee_id, leave_type_id, start_date, end_date, days_count, status, is_deleted } = req.body;
      const user = (req as any).user;

      const leaveRequest: any = await checkItemFound.checkItem(
        id,
        LeaveRequest
      );

      const oldSnapshot = toAuditSnapshot(leaveRequest);

      await assertPeriodOpenForDate(leaveRequest.start_date);
      if (start_date !== undefined) {
        await assertPeriodOpenForDate(start_date);
      }

      const oldStatus = leaveRequest.status;
      const oldDays = leaveRequest.days_count;
      const oldEmployeeId = leaveRequest.employee_id;
      const oldLeaveTypeId = leaveRequest.leave_type_id;
      const oldStartDate = leaveRequest.start_date;

      const updatedRequest = await sequelize.transaction(async (t: Transaction) => {
        // 1. Handle Status Change (Deduct/Restore)
        if (status && status !== oldStatus) {
            // Pending/Rejected -> Approved (Deduct)
            if (status === "approved" && oldStatus !== "approved") {
                console.log({
                    employee_id: employee_id || oldEmployeeId,
                    leave_type_id: leave_type_id || oldLeaveTypeId,
                    days: days_count || oldDays,
                    date: start_date || oldStartDate,
                });
                await this.handleBalanceUpdate(
                    employee_id || oldEmployeeId, 
                    leave_type_id || oldLeaveTypeId, 
                    days_count || oldDays, 
                    start_date || oldStartDate, 
                    "deduct", 
                    t,
                    user?.id ?? null
                );
                await this.syncPaidLeaveAccumulator(
                    employee_id || oldEmployeeId,
                    start_date || oldStartDate,
                    days_count || oldDays,
                    "add",
                    t
                );
            } 
            // Approved -> Pending/Rejected (Restore)
            else if (status !== "approved" && oldStatus === "approved") {
                console.log({
                    employee_id: oldEmployeeId,
                    leave_type_id: oldLeaveTypeId,
                    days: oldDays,
                    date: oldStartDate,
                });
                await this.handleBalanceUpdate(
                    oldEmployeeId, 
                    oldLeaveTypeId, 
                    oldDays, 
                    oldStartDate, 
                    "restore", 
                    t,
                    user?.id ?? null
                );
                await this.syncPaidLeaveAccumulator(
                    oldEmployeeId,
                    oldStartDate,
                    oldDays,
                    "remove",
                    t
                );
            }
        }

        // Add reason if rejected
        if (reason && status === "rejected") {
            leaveRequest.reason = reason;
            leaveRequest.rejected_by = user.id;
        }

        // 2. Update Request Data
        if (employee_id && employee_id !== leaveRequest.employee_id) {
          await checkItemFound.checkItem(employee_id, Employee);
          leaveRequest.employee_id = employee_id;
        }

        if (leave_type_id && leave_type_id !== leaveRequest.leave_type_id) {
          await checkItemFound.checkItem(leave_type_id, LeaveType);
          leaveRequest.leave_type_id = leave_type_id;
        }

        if (start_date !== undefined) leaveRequest.start_date = start_date;
        if (end_date !== undefined) leaveRequest.end_date = end_date;

        const statusChanging = status !== undefined && status !== oldStatus;
        const effectiveStatus =
          status !== undefined ? status : leaveRequest.status;

        // Adjust balance when days_count changes on an already-approved request
        if (
          effectiveStatus === "approved" &&
          days_count !== undefined &&
          Number(days_count) !== Number(oldDays) &&
          !statusChanging
        ) {
          const diff = Number(days_count) - Number(oldDays);
          const empId = leaveRequest.employee_id;
          const typeId = leaveRequest.leave_type_id;
          const startDate = leaveRequest.start_date;

          if (diff > 0) {
            await this.handleBalanceUpdate(empId, typeId, diff, startDate, "deduct", t, user?.id ?? null);
            await this.syncPaidLeaveAccumulator(empId, startDate, diff, "add", t);
          } else if (diff < 0) {
            const restoreDays = Math.abs(diff);
            await this.handleBalanceUpdate(
              empId,
              typeId,
              restoreDays,
              startDate,
              "restore",
              t,
              user?.id ?? null
            );
            await this.syncPaidLeaveAccumulator(
              empId,
              startDate,
              restoreDays,
              "remove",
              t
            );
          }
        }

        if (days_count !== undefined) leaveRequest.days_count = days_count;
        
        if (status !== undefined) {
          leaveRequest.status = status;
          if (status === "approved" && user) {
             leaveRequest.approved_by = user.id;
          } else if (status !== "approved") {
             leaveRequest.approved_by = null;
          }
        }

        if (is_deleted !== undefined) leaveRequest.is_deleted = is_deleted;

        await leaveRequest.save({ transaction: t });
        return leaveRequest;
      });

      let auditAction: "UPDATE" | "APPROVE" | "REJECT" = "UPDATE";
      if (status && status !== oldStatus) {
        if (status === "approved") auditAction = "APPROVE";
        else if (status === "rejected") auditAction = "REJECT";
      }

      await auditFromRequest(req, {
        action: auditAction,
        entityType: "LeaveRequest",
        entityId: updatedRequest.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(updatedRequest),
      });

      if (status && status !== oldStatus) {
        const leaveTypeRecord: any = await LeaveType.findByPk(updatedRequest.leave_type_id);
        const leaveTypeName = leaveTypeRecord?.name ?? "إجازة";

        if (status === "approved") {
          erpEmitter.emit(EVENTS.LEAVE_APPROVED, {
            employeeId: updatedRequest.employee_id,
            days: updatedRequest.days_count,
            leaveType: leaveTypeName,
          });
        } else if (status === "rejected") {
          erpEmitter.emit(EVENTS.LEAVE_REJECTED, {
            employeeId: updatedRequest.employee_id,
            reason: updatedRequest.reason ?? reason,
            leaveType: leaveTypeName,
            days: updatedRequest.days_count,
          });
        }
      }

      return res.status(200).json(
        formatResponse(
          200,
          "Leave request updated successfully",
          updatedRequest
        )
      );
    } catch (error: any) {
      console.log("ERROR => ", error.message);
      console.log(error);
      next(error);
    }
  }

  deleteLeaveRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const leaveRequest: any = await checkItemFound.checkItem(
        id,
        LeaveRequest
      );

      const oldSnapshot = toAuditSnapshot(leaveRequest);

      await assertPeriodOpenForDate(leaveRequest.start_date);

      await sequelize.transaction(async (t: Transaction) => {
        const actorId = (req as any).user?.id ?? null;
        // If an approved request is being deleted, restore balance
        if (!leaveRequest.is_deleted && leaveRequest.status === "approved") {
            await this.handleBalanceUpdate(
                leaveRequest.employee_id,
                leaveRequest.leave_type_id,
                leaveRequest.days_count,
                leaveRequest.start_date,
                "restore",
                t,
                actorId
            );
            await this.syncPaidLeaveAccumulator(
                leaveRequest.employee_id,
                leaveRequest.start_date,
                leaveRequest.days_count,
                "remove",
                t
            );
        } 
        // If a deleted approved request is being restored, deduct balance
        else if (leaveRequest.is_deleted && leaveRequest.status === "approved") {
            await this.handleBalanceUpdate(
                leaveRequest.employee_id,
                leaveRequest.leave_type_id,
                leaveRequest.days_count,
                leaveRequest.start_date,
                "deduct",
                t,
                actorId
            );
            await this.syncPaidLeaveAccumulator(
                leaveRequest.employee_id,
                leaveRequest.start_date,
                leaveRequest.days_count,
                "add",
                t
            );
        }

        leaveRequest.is_deleted = !leaveRequest.is_deleted;
        await leaveRequest.save({ transaction: t });
      });

      await auditFromRequest(req, {
        action: "DELETE",
        entityType: "LeaveRequest",
        entityId: leaveRequest.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(leaveRequest),
      });

      return res.status(200).json(
        formatResponse(
          200,
          leaveRequest.is_deleted ? "Leave request deleted successfully" : "Leave request restored successfully",
          leaveRequest
        )
      );
    } catch (error: any) {
      console.log("ERROR => ", error.message);
      console.log(error);
      next(error);
    }
  }
}

export const leaveRequestsLogic = new LeaveRequestsLogic();
