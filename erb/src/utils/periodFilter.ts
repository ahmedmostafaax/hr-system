import { Op } from "sequelize";
import { AppError } from "./appError";

export type PeriodScope = "month" | "year";

export interface PeriodRange {
  scope: PeriodScope;
  month: number;
  year: number;
  startStr: string;
  endStr: string;
}

export const PERIOD_QUERY_KEYS = ["period", "month", "year"] as const;

export function parsePeriod(query: Record<string, unknown>): PeriodRange | null {
  const hasYear = query.year !== undefined && query.year !== "";
  const hasMonth = query.month !== undefined && query.month !== "";
  const hasPeriod = query.period !== undefined && query.period !== "";

  if (!hasYear && !hasMonth && !hasPeriod) {
    return null;
  }

  const scopeRaw = String(query.period ?? "month").toLowerCase();
  const scope: PeriodScope = scopeRaw === "year" ? "year" : "month";

  const now = new Date();
  const year = Number(query.year) || now.getFullYear();

  if (year < 2000 || year > 2100) {
    throw new AppError("year is out of range", 400);
  }

  if (scope === "year") {
    return {
      scope,
      month: 0,
      year,
      startStr: `${year}-01-01`,
      endStr: `${year}-12-31`,
    };
  }

  const month = Number(query.month) || now.getMonth() + 1;
  if (month < 1 || month > 12) {
    throw new AppError("month must be between 1 and 12", 400);
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  return {
    scope,
    month,
    year,
    startStr: start.toISOString().slice(0, 10),
    endStr: end.toISOString().slice(0, 10),
  };
}

export function stripPeriodKeys(query: Record<string, unknown>) {
  const next = { ...query };
  PERIOD_QUERY_KEYS.forEach((key) => delete next[key]);
  return next;
}

export function dateFieldBetween(field: string, period: PeriodRange) {
  return { [field]: { [Op.between]: [period.startStr, period.endStr] } };
}

export function leavePeriodWhere(period: PeriodRange) {
  const { startStr, endStr } = period;
  return {
    [Op.or]: [
      { start_date: { [Op.between]: [startStr, endStr] } },
      { end_date: { [Op.between]: [startStr, endStr] } },
      {
        [Op.and]: [
          { start_date: { [Op.lte]: startStr } },
          { end_date: { [Op.gte]: endStr } },
        ],
      },
    ],
  };
}

export function bonusPeriodWhere(period: PeriodRange) {
  if (period.scope === "year") {
    return {
      [Op.or]: [
        { payment_year: period.year },
        { grant_date: { [Op.between]: [period.startStr, period.endStr] } },
      ],
    };
  }

  return {
    [Op.or]: [
      { payment_month: period.month, payment_year: period.year },
      { grant_date: { [Op.between]: [period.startStr, period.endStr] } },
    ],
  };
}

export function mergePeriodWhere(
  features: { queryOptions: { where: Record<string, unknown> } },
  period: PeriodRange | null,
  whereClause: Record<string, unknown> | null
) {
  if (!period || !whereClause) return;
  features.queryOptions.where = {
    ...features.queryOptions.where,
    ...whereClause,
  };
}

/** Direct month/year columns on payroll_runs. */
export function payrollRunPeriodWhere(period: PeriodRange) {
  if (period.scope === "year") {
    return { year: period.year };
  }
  return { month: period.month, year: period.year };
}
