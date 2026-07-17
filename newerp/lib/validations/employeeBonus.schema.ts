import { z } from "zod";
import { amountField, dateField, idField } from "./common.schema";

const checkbox = z
  .union([z.boolean(), z.literal("on")])
  .optional()
  .transform((v) => v === true || v === "on");

export const employeeBonusSchema = z.object({
  employee_id: idField,
  bonus_type_id: idField,
  amount: amountField,
  grant_date: dateField,
  is_paid: checkbox,
  payment_month: z.coerce.number().min(1).max(12).optional(),
  payment_year: z.coerce.number().min(2000).max(2100).optional(),
});

export type EmployeeBonusFormData = z.infer<typeof employeeBonusSchema>;
