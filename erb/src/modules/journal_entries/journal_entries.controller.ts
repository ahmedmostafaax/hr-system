import { Request, Response, NextFunction } from "express";
import JournalEntry from "../../../database/Models/journal_entries";
import JournalLine from "../../../database/Models/journal_lines";
import Account from "../../../database/Models/Account";
import { ApiFeatures } from "../../utils/apiFeatures";
import { checkItemFound } from "../../middleware/chickiItemFound";
import { AppError } from "../../utils/appError";
import { formatResponse } from "../../utils/responseFormatter";
import { journalEntryService } from "./journalEntry.service";
import { assertPeriodOpenForDate } from "../../utils/periodGuard";
import { auditFromRequest, toAuditSnapshot } from "../../service/audit/auditHelpers";

class JournalEntriesController {
  async createJournalEntry(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        entry_type,
        description,
        lines,
        payroll_run_id,
        reference_type,
        reference_id,
        posting_date,
        status,
      } = req.body;

      const effectivePostingDate = posting_date ?? new Date();
      await assertPeriodOpenForDate(effectivePostingDate);

      const entry = await journalEntryService.createJournalEntry({
        entry_type,
        description,
        lines,
        payroll_run_id,
        reference_type,
        reference_id,
        posting_date,
        status,
        created_by: req.user?.id ?? null,
      });

      await auditFromRequest(req, {
        action: "CREATE",
        entityType: "JournalEntry",
        entityId: entry?.id ?? null,
        newValues: toAuditSnapshot(entry),
      });

      res
        .status(201)
        .json(formatResponse(201, "Journal entry created successfully", entry));
    } catch (error) {
      next(error);
    }
  }

  async getAllJournalEntries(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const features = new ApiFeatures(req.query)
        .filter()
        .search(["entry_type", "description", "reference_type"])
        .sort()
        .fields()
        .pagination();

      const { rows: entries, count: totalItems } =
        await JournalEntry.findAndCountAll({
          ...features.queryOptions,
          where: {
            is_deleted: false,
            ...features.queryOptions.where,
          },
          include: [
            {
              model: JournalLine,
              as: "lines",
              attributes: ["id", "account_id", "account_code", "debit", "credit"],
            },
          ],
          distinct: true,
        });

      const totalPages = Math.ceil(totalItems / features.pageLimit);

      res.status(200).json(
        formatResponse(200, "Journal entries fetched successfully", entries, {
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

  async getSingleJournalEntry(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      await checkItemFound.checkItem(id, JournalEntry);

      const entry = await JournalEntry.findOne({
        where: { id, is_deleted: false },
        include: [
          {
            model: JournalLine,
            as: "lines",
            include: [
              { model: Account, as: "account", attributes: ["id", "code", "name", "type"] },
            ],
          },
        ],
      });

      res
        .status(200)
        .json(formatResponse(200, "Journal entry fetched successfully", entry));
    } catch (error) {
      next(error);
    }
  }

  async updateJournalEntryStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }
      const { status } = req.body;

      const entry: any = await checkItemFound.checkItem(id, JournalEntry);

      const oldSnapshot = toAuditSnapshot(entry);

      await assertPeriodOpenForDate(entry.posting_date);

      if (entry.status === "cancelled") {
        return next(
          new AppError("Cancelled journal entries cannot be updated", 400)
        );
      }

      if (entry.status === "posted" && status === "draft") {
        return next(
          new AppError("Posted journal entries cannot be reverted to draft", 400)
        );
      }

      if (entry.status === status) {
        return next(
          new AppError(`Journal entry is already ${status}`, 400)
        );
      }

      entry.status = status;
      await entry.save();

      const updated = await JournalEntry.findOne({
        where: { id: entry.id, is_deleted: false },
        include: [
          {
            model: JournalLine,
            as: "lines",
            include: [
              { model: Account, as: "account", attributes: ["id", "code", "name", "type"] },
            ],
          },
        ],
      });

      res
        .status(200)
        .json(formatResponse(200, "Journal entry status updated successfully", updated));

      await auditFromRequest(req, {
        action: "UPDATE",
        entityType: "JournalEntry",
        entityId: entry.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(updated),
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteJournalEntry(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = Number.parseInt(String(req.params.id), 10);
      if (Number.isNaN(id) || id <= 0) {
        return next(new AppError("Invalid id", 400));
      }

      const entry: any = await checkItemFound.checkItem(id, JournalEntry);

      const oldSnapshot = toAuditSnapshot(entry);

      await assertPeriodOpenForDate(entry.posting_date);

      entry.is_deleted = !entry.is_deleted;
      await entry.save();

      await auditFromRequest(req, {
        action: "DELETE",
        entityType: "JournalEntry",
        entityId: entry.id,
        oldValues: oldSnapshot,
        newValues: toAuditSnapshot(entry),
      });

      res.status(200).json(
        formatResponse(
          200,
          entry.is_deleted
            ? "Journal entry deleted successfully"
            : "Journal entry restored successfully",
          entry
        )
      );
    } catch (error) {
      next(error);
    }
  }
}

export const journalEntriesController = new JournalEntriesController();
