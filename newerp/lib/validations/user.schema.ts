import { z } from "zod";

const allRoles = z.enum(["EMPLOYEE", "HR", "ACCOUNTING", "ADMIN", "SUPER-ADMIN"]);

export const userCreateSchema = z.object({
  employee_id: z.coerce.number().min(1, "اختر الموظف"),
  role: allRoles.default("EMPLOYEE"),
});

export const userEditSchema = z.object({
  name: z.string().min(3, "الاسم مطلوب (3 أحرف على الأقل)"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phoneNumber: z.string().min(11, "رقم الهاتف مطلوب"),
  role: allRoles,
  isActive: z.coerce.boolean().optional(),
});

/** @deprecated use userCreateSchema / userEditSchema */
export const userSchema = userEditSchema;
