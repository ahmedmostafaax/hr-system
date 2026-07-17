import { Request, Response, NextFunction } from "express";
import EmployeeBonus from "../../../database/Models/employee_bonuses";
import Employee from "../../../database/Models/employee";
import BonusType from "../../../database/Models/bonus_types";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { ApiFeatures } from "../../utils/apiFeatures";
import { formatResponse } from "../../utils/responseFormatter";
import { erpEmitter, EVENTS } from "../../events/eventEmitter";
import { assertPeriodOpenForDate } from "../../utils/periodGuard";
import { auditFromRequest, toAuditSnapshot } from "../../service/audit/auditHelpers";
import { assertCanChangeApprovalStatus } from "../../utils/approvalGuard";
import { AppError } from "../../utils/appError";
import {
  parsePeriod,
  stripPeriodKeys,
  bonusPeriodWhere,
  mergePeriodWhere,
} from "../../utils/periodFilter";

class EmployeeBonusesLogic {
  async createBonus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { employee_id, bonus_type_id, amount, grant_date, is_paid, payment_month, payment_year } = req.body;

      await assertPeriodOpenForDate(grant_date);
      await checkItemFound.checkItem(employee_id, Employee);
      await checkItemFound.checkItem(bonus_type_id, BonusType);

      const bonus = await EmployeeBonus.create({
        employee_id,
        bonus_type_id,
        amount,
        grant_date,
        is_paid: is_paid || false,
        payment_month,
        payment_year,
        approval_status: "pending",
      });

      await auditFromRequest(req, {
        action: "CREATE",
        entityType: "EmployeeBonus",
        entityId: bonus.id,
        newValues: toAuditSnapshot(bonus),
      });

