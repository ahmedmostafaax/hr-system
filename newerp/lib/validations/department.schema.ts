import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  type: z.string().min(1, "النوع مطلوب"),
  parent_id: z
    .union([z.coerce.number(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : Number(v))),
});

export type DepartmentFormData = z.infer<typeof departmentSchema>;
