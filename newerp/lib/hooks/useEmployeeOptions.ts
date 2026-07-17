"use client";

import { useEffect, useState } from "react";
import { employeeService } from "@/lib/services";
import type { SelectOption } from "@/components/ui/SearchableSelect";

export type { SelectOption };

export function toEmployeeSelectOption(emp: {
  id: number;
  code: string;
  full_name: string;
  email?: string | null;
  national_id?: string | null;
  phone_number?: string | null;
}): SelectOption {
  return {
    label: `${emp.code} - ${emp.full_name}`,
    value: emp.id,
    searchText: [emp.code, emp.full_name, emp.email, emp.national_id, emp.phone_number]
      .filter(Boolean)
      .join(" "),
  };
}

let cachedOptions: SelectOption[] | null = null;
let loadPromise: Promise<SelectOption[]> | null = null;

async function fetchEmployeeOptions(): Promise<SelectOption[]> {
  if (cachedOptions) return cachedOptions;

  if (!loadPromise) {
    loadPromise = employeeService
      .getAll({ limit: 1000 })
      .then((res) => {
        cachedOptions = res.data.map(toEmployeeSelectOption);
        return cachedOptions;
      })
      .catch((err) => {
        loadPromise = null;
        throw err;
      });
  }

  return loadPromise;
}

export function useEmployeeOptions() {
  const [options, setOptions] = useState<SelectOption[]>(cachedOptions ?? []);
  const [loading, setLoading] = useState(!cachedOptions);

  useEffect(() => {
    let active = true;

    fetchEmployeeOptions()
      .then((data) => {
        if (!active) return;
        setOptions(data);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { options, loading };
}

export function invalidateEmployeeOptionsCache() {
  cachedOptions = null;
  loadPromise = null;
}
