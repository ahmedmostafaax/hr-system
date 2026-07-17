import { z } from "zod";

export const employeeRelativeSchema = z.object({
  employee_id: z.coerce.number(),
  name: z.string().min(1),
  relation: z.string().min(1),
  phone: z.string().min(1),
});

export type EmployeeRelativeFormData = z.infer<typeof employeeRelativeSchema>;
