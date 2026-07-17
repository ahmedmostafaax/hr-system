import { z } from "zod";

export const insuranceSchema = z.object({
  employee_rate: z.coerce.number().min(0),
  company_rate: z.coerce.number().min(0),
  effective_from: z.string().min(1),
});
