import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "app", "[locale]", "(main)");

const pages = [
  ["attendance/page.tsx", "attendance"],
  ["custody/page.tsx", "custody"],
  ["my/loans/page.tsx", "my-loans"],
  ["my/leave-requests/page.tsx", "my-leave-requests"],
  ["employeeBonus/page.tsx", "employee-bonuses"],
  ["employeeLoan/page.tsx", "employee-loans"],
  ["absences/page.tsx", "absences"],
  ["leave_requests/page.tsx", "leave-requests"],
  ["bonus_types/page.tsx", "bonus-types"],
  ["allowanceTypes/page.tsx", "allowance-types"],
  ["employees/page.tsx", "employees"],
  ["auditLog/page.tsx", "audit-log"],
  ["users/page.tsx", "users"],
  ["payroll/page.tsx", "payroll-runs"],
  ["shifts/page.tsx", "shifts"],
  ["departments/page.tsx", "departments"],
  ["contracts/page.tsx", "contracts"],
  ["employeeExperience/page.tsx", "employee-experience"],
  ["accountingPeriods/page.tsx", "accounting-periods"],
  ["journalEntries/page.tsx", "journal-entries"],
  ["account/page.tsx", "accounts"],
  ["contract_leaves/page.tsx", "contract-leaves"],
  ["insurance_settings/page.tsx", "insurance-settings"],
  ["employeeRelative/page.tsx", "employee-relatives"],
  ["contract_allowances/page.tsx", "contract-allowances"],
  ["employeeDocument/page.tsx", "employee-documents"],
  ["absence_types/page.tsx", "absence-types"],
  ["officialHolidays/page.tsx", "official-holidays"],
  ["leaveTypes/page.tsx", "leave-types"],
];

for (const [rel, filename] of pages) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    console.warn("skip missing", rel);
    continue;
  }
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("exportFetcher=")) {
    console.log("already", rel);
    continue;
  }
  if (!content.includes("columns={columns}")) {
    console.warn("no columns={columns}", rel);
    continue;
  }
  content = content.replace(
    "columns={columns}\n",
    `columns={columns}\n          exportFetcher={list.fetchAllData}\n          exportFilename="${filename}"\n`
  );
  fs.writeFileSync(file, content);
  console.log("patched", rel);
}

const payrollDetail = path.join(root, "payroll/[id]/page.tsx");
if (fs.existsSync(payrollDetail)) {
  let content = fs.readFileSync(payrollDetail, "utf8");
  if (!content.includes("exportFetcher=")) {
    content = content.replace(
      "columns={columns}\n",
      `columns={columns}\n          exportFetcher={async () => details}\n          exportFilename="payroll-details"\n`
    );
    fs.writeFileSync(payrollDetail, content);
    console.log("patched payroll/[id]");
  }
}
