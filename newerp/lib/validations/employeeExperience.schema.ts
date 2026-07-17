import { z } from "zod";

export const employeeExperienceSchema = z.object({
  employee_id: z.coerce.number(),
  company_name: z.string().min(1),
  position: z.string().min(1),
  from_date: z.string().min(1),
  to_date: z.string().min(1),
});

export type EmployeeExperienceFormData = z.infer<typeof employeeExperienceSchema>;
