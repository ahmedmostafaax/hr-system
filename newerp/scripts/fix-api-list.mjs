import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory() && !["node_modules", ".next"].includes(f.name)) walk(p, files);
    else if (/\.tsx$/.test(f.name)) files.push(p);
  }
  return files;
}

const serviceImports = {
  employee: "employeeService",
  leaveType: "leaveTypeService",
  bonusType: "bonusTypeService",
  absenceType: "absenceTypeService",
  contract: "contractService",
  allowanceType: "allowanceTypeService",
};

const files = walk("app/[locale]/(main)");

for (const file of files) {
  let c = fs.readFileSync(file, "utf8");
  const orig = c;

  // leave/absence detail getById
  c = c.replace(
    /const response = await leaveRequestService\.getById\(id\);\s*\n\s*\/\/[^\n]*\n\s*const leaveData = Array\.isArray\(response\.data\) \? response\.data\[0\] : response\.data;\s*\n\s*if \(!leaveData\)[\s\S]*?setLeaveRequest\(leaveData\)/,
    `const data = await leaveRequestService.getById(id);\n        if (!data) {\n          throw new Error("لم يتم العثور على بيانات الطلب");\n        }\n        setLeaveRequest(data)`
  );

  c = c.replace(
    /const response = await absenceService\.getById\(id\);\s*\n\s*const absenceData = Array\.isArray\(response\.data\) \? response\.data\[0\] : response\.data;\s*\n\s*setAbsence\(absenceData\)/,
    "const data = await absenceService.getById(id);\n        setAbsence(data)"
  );

  // api.get list -> use .data.data for raw axios (fix broken patch)
  const apiListPatterns = [
    [/await api\.get\("\/employee\?limit=1000"\)/g, "await employeeService.getAll({ limit: 1000 })"],
    [/await api\.get\('\/employee\?limit=1000'\)/g, "await employeeService.getAll({ limit: 1000 })"],
    [/await api\.get\("\/leaveType\?limit=1000"\)/g, "await leaveTypeService.getAll({ limit: 1000 })"],
    [/await api\.get\("\/bonusType\?limit=1000"\)/g, "await bonusTypeService.getAll({ limit: 1000 })"],
    [/await api\.get\("\/absenceType\?limit=1000"\)/g, "await absenceTypeService.getAll({ limit: 1000 })"],
    [/await api\.get\("\/contract\?limit=1000"\)/g, "await contractService.getAll({ limit: 1000 })"],
    [/await api\.get\("\/allowanceType\?limit=1000"\)/g, "await allowanceTypeService.getAll({ limit: 1000 })"],
  ];

  for (const [from, to] of apiListPatterns) {
    c = c.replace(from, to);
  }

  // res.data.data for employee options from getAll
  c = c.replace(/res\.data\.data\.map/g, "res.data.map");
  c = c.replace(/empRes\.data\.data\.map/g, "empRes.data.map");

  if (c !== orig) {
    if (
      c.includes("employeeService.getAll") &&
      !c.includes('from "@/lib/services"') &&
      !c.includes("employeeService")
    ) {
      // add import if needed - handled below
    }
    fs.writeFileSync(file, c);
    console.log("fixed", file);
  }
}

console.log("done");
