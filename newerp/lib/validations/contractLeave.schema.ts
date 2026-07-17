import { z } from "zod";
import { idField } from "./common.schema";

export const contractLeaveSchema = z.object({
  contract_id: idField,
  leave_type_id: idField,
  used_days: z.coerce.number().min(0),
  year: z.coerce.number().min(2000).max(2100),
});

export type ContractLeaveFormData = z.infer<typeof contractLeaveSchema>;
