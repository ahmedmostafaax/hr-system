import { z } from "zod";

export const loginSchema = (t: (key: string) => string) =>
  z.object({
    identifier: z.string().min(1, t("login.validation.usernameRequired")),
    password: z
      .string()
      .min(1, t("login.validation.passwordRequired"))
      .min(6, t("login.validation.passwordMin")),
  });

export type LoginFormData = z.infer<ReturnType<typeof loginSchema>>;