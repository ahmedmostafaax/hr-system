"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { loginSchema, LoginFormData } from "@/lib/validations/login.schema";
import { loginUser, saveAuth, LoginResponseData } from "@/lib/auth";
import { notify } from "@/lib/toast";
import {
  AuthShell,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  AuthButton,
  AuthError,
} from "@/components/auth/AuthShell";

export function LoginForm() {
  const t = useTranslations();
  const locale = useLocale();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema(t)),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const response = await loginUser(data);
      const payload = response.data as LoginResponseData;

      if (!payload?.token || !payload?.user) {
        setServerError(t("login.error.generic"));
        return;
      }

      const authUser = {
        ...payload.user,
        force_reset_password: !!(
          payload.force_reset_password ?? payload.user.force_reset_password
        ),
      };

      saveAuth(payload.token, authUser);

      if (authUser.force_reset_password) {
        notify.warning(
          locale === "ar"
            ? "يجب تغيير كلمة المرور عند أول تسجيل دخول"
            : "You must change your password on first login"
        );
        window.location.href = `/${locale}/change-password`;
        return;
      }

      const home =
        payload.user.role === "EMPLOYEE"
          ? `/${locale}/my/profile`
          : `/${locale}`;

      // Full navigation so proxy.ts receives the auth cookie (required on ngrok/HTTPS)
      window.location.href = home;
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      if (err?.status === 401 || err?.status === 403) {
        setServerError(t("login.error.invalid"));
      } else {
        setServerError(err?.message || t("login.error.generic"));
      }
    }
  };

  return (
    <AuthShell title={t("login.title")} subtitle={t("login.subtitle")}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <AuthField label={t("login.identifier")} error={errors.identifier?.message}>
          <AuthInput
            {...register("identifier")}
            placeholder={t("login.identifier")}
            error={!!errors.identifier}
          />
        </AuthField>

        <AuthField label={t("login.password")} error={errors.password?.message}>
          <AuthPasswordInput
            {...register("password")}
            placeholder={t("login.password")}
            error={!!errors.password}
          />
        </AuthField>

        <div className="text-left rtl:text-right">
          <Link
            href={`/${locale}/forgot-password`}
            className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
          >
            {t("login.forgotPassword")}
          </Link>
        </div>

        {serverError && <AuthError message={serverError} />}

        <AuthButton loading={isSubmitting}>
          {isSubmitting ? t("login.loading") : t("login.submit")}
        </AuthButton>
      </form>
    </AuthShell>
  );
}
