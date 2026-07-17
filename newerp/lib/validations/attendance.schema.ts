import { z } from "zod";

export const attendanceCheckSchema = z.object({
  employee_id: z.coerce.number().min(1),
  work_date: z.string().min(1),
  check_in: z.string().optional(),
});
