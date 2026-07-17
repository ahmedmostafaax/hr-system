import { z } from "zod";
import { idField } from "./common.schema";

const checkbox = z
  .union([z.boolean(), z.literal("on")])
  .optional()
  .transform((v) => v === true || v === "on");

export const contractSchema = z.object({
  employee_id: idField,
  job_title: z.string().min(1, "المسمى الوظيفي مطلوب"),
  department_id: idField,
  base_salary: z.coerce.number().min(0),
  start_date: z.string().min(1, "تاريخ البدء مطلوب"),
  end_date: z.string().min(1, "تاريخ الانتهاء مطلوب"),
  duration_years: z.coerce.number().min(0).optional(),
  shift_id: idField,
  insurance_setting_id: idField,
  status: z.enum(["active", "suspended", "resigned", "dismissed"]).default("active"),
  overtime_enabled: checkbox,
  notes: z.string().optional(),
  attachment: z.string().optional(),
});

export type ContractFormData = z.infer<typeof contractSchema>;
