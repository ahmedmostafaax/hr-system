import { z } from "zod";

export const absenceTypeSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  deduct_days: z.coerce.number().min(0),
  requires_permission: z.coerce.boolean().optional(),
});
