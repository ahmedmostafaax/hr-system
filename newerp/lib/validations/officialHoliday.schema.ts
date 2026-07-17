import { z } from "zod";

export const officialHolidaySchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t("validation.dateInvalid")),
    days_count: z.coerce.number().min(1, t("validation.daysMin")),
  });

export type OfficialHolidayFormData = z.infer<ReturnType<typeof officialHolidaySchema>>;
