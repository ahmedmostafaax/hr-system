"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

interface AddButtonProps {
  name: string;
  onClick?: () => any;
  className?: string;
  disabled?: boolean;
}

export default function AddButton({
  name,
  onClick,
  className = "",
  disabled = false,
}: AddButtonProps) {
  const t = useTranslations("common.actions");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 w-auto whitespace-nowrap bg-primary hover:bg-primary/90 text-white text-[14px] font-semibold rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
    >
      <Plus className="w-5 h-5" />
      <span>{t('add')} {name}</span>
    </button>
  );
}
