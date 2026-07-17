import { z } from "zod";

export const accountSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    code: z.string().min(1, t("validation.codeRequired")),
    type: z.string().min(1, t("validation.typeRequired")),
    parent_id: z.coerce.number().nullable().optional(),
    description: z.string().optional().nullable(),
    currency: z.string().min(1, t("validation.currencyRequired")),
  });

export type AccountFormData = z.infer<ReturnType<typeof accountSchema>>;
