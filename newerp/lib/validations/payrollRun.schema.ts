import { z } from "zod";

export const payrollRunCreateSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
  auto_process: z.coerce.boolean().optional(),
});
