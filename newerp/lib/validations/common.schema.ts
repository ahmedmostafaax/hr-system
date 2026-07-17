import { z } from "zod";

/** Generic schema for list forms with FK selects — validates required ids */
export const idField = z.coerce.number().min(1);

export const optionalNotes = z
  .string()
  .optional()
  .transform((val) => (val === "" ? undefined : val));

export const dateField = z.string().min(1);

export const amountField = z.coerce.number().min(0);
