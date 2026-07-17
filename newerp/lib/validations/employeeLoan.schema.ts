import { z } from "zod";
import { dateField, idField } from "./common.schema";

export const employeeLoanSchema = z.object({
  employee_id: idField,
  type: z.enum(["loan", "advance"]),
  amount: z.coerce.number().min(0),
  installment_amount: z.coerce.number().min(0),
  paid_amount: z.coerce.number().min(0).optional(),
  grant_date: dateField,
  status: z.enum(["active", "settled"]).default("active"),
});

export type EmployeeLoanFormData = z.infer<typeof employeeLoanSchema>;

/** Self-service: employee submits a loan/advance request (no employee_id / paid / status). */
export const employeeLoanSelfCreateSchema = z.object({
  type: z.enum(["loan", "advance"]),
  amount: z.coerce.number().min(1),
  installment_amount: z.coerce.number().min(0).optional(),
  grant_date: dateField,
});

export type EmployeeLoanSelfCreateData = z.infer<typeof employeeLoanSelfCreateSchema>;
