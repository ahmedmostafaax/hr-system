"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { resetPassword, RESET_EMAIL_KEY } from "@/lib/auth";
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
    newPassword: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
    confirmPassword: z.string().min(6, "يرجى تأكيد كلمة المرور"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(RESET_EMAIL_KEY);
    if (!stored) {
      router.replace(`/${locale}/forgot-password`);
      return;
    }
    setEmail(stored);
  }, [locale, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!email) return;
    setServerError(null);
    try {
      await resetPassword(email, data.newPassword);
      sessionStorage.removeItem(RESET_EMAIL_KEY);
      notify.success("تم تغيير كلمة المرور بنجاح");
      router.push(`/${locale}/login`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      const message = err?.message || "حدث خطأ غير متوقع";
      notify.error(message);
      setServerError(message);
    }
  };

  if (!email) return null;

  return (
    <AuthShell
      title="إعادة تعيين كلمة المرور"
      subtitle={`تعيين كلمة مرور جديدة لـ ${email}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <AuthField label="كلمة المرور الجديدة" error={errors.newPassword?.message}>
          <AuthPasswordInput
            {...register("newPassword")}
            placeholder="••••••••"
            error={!!errors.newPassword}
            autoComplete="new-password"
          />
        </AuthField>

        <AuthField label="تأكيد كلمة المرور" error={errors.confirmPassword?.message}>
          <AuthPasswordInput
            {...register("confirmPassword")}
            placeholder="••••••••"
            error={!!errors.confirmPassword}
            autoComplete="new-password"
          />
        </AuthField>

        {serverError && <AuthError message={serverError} />}

        <AuthButton loading={isSubmitting}>حفظ كلمة المرور</AuthButton>

        <Link
          href={`/${locale}/login`}
          className="text-sm text-blue-300 hover:text-blue-200 transition-colors text-center"
        >
          العودة لتسجيل الدخول
        </Link>
      </form>
    </AuthShell>
  );
}
