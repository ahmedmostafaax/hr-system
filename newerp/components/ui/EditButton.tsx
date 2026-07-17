"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

interface EditButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export default function EditButton({ onClick, title, className = "" }: EditButtonProps) {
  const t = useTranslations("common.actions");

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 ${className}`}
      title={title || t('edit')}
    >
      <Pencil size={16} />
    </button>
  );
}
