import { z } from "zod";
import { amountField, idField } from "./common.schema";

export const contractAllowanceSchema = z.object({
  contract_id: idField,
  allowance_type_id: idField,
  amount: amountField,
});

export type ContractAllowanceFormData = z.infer<typeof contractAllowanceSchema>;
