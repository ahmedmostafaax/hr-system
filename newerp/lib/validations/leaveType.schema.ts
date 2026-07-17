import { z } from "zod";

export const leaveTypeSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    annual_balance: z.coerce.number({
      message: t("validation.balanceRequired"),
    }).min(0, t("validation.balanceMin")),
    affects_deduction: z.boolean({
      message: t("validation.deductionRequired"),
    }),
  });

export type LeaveTypeFormData = z.infer<ReturnType<typeof leaveTypeSchema>>;
