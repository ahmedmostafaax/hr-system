"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { verifyResetCode, RESET_EMAIL_KEY } from "@/lib/auth";
import { notify } from "@/lib/toast";
import { AuthShell, AuthButton, AuthError } from "@/components/auth/AuthShell";

const CODE_LENGTH = 6;

export default function VerifyCodePage() {
  const locale = useLocale();
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill("");
    pasted.split("").forEach((d, i) => {
      next[i] = d;
    });
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setServerError("يرجى إدخال كود مكوّن من 6 أرقام");
      return;
    }

    if (!sessionStorage.getItem(RESET_EMAIL_KEY)) {
      router.push(`/${locale}/forgot-password`);
      return;
    }

    setServerError(null);
    setIsSubmitting(true);
    try {
      await verifyResetCode(code);
      notify.success("تم التحقق من الكود بنجاح");
      router.push(`/${locale}/reset-password`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      const message = err?.message || "كود غير صحيح أو منتهي الصلاحية";
      notify.error(message);
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="التحقق من الكود"
      subtitle="أدخل كود التحقق المكوّن من 6 أرقام"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex justify-center gap-2" dir="ltr">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-white/5 border border-white/20 text-white outline-none focus:border-blue-400 transition-colors"
            />
          ))}
        </div>

        {serverError && <AuthError message={serverError} />}

        <AuthButton loading={isSubmitting}>تحقق</AuthButton>

        <Link
          href={`/${locale}/forgot-password`}
          className="text-sm text-blue-300 hover:text-blue-200 transition-colors text-center"
        >
          إعادة إرسال الكود
        </Link>
      </form>
    </AuthShell>
  );
}
