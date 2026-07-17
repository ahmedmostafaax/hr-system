import { z } from "zod";
import { dateField, idField, optionalNotes } from "./common.schema";
import { calcInclusiveLeaveDays } from "../utils/leaveDays";

const leaveDateRangeRefine = (
  data: { start_date: string; end_date: string },
  ctx: z.RefinementCtx
) => {
  const days = calcInclusiveLeaveDays(data.start_date, data.end_date);
  if (days === null && data.start_date && data.end_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "تاريخ الانتهاء لا يمكن أن يكون قبل تاريخ البدء",
      path: ["end_date"],
    });
  }
};

/** Plain object — Zod 4 forbids .omit() / .extend() on schemas with refinements */
const leaveRequestBaseSchema = z.object({
  employee_id: idField,
  leave_type_id: idField,
  start_date: dateField,
  end_date: dateField,
  days_count: z.coerce.number().min(1, "يجب تحديد فترة إجازة صحيحة"),
});

export const leaveRequestCreateSchema = leaveRequestBaseSchema.superRefine(
  leaveDateRangeRefine
);

/** Employee self-service form (employee_id added on submit) */
export const leaveRequestSelfCreateSchema = leaveRequestBaseSchema
  .omit({ employee_id: true })
  .superRefine(leaveDateRangeRefine);

export const leaveRequestEditSchema = leaveRequestBaseSchema
  .extend({
    status: z.enum(["pending", "approved", "rejected"]),
    reason: optionalNotes,
  })
  .superRefine(leaveDateRangeRefine);

export type LeaveRequestFormData = z.infer<typeof leaveRequestCreateSchema>;
