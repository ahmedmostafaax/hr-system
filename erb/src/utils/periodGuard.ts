import AccountingPeriod from "../../database/Models/accounting_periods";
import { AppError } from "./appError";

const PERIOD_CLOSED_MESSAGE =
  "الفترة المحاسبية مقفولة ولا يمكن تعديل بيانات هذا الشهر";

export async function isPeriodClosed(
  month: number,
  year: number
): Promise<boolean> {
  const period = await AccountingPeriod.findOne({
    where: { month, year, is_deleted: false },
  });

  return period?.status === "closed";
}

export async function assertPeriodOpen(
  month: number,
  year: number
): Promise<void> {
  if (await isPeriodClosed(month, year)) {
    throw new AppError(PERIOD_CLOSED_MESSAGE, 403);
  }
}

export function monthYearFromDate(
  date: string | Date
): { month: number; year: number } {
  const d = new Date(date);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export async function assertPeriodOpenForDate(
  date: string | Date
): Promise<void> {
  const { month, year } = monthYearFromDate(date);
  await assertPeriodOpen(month, year);
}
