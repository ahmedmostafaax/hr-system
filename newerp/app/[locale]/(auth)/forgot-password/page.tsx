"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { forgetPassword, RESET_EMAIL_KEY } from "@/lib/auth";
import { notify } from "@/lib/toast";
import {
  AuthShell,
  AuthField,
  AuthInput,
  AuthButton,
  AuthError,
} from "@/components/auth/AuthShell";

const schema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

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
      await forgetPassword(data.email);
      sessionStorage.setItem(RESET_EMAIL_KEY, data.email);
      notify.success("تم إرسال كود التحقق لبريدك الإلكتروني");
      router.push(`/${locale}/verify-code`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      const message = err?.message || "حدث خطأ غير متوقع";
      notify.error(message);
      setServerError(message);
    }
  };

  return (
    <AuthShell
      title="نسيت كلمة المرور"
      subtitle="أدخل بريدك الإلكتروني لإرسال كود التحقق"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <AuthField label="البريد الإلكتروني" error={errors.email?.message}>
          <AuthInput
            {...register("email")}
            type="email"
            placeholder="example@company.com"
            error={!!errors.email}
          />
        </AuthField>

        {serverError && <AuthError message={serverError} />}

        <AuthButton loading={isSubmitting}>إرسال كود التحقق</AuthButton>

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
