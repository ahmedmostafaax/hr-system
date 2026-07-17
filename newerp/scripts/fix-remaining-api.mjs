import fs from "fs";

const fixes = [
  {
    file: "app/[locale]/(main)/employeeLoan/page.tsx",
    imports: 'import { employeeService } from "@/lib/services";',
    after: 'from "./service";',
    replace: [
      [
        'api.get("/employee?limit=1000").then(res => {',
        "employeeService.getAll({ limit: 1000 }).then((res) => {",
      ],
      ["res.data.map((emp: any)", "res.data.map((emp)"],
    ],
  },
  {
    file: "app/[locale]/(main)/custody/[id]/page.tsx",
    imports: 'import { employeeService } from "@/lib/services";',
    after: 'from "../service";',
    replace: [
      [
        'api.get("/employee?limit=1000").then(res => {',
        "employeeService.getAll({ limit: 1000 }).then((res) => {",
      ],
      ["res.data.data.map", "res.data.map"],
    ],
  },
  {
    file: "app/[locale]/(main)/employeeBonus/page.tsx",
    imports:
      'import { employeeService, bonusTypeService } from "@/lib/services";',
    after: 'from "./service";',
    replace: [
      [
        `const [empRes, typeRes] = await Promise.all([
          api.get("/employee?limit=1000"),
          api.get("/bonusType?limit=1000")
        ]);`,
        `const [empRes, typeRes] = await Promise.all([
          employeeService.getAll({ limit: 1000 }),
          bonusTypeService.getAll({ limit: 1000 }),
        ]);`,
      ],
    ],
  },
  {
    file: "app/[locale]/(main)/employeeBonus/[id]/page.tsx",
    imports:
      'import { employeeService, bonusTypeService } from "@/lib/services";',
    after: 'from "../service";',
    replace: [
      [
        `const [empRes, typeRes] = await Promise.all([
          api.get("/employee?limit=1000"),
          api.get("/bonusType?limit=1000")
        ]);`,
        `const [empRes, typeRes] = await Promise.all([
          employeeService.getAll({ limit: 1000 }),
          bonusTypeService.getAll({ limit: 1000 }),
        ]);`,
      ],
    ],
  },
  {
    file: "app/[locale]/(main)/contract_leaves/page.tsx",
    imports:
      'import { contractService, leaveTypeService } from "@/lib/services";',
    after: 'from "./service";',
    replace: [
      [
        `api.get("/contract?limit=1000"),
          api.get("/leaveType?limit=1000")`,
        `contractService.getAll({ limit: 1000 }),
          leaveTypeService.getAll({ limit: 1000 })`,
      ],
    ],
  },
  {
    file: "app/[locale]/(main)/contract_leaves/[id]/page.tsx",
    imports:
      'import { contractService, leaveTypeService } from "@/lib/services";',
    after: 'from "../service";',
    replace: [
      [
        `api.get("/contract?limit=1000"),
          api.get("/leaveType?limit=1000")`,
        `contractService.getAll({ limit: 1000 }),
          leaveTypeService.getAll({ limit: 1000 })`,
      ],
    ],
  },
  {
    file: "app/[locale]/(main)/contract_allowances/page.tsx",
    imports:
      'import { contractService, allowanceTypeService } from "@/lib/services";',
    after: 'from "./service";',
    replace: [
      [
        `api.get("/contract?limit=1000"),
          api.get("/allowanceType?limit=1000")`,
        `contractService.getAll({ limit: 1000 }),
          allowanceTypeService.getAll({ limit: 1000 })`,
      ],
    ],
  },
  {
    file: "app/[locale]/(main)/contract_allowances/[id]/page.tsx",
    imports:
      'import { contractService, allowanceTypeService } from "@/lib/services";',
    after: 'from "../service";',
    replace: [
      [
        `api.get("/contract?limit=1000"),
          api.get("/allowanceType?limit=1000")`,
        `contractService.getAll({ limit: 1000 }),
          allowanceTypeService.getAll({ limit: 1000 })`,
      ],
    ],
  },
  {
    file: "app/[locale]/(main)/contracts/page.tsx",
    imports: `import {
  employeeService,
  departmentService,
  insuranceSettingsService,
  shiftService,
} from "@/lib/services";`,
    after: 'from "./service";',
    replace: [
      [
        `api.get("/employee?limit=1000"),
          api.get("/department?limit=1000"),
          api.get("/insuranceSettings?limit=1000"),
          api.get("/shift?limit=1000")`,
        `employeeService.getAll({ limit: 1000 }),
          departmentService.getAll({ limit: 1000 }),
          insuranceSettingsService.getAll({ limit: 1000 }),
          shiftService.getAll({ limit: 1000 })`,
      ],
    ],
  },
  {
    file: "app/[locale]/(main)/contracts/[id]/page.tsx",
    imports: `import {
  employeeService,
  departmentService,
  insuranceSettingsService,
  shiftService,
} from "@/lib/services";`,
    after: 'from "../service";',
    replace: [
      [
        `api.get("/employee?limit=1000"),
          api.get("/department?limit=1000"),
          api.get("/insuranceSettings?limit=1000"),
          api.get("/shift?limit=1000")`,
        `employeeService.getAll({ limit: 1000 }),
          departmentService.getAll({ limit: 1000 }),
          insuranceSettingsService.getAll({ limit: 1000 }),
          shiftService.getAll({ limit: 1000 })`,
      ],
    ],
  },
];

for (const fix of fixes) {
  let c = fs.readFileSync(fix.file, "utf8");
  if (!c.includes(fix.imports.split("\n")[0])) {
    c = c.replace(fix.after, `${fix.after}\n${fix.imports}`);
  }
  for (const [from, to] of fix.replace) {
    c = c.replace(from, to);
  }
  fs.writeFileSync(fix.file, c);
  console.log("fixed", fix.file);
}
