import { z } from "zod";

export const allowanceTypeSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    default_amount: z.coerce.number().min(0, t("validation.amountMin")),
    is_part_of_salary: z.boolean(),
    account_code: z.string().min(1, t("validation.accountRequired")),
  });

export type AllowanceTypeFormData = z.infer<ReturnType<typeof allowanceTypeSchema>>;