      res.status(201).json(
        formatResponse(201, "Employee bonus created successfully", bonus)
      );
    } catch (error) {
      next(error);
    }
  }

  async allBonuses(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const period = parsePeriod(req.query as Record<string, unknown>);
      const query = stripPeriodKeys(req.query as Record<string, unknown>);

      const features = new ApiFeatures(query)
        .filter()
        .search(["is_paid", "payment_month", "payment_year", "approval_status", "$Employee.full_name$", "$Employee.code$"])
        .sort()
        .fields()
        .pagination();

      mergePeriodWhere(
        features,
        period,
        period ? bonusPeriodWhere(period) : null
      );

      const { rows: bonuses, count: totalItems } =
        await EmployeeBonus.findAndCountAll({
          ...features.queryOptions,
          subQuery: false,
          include: [
            { model: Employee, attributes: ["id", "full_name", "code"] },
            { model: BonusType, attributes: ["id", "name"] }
          ]
        });

      const totalPages = Math.ceil(
        totalItems / features.pageLimit
      );

      res.status(200).json(
        formatResponse(200, "success get all bonuses", bonuses, {
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

  async singleBonus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, EmployeeBonus);

      const bonus = await EmployeeBonus.findOne({
        where: { id, is_deleted: false },
        include: [
          { model: Employee, attributes: ["id", "full_name", "code"] },
          { model: BonusType, attributes: ["id", "name","payment_type","default_amount"] }
        ]
      });

      res.status(200).json(
        formatResponse(200, "success get bonus", bonus)
      );
    } catch (error) {
      next(error);
    }
  }

  async updateBonus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const {
        employee_id,
        bonus_type_id,
        amount,
        grant_date,
        is_paid,
        payment_month,
        payment_year,
        approval_status,
        rejection_reason,
        is_deleted,
      } = req.body;

      const bonus: any = await checkItemFound.checkItem(
        id,
        EmployeeBonus
      );

      const oldSnapshot = toAuditSnapshot(bonus);
      const oldApprovalStatus = bonus.approval_status;

      await assertPeriodOpenForDate(bonus.grant_date);
      if (grant_date !== undefined) {
        await assertPeriodOpenForDate(grant_date);
      }

      if (employee_id && employee_id !== bonus.employee_id) {
        await checkItemFound.checkItem(employee_id, Employee);
        bonus.employee_id = employee_id;
      }

      if (bonus_type_id && bonus_type_id !== bonus.bonus_type_id) {
        await checkItemFound.checkItem(bonus_type_id, BonusType);
        bonus.bonus_type_id = bonus_type_id;
      }

      const oldAmount = parseFloat(String(bonus.amount));
      const bonusTypeRecord: any = await BonusType.findByPk(bonus.bonus_type_id);
      const paymentType = bonusTypeRecord?.payment_type ?? "cash";

      if (amount !== undefined) bonus.amount = amount;
      if (grant_date !== undefined) bonus.grant_date = grant_date;
      if (is_paid !== undefined) bonus.is_paid = is_paid;
      if (payment_month !== undefined) bonus.payment_month = payment_month;
      if (payment_year !== undefined) bonus.payment_year = payment_year;
      if (is_deleted !== undefined) bonus.is_deleted = is_deleted;

      let approvalChanged = false;
      if (approval_status !== undefined && approval_status !== oldApprovalStatus) {
        assertCanChangeApprovalStatus(req);
        approvalChanged = true;

        if (approval_status === "approved") {
          bonus.approved_by = (req as any).user.id;
          bonus.approved_at = new Date();
          bonus.rejection_reason = null;
        } else if (approval_status === "rejected") {
          bonus.rejection_reason =
            rejection_reason !== undefined ? rejection_reason || null : bonus.rejection_reason;
          bonus.approved_by = null;
          bonus.approved_at = null;
        }

        bonus.approval_status = approval_status;
      } else if (rejection_reason !== undefined && bonus.approval_status === "rejected") {
        assertCanChangeApprovalStatus(req);
        bonus.rejection_reason = rejection_reason || null;
      }

      await bonus.save();

      if (approvalChanged && approval_status === "approved" && oldApprovalStatus !== "approved") {
        erpEmitter.emit(EVENTS.BONUS_CREATED, bonus.id, req.user);
        erpEmitter.emit(EVENTS.BONUS_APPROVED, {
          employeeId: bonus.employee_id,
          amount: parseFloat(String(bonus.amount)),
        });
      }

      if (approvalChanged && approval_status === "rejected" && oldApprovalStatus === "approved") {
        erpEmitter.emit(
          EVENTS.BONUS_DELETED,
          {
            bonusId: bonus.id,
            amount: parseFloat(String(bonus.amount)),
            paymentType,
            employeeId: bonus.employee_id,
          },
          req.user
        );
      }

      const newAmount = parseFloat(String(bonus.amount));
      if (
        amount !== undefined &&
        oldAmount !== newAmount &&
        bonus.approval_status === "approved"
      ) {
        erpEmitter.emit(
          EVENTS.BONUS_UPDATED,
          {
            bonusId: bonus.id,
            oldAmount,
            newAmount,
            paymentType,
            employeeId: bonus.employee_id,
          },
          req.user
        );
      }

      let auditAction: "UPDATE" | "APPROVE" | "REJECT" = "UPDATE";
      if (approvalChanged) {
        if (approval_status === "approved") auditAction = "APPROVE";
        else if (approval_status === "rejected") auditAction = "REJECT";
      }

      await auditFromRequest(req, {
        action: auditAction,
        entityType: "EmployeeBonus",
        entityId: bonus.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(bonus),
      });

      res.status(200).json(
        formatResponse(
          200,
          "Employee bonus updated successfully",
          bonus
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteBonus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const bonus: any = await checkItemFound.checkItem(
        id,
        EmployeeBonus
      );

      const oldSnapshot = toAuditSnapshot(bonus);

      await assertPeriodOpenForDate(bonus.grant_date);

      const wasDeleted = bonus.is_deleted;
      const wasApproved = bonus.approval_status === "approved";
      const bonusTypeRecord: any = await BonusType.findByPk(bonus.bonus_type_id);
      const paymentType = bonusTypeRecord?.payment_type ?? "cash";

      bonus.is_deleted = !bonus.is_deleted;
      await bonus.save();

      if (bonus.is_deleted && !wasDeleted && wasApproved) {
        erpEmitter.emit(
          EVENTS.BONUS_DELETED,
          {
            bonusId: bonus.id,
            amount: parseFloat(String(bonus.amount)),
            paymentType,
            employeeId: bonus.employee_id,
          },
          req.user
        );
      }

      await auditFromRequest(req, {
        action: "DELETE",
        entityType: "EmployeeBonus",
        entityId: bonus.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(bonus),
      });

      res.status(200).json(
        formatResponse(
          200,
          bonus.is_deleted ? "Employee bonus deleted successfully" : "Employee bonus restored successfully",
          bonus
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const employeeBonusesLogic = new EmployeeBonusesLogic();
