"use client";

import { forwardRef, ReactNode, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 relative z-10">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && (
              <p className="text-white/50 text-sm mt-1">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  `w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-white/30 outline-none transition-colors ${
    hasError
      ? "border-red-500/60"
      : "border-white/20 hover:border-blue-400 focus:border-blue-400"
  }`;

export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-white/70 text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function AuthInput({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input className={inputClass(error)} {...props} />;
}

export const AuthPasswordInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }
>(function AuthPasswordInput({ error, className, ...props }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={`${inputClass(error)} pe-11 ${className ?? ""}`}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 end-2 flex items-center text-white/50 transition-colors hover:text-white/80"
        aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
});

export function AuthButton({
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
      <p className="text-red-400 text-sm text-center">{message}</p>
    </div>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-sm text-blue-300 hover:text-blue-200 transition-colors text-center block"
    >
      {children}
    </a>
  );
}
