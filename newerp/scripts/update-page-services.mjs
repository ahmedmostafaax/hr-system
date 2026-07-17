import fs from "fs";
import path from "path";

const mappings = [
  ["departments/service.ts", "departmentService", "Department"],
  ["shifts/service.ts", "shiftService", "Shift"],
  ["officialHolidays/service.ts", "holidayService", "OfficialHoliday"],
  ["leaveTypes/service.ts", "leaveTypeService", "LeaveType"],
  ["insurance_settings/service.ts", "insuranceService", "InsuranceSetting"],
  ["employees/service.ts", "employeeService", "Employee"],
  ["employeeRelative/service.ts", "relativeService", "EmployeeRelative"],
  ["employeeLoan/service.ts", "loanService", "EmployeeLoan"],
  ["employeeExperience/service.ts", "experienceService", "EmployeeExperience"],
  ["employeeDocument/service.ts", "documentService", "EmployeeDocument"],
  ["employeeBonus/service.ts", "bonusService", "EmployeeBonus"],
  ["leave_requests/service.ts", "leaveRequestService", "LeaveRequest"],
  ["account/service.ts", "accountService", "Account"],
  ["custody/service.ts", "custodyService", "Custody"],
  ["contract_leaves/service.ts", "contractLeaveService", "ContractLeave"],
  ["contract_allowances/service.ts", "contractAllowanceService", "ContractAllowance"],
  ["contracts/service.ts", "contractService", "Contract"],
  ["bonus_types/service.ts", "bonusTypeService", "BonusType"],
  ["allowanceTypes/service.ts", "allowanceTypeService", "AllowanceType"],
  ["absence_types/service.ts", "absenceTypeService", "AbsenceType"],
  ["absences/service.ts", "absenceService", "Absence"],
];

const root = "app/[locale]/(main)";

for (const [rel, exportName, typeName] of mappings) {
  const importName = exportName.replace(/Service$/, "") === "holiday" ? "officialHolidayService" :
    exportName === "insuranceService" ? "insuranceSettingsService" :
    exportName === "relativeService" ? "employeeRelativeService" :
    exportName === "experienceService" ? "employeeExperienceService" :
    exportName === "documentService" ? "employeeDocumentService" :
    exportName === "loanService" ? "employeeLoanService" :
    exportName === "bonusService" ? "employeeBonusService" :
    exportName;

  const content = [
    `export { ${importName} as ${exportName} } from "@/lib/services";`,
    `export type { ${typeName} } from "@/lib/services/entities";`,
    "",
  ].join("\n");

  fs.writeFileSync(path.join(root, rel), content);
}

console.log("Updated", mappings.length, "page service re-exports");
