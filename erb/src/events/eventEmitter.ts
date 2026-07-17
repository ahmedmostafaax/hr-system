import { EventEmitter } from "events";

class ERPEmitter extends EventEmitter {}

export const erpEmitter = new ERPEmitter();

// Event Types
export const EVENTS = {
  PAYROLL_CONFIRMED: "PAYROLL_CONFIRMED",
  PAYROLL_PAID: "payroll.paid",
  PAYROLL_DELETED: "PAYROLL_DELETED",
  LOAN_CREATED: "LOAN_CREATED",
  LOAN_DELETED: "loan.deleted",
  LOAN_UPDATED: "loan.updated",
  BONUS_CREATED: "BONUS_CREATED",
  BONUS_DELETED: "bonus.deleted",
  BONUS_UPDATED: "bonus.updated",
  LEAVE_APPROVED: "leave.approved",
  LEAVE_REJECTED: "leave.rejected",
  LOAN_APPROVED: "loan.approved",
  BONUS_APPROVED: "bonus.approved",
};
