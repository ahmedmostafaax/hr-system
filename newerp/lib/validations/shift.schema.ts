import { z } from "zod";

export const shiftSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  type: z.enum(["morning", "evening", "between"]),
  work_days: z.string().min(1, "أيام العمل مطلوبة"),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  grace_minutes: z.coerce.number().min(0),
  deduct_grace: z.coerce.boolean().optional(),
  salary_basis_days: z.coerce.number().min(1),
});

export type ShiftFormData = z.infer<typeof shiftSchema>;
