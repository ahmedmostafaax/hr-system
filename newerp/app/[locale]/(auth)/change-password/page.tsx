"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  changePassword,
  getUser,
  saveAuth,
  updateUser,
  LoginResponseData,
} from "@/lib/auth";
import { useLookupStore } from "@/lib/store";
import { notify } from "@/lib/toast";
import {
  AuthShell,
  AuthField,
  AuthPasswordInput,
  AuthButton,
  AuthError,
} from "@/components/auth/AuthShell";

const schema = z
  .object({
    password: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(6, "يرجى تأكيد كلمة المرور"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const locale = useLocale();
  const t = useTranslations("changePassword");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const user = getUser();
  const isForceReset = user?.force_reset_password;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const response = await changePassword(data.password, data.newPassword);
      const payload = response.data as LoginResponseData;

      const updatedUser = {
        ...payload.user,
        employee_id: user?.employee_id,
        force_reset_password: false,
      };

      saveAuth(payload.token, updatedUser);
      updateUser(updatedUser);

      notify.success(t("success"));

      await useLookupStore.getState().load();

      const home =
        updatedUser.role === "EMPLOYEE"
          ? `/${locale}/my/profile`
          : `/${locale}`;
      router.push(home);
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err?.status === 401) {
        const message = isForceReset ? t("invalidTempPassword") : t("invalidCurrentPassword");
        notify.error(message);
        setServerError(message);
      } else {
        const message = err?.message || t("genericError");
        notify.error(message);
        setServerError(message);
      }
    }
  };

  return (
    <AuthShell
      title={t("title")}
      subtitle={isForceReset ? t("forceResetSubtitle") : t("subtitle")}
    >
      {isForceReset && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {t("forceResetNotice")}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <AuthField
          label={isForceReset ? t("tempPassword") : t("currentPassword")}
          error={errors.password?.message}
        >
          <AuthPasswordInput
            {...register("password")}
            placeholder="••••••••"
            error={!!errors.password}
            autoComplete="current-password"
          />
        </AuthField>

        <AuthField label={t("newPassword")} error={errors.newPassword?.message}>
          <AuthPasswordInput
            {...register("newPassword")}
            placeholder="••••••••"
            error={!!errors.newPassword}
            autoComplete="new-password"
          />
        </AuthField>

        <AuthField label={t("confirmPassword")} error={errors.confirmPassword?.message}>
          <AuthPasswordInput
            {...register("confirmPassword")}
            placeholder="••••••••"
            error={!!errors.confirmPassword}
            autoComplete="new-password"
          />
        </AuthField>

        {serverError && <AuthError message={serverError} />}

        <AuthButton loading={isSubmitting}>{t("submit")}</AuthButton>
      </form>
    </AuthShell>
  );
}
