import { Op } from "sequelize";

export const ADVANCED_FILTER_KEYS = [
  "age_min",
  "age_max",
  "salary_min",
  "salary_max",
  "contract_department_id",
  "department_id",
  "has_contract",
  "has_experience",
  "employee_age_min",
  "employee_age_max",
  "from_year",
  "to_year",
] as const;

export function stripAdvancedFilters(query: Record<string, unknown>) {
  const cleaned = { ...query };
  for (const key of ADVANCED_FILTER_KEYS) {
    delete cleaned[key];
  }
  return cleaned;
}

export function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function buildBirthDateRange(ageMin?: number, ageMax?: number) {
  const birthDate: Record<string | symbol, Date> = {};
  const today = new Date();

  if (ageMin !== undefined) {
    const maxBirth = new Date(today);
    maxBirth.setFullYear(maxBirth.getFullYear() - ageMin);
    birthDate[Op.lte] = maxBirth;
  }

  if (ageMax !== undefined) {
    const minBirth = new Date(today);
    minBirth.setFullYear(minBirth.getFullYear() - ageMax - 1);
    minBirth.setDate(minBirth.getDate() + 1);
    birthDate[Op.gte] = minBirth;
  }

  if (ageMin === undefined && ageMax === undefined) return undefined;
  return birthDate;
}

export function buildAgeRange(ageMin?: number, ageMax?: number) {
  const range: Record<string | symbol, number> = {};
  if (ageMin !== undefined) range[Op.gte] = ageMin;
  if (ageMax !== undefined) range[Op.lte] = ageMax;
  if (ageMin === undefined && ageMax === undefined) return undefined;
  return range;
}

export function buildSalaryRange(salaryMin?: number, salaryMax?: number) {
  const range: Record<string | symbol, number> = {};
  if (salaryMin !== undefined) range[Op.gte] = salaryMin;
  if (salaryMax !== undefined) range[Op.lte] = salaryMax;
  if (salaryMin === undefined && salaryMax === undefined) return undefined;
  return range;
}
