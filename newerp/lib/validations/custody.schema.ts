import { z } from "zod";
import { dateField, idField, optionalNotes } from "./common.schema";

export const custodySchema = z.object({
  item_name: z.string().min(1, "اسم العهدة مطلوب"),
  from_employee_id: idField,
  to_employee_id: idField,
  transfer_type: z.enum(["handover", "receive", "transfer"]),
  transfer_date: dateField,
  notes: optionalNotes,
});

export type CustodyFormData = z.infer<typeof custodySchema>;
