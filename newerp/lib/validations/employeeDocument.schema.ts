import { z } from "zod";

export const employeeDocumentSchema = z.object({
  employee_id: z.coerce.number(),
  doc_name: z.string().min(1),
  file_path: z.string().min(1),
  uploaded_at: z.string().optional(),
});

export type EmployeeDocumentFormData = z.infer<typeof employeeDocumentSchema>;
