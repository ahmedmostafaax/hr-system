import { Router } from "express";
import { journalEntriesController } from "./journal_entries.controller";
import { auth } from "../auth/auth.controller";
import { validationMiddleware } from "../../middleware/validation";
import { journalEntriesValidation } from "./journal_entries.validation";

const journalEntriesRouter = Router();

journalEntriesRouter
  .route("/")
  .post(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"),
    validationMiddleware.validate(journalEntriesValidation.createJournalEntry),
    journalEntriesController.createJournalEntry
  )
  .get(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"),
    journalEntriesController.getAllJournalEntries
  );

journalEntriesRouter
  .route("/:id")
  .get(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"),
    validationMiddleware.validate(journalEntriesValidation.idParam),
    journalEntriesController.getSingleJournalEntry
  )
  .patch(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"),
    validationMiddleware.validate(journalEntriesValidation.updateStatus),
    journalEntriesController.updateJournalEntryStatus
  )
  .delete(
    auth.protectedRoutes,
    auth.allowedTo("SUPER-ADMIN", "ADMIN", "ACCOUNTING"),
    validationMiddleware.validate(journalEntriesValidation.idParam),
    journalEntriesController.deleteJournalEntry
  );

export default journalEntriesRouter;
