import { toast } from "sonner";
import { isPeriodLockedError } from "@/components/shared/PeriodLockedBanner";

export type ApiErrorLike = { status?: number; message?: string };

export const PERIOD_LOCKED_TOAST =
  "⚠️ الفترة المحاسبية مقفولة — لا يمكن تعديل البيانات لهذا الشهر";

export const notify = {
  success: (msg: string) => toast.success(msg),
  error: (msg: string) => toast.error(msg),
  info: (msg: string) => toast.info(msg),
  warning: (msg: string) => toast.warning(msg),
  apiError: (err: ApiErrorLike) =>
    toast.error(err?.message || "حدث خطأ، يرجى المحاولة مرة أخرى"),
  handleApiError: (err: ApiErrorLike) => {
    if (isPeriodLockedError(err)) {
      toast.error(PERIOD_LOCKED_TOAST);
      return;
    }
    toast.error(err?.message || "حدث خطأ، يرجى المحاولة مرة أخرى");
  },
};
