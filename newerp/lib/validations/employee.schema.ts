import { z } from "zod";

export const employeeSchema = z.object({
  code: z.string().min(1, "الكود مطلوب"),
  full_name: z.string().min(1, "الاسم مطلوب"),
  national_id: z.string().min(1, "الرقم القومي مطلوب"),
  birth_date: z.string().min(1),
  gender: z.enum(["M", "F"]),
  phone_number: z.string().optional(),
  email: z.string().email("البريد الإلكتروني مطلوب"),
  address: z.string().optional(),
  marital_status: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  qualification: z.string().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
});

export const employeeCreateSchema = employeeSchema.extend({
  user_role: z
    .enum(["EMPLOYEE", "HR", "ACCOUNTING", "ADMIN", "SUPER-ADMIN"])
    .default("EMPLOYEE"),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
