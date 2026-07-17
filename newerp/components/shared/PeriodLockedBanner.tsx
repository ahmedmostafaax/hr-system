export const PERIOD_LOCKED_MESSAGE =
  "الفترة المحاسبية مقفولة ولا يمكن تعديل بيانات هذا الشهر";

export function isPeriodLockedError(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  if (e?.status !== 403) return false;
  const msg = (e.message || "").toLowerCase();
  return msg.includes("مقفول") || msg.includes("closed") || msg.includes("period");
}

interface PeriodLockedBannerProps {
  visible?: boolean;
  message?: string;
  onDismiss?: () => void;
  className?: string;
}

export function PeriodLockedBanner({
  visible = true,
  message = PERIOD_LOCKED_MESSAGE,
  onDismiss,
  className = "",
}: PeriodLockedBannerProps) {
  if (!visible) return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 ${className}`}
    >
      <span className="text-lg shrink-0" aria-hidden>
        ⚠️
      </span>
      <p className="flex-1 text-sm font-medium leading-relaxed">
        {message || "⚠️ الفترة المحاسبية لهذا الشهر مقفولة — لا يمكن تعديل البيانات"}
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-amber-700 hover:text-amber-900 text-sm font-semibold"
        >
          إغلاق
        </button>
      )}
    </div>
  );
}
