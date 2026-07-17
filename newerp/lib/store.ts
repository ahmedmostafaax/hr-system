import { create } from "zustand";
import {
  departmentService,
  shiftService,
  leaveTypeService,
  absenceTypeService,
  bonusTypeService,
  allowanceTypeService,
  insuranceSettingsService,
} from "./services";
import { getUser, type UserRole } from "./auth";

interface Lookup {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface LookupStore {
  departments: Lookup[];
  shifts: Lookup[];
  leaveTypes: Lookup[];
  absenceTypes: Lookup[];
  bonusTypes: Lookup[];
  allowanceTypes: Lookup[];
  insuranceSettings: Lookup[];
  loaded: boolean;
  load: () => Promise<void>;
  reset: () => void;
}

const ADMIN_LOOKUP_ROLES: UserRole[] = [
  "SUPER-ADMIN",
  "ADMIN",
  "HR",
  "ACCOUNTING",
];

export const useLookupStore = create<LookupStore>((set) => ({
  departments: [],
  shifts: [],
  leaveTypes: [],
  absenceTypes: [],
  bonusTypes: [],
  allowanceTypes: [],
  insuranceSettings: [],
  loaded: false,

  load: async () => {
    const role = getUser()?.role;
    const isEmployeePortal = role === "EMPLOYEE";

    if (isEmployeePortal) {
      const leaveTypes = await leaveTypeService.getAll({ limit: 100 }).catch(() => null);
      set({
        leaveTypes: leaveTypes ? (leaveTypes.data as unknown as Lookup[]) : [],
        loaded: true,
      });
      return;
    }

    if (!role || !ADMIN_LOOKUP_ROLES.includes(role)) {
      set({ loaded: true });
      return;
    }

    const [depts, shifts, leaveTypes, absenceTypes, bonusTypes, allowanceTypes, insurance] =
      await Promise.allSettled([
        departmentService.getAll({ limit: 200 }),
        shiftService.getAll({ limit: 50 }),
        leaveTypeService.getAll({ limit: 50 }),
        absenceTypeService.getAll({ limit: 50 }),
        bonusTypeService.getAll({ limit: 50 }),
        allowanceTypeService.getAll({ limit: 50 }),
        insuranceSettingsService.getAll({ limit: 10 }),
      ]);

    set({
      departments:
        depts.status === "fulfilled" ? (depts.value.data as unknown as Lookup[]) : [],
      shifts: shifts.status === "fulfilled" ? (shifts.value.data as unknown as Lookup[]) : [],
      leaveTypes:
        leaveTypes.status === "fulfilled" ? (leaveTypes.value.data as unknown as Lookup[]) : [],
      absenceTypes:
        absenceTypes.status === "fulfilled"
          ? (absenceTypes.value.data as unknown as Lookup[])
          : [],
      bonusTypes:
        bonusTypes.status === "fulfilled" ? (bonusTypes.value.data as unknown as Lookup[]) : [],
      allowanceTypes:
        allowanceTypes.status === "fulfilled"
          ? (allowanceTypes.value.data as unknown as Lookup[])
          : [],
      insuranceSettings:
        insurance.status === "fulfilled" ? (insurance.value.data as unknown as Lookup[]) : [],
      loaded: true,
    });
  },

  reset: () =>
    set({
      departments: [],
      shifts: [],
      leaveTypes: [],
      absenceTypes: [],
      bonusTypes: [],
      allowanceTypes: [],
      insuranceSettings: [],
      loaded: false,
    }),
}));
