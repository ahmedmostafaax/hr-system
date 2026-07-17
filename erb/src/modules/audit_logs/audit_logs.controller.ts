import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import AuditLog from "../../../database/Models/audit_logs";
import { formatResponse } from "../../utils/responseFormatter";

class AuditLogsController {
  async getAllAuditLogs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        entity_type,
        entity_id,
        user_id,
        action,
        from_date,
        to_date,
        page = 1,
        limit = 20,
      } = req.query as Record<string, string>;

      const where: any = {};

      if (entity_type) {
        where.entity_type = entity_type;
      }
      if (entity_id) {
        where.entity_id = Number(entity_id);
      }
      if (user_id) {
        where.user_id = Number(user_id);
      }
      if (action) {
        where.action = action;
      }
      if (from_date || to_date) {
        where.created_at = {};
        if (from_date) {
          where.created_at[Op.gte] = new Date(from_date);
        }
        if (to_date) {
          where.created_at[Op.lte] = new Date(to_date);
        }
      }

      const pageNumber = Math.max(1, Number(page) || 1);
      const pageLimit = Math.min(100, Math.max(1, Number(limit) || 20));
      const offset = (pageNumber - 1) * pageLimit;

      const { rows: logs, count: totalItems } = await AuditLog.findAndCountAll({
        where,
        order: [["created_at", "DESC"]],
        limit: pageLimit,
        offset,
      });

      const totalPages = Math.ceil(totalItems / pageLimit);

      res.status(200).json(
        formatResponse(200, "success get audit logs", logs, {
          page: pageNumber,
          limit: pageLimit,
          totalItems,
          totalPages,
        })
      );
    } catch (error) {
      next(error);
    }
  }
}

export const auditLogsController = new AuditLogsController();
