import { z } from "zod";

export const bonusTypeSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  payment_type: z.enum(["cash", "deferred"]),
  default_amount: z.coerce.number().nullable().optional(),
  editable_amount: z.coerce.boolean().optional(),
});
