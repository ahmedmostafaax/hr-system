import fs from "fs";
import path from "path";

const crud = [
  ["userService", "User", "/user"],
  ["departmentService", "Department", "/department"],
  ["shiftService", "Shift", "/shift"],
  ["leaveTypeService", "LeaveType", "/leaveType"],
  ["officialHolidayService", "OfficialHoliday", "/officialHoliday"],
  ["accountService", "Account", "/account"],
  ["allowanceTypeService", "AllowanceType", "/allowanceType"],
  ["absenceTypeService", "AbsenceType", "/absenceType"],
  ["bonusTypeService", "BonusType", "/bonusType"],
  ["insuranceSettingsService", "InsuranceSetting", "/insuranceSettings"],
  ["employeeService", "Employee", "/employee"],
  ["employeeDocumentService", "EmployeeDocument", "/employeeDocument"],
  ["employeeRelativeService", "EmployeeRelative", "/employeeRelative"],
  ["employeeExperienceService", "EmployeeExperience", "/employeeExperience"],
  ["contractService", "Contract", "/contract"],
  ["contractAllowanceService", "ContractAllowance", "/contractAllowance"],
  ["contractLeaveService", "ContractLeave", "/contractLeave"],
  ["custodyService", "Custody", "/custody"],
  ["employeeLoanService", "EmployeeLoan", "/employeeLoan"],
  ["employeeBonusService", "EmployeeBonus", "/employeeBonus"],
  ["absenceService", "Absence", "/absence"],
  ["leaveRequestService", "LeaveRequest", "/leaveRequest"],
  ["attendanceService", "Attendance", "/attendance"],
  ["journalEntryService", "JournalEntry", "/journalEntry"],
  ["accountingPeriodService", "AccountingPeriod", "/accountingPeriod"],
  ["auditLogService", "AuditLog", "/auditLog"],
];

const dir = "lib/services";

for (const [file, type, route] of crud) {
  const content = [
    "import { createCrudService } from './createCrudService';",
    `import type { ${type} } from './entities';`,
    "",
    `const ${file} = createCrudService<${type}>('${route}');`,
    "",
    `export default ${file};`,
    `export { ${file} };`,
    "",
  ].join("\n");
  fs.writeFileSync(path.join(dir, `${file}.ts`), content);
}

console.log(`Created ${crud.length} services`);
