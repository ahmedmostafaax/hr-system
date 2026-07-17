"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { notify } from "@/lib/toast";

interface DeleteRestoreButtonProps {
  id: number | string;
  endpoint: string;
  isDeleted?: boolean;
  onSuccess?: () => void;
  onPeriodLocked?: () => void;
}

export default function DeleteRestoreButton({
  id,
  endpoint,
  isDeleted,
  onSuccess,
  onPeriodLocked,
}: DeleteRestoreButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("common.actions");

  const actionName = isDeleted ? t("restore") : t("delete");

  const handleConfirm = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      await api.delete(`/${endpoint}/${id}`);
      notify.success(isDeleted ? "تم الاسترجاع بنجاح" : "تم الحذف بنجاح");
      onSuccess?.();
      setIsOpen(false);
    } catch (error: unknown) {
      notify.handleApiError(error as { message?: string });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
          isDeleted
            ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
            : "text-gray-400 hover:text-red-600 hover:bg-red-50"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={actionName}
      >
        {isLoading ? (
          <svg
            className="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : isDeleted ? (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" x2="10" y1="11" y2="17" />
            <line x1="14" x2="14" y1="11" y2="17" />
          </svg>
        )}
      </button>

      <ConfirmDialog
        open={isOpen}
        title={isDeleted ? t("confirmRestore") : t("confirmDelete")}
        description={isDeleted ? t("restoreMessage") : t("deleteMessage")}
        confirmLabel={actionName}
        variant={isDeleted ? "warning" : "danger"}
        loading={isLoading}
        onConfirm={handleConfirm}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}
