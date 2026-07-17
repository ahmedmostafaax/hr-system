import { z } from "zod";
import { dateField, idField, optionalNotes } from "./common.schema";

export const absenceSchema = z.object({
  employee_id: idField,
  absence_type_id: idField,
  absence_date: dateField,
  deduction_days: z.coerce.number().min(0),
  notes: optionalNotes,
});

export type AbsenceFormData = z.infer<typeof absenceSchema>;
