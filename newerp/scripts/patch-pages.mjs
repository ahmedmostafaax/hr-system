import fs from "fs";
import path from "path";

function walk(dir, files = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory() && !["node_modules", ".next"].includes(f.name)) walk(p, files);
    else if (/page\.tsx$/.test(f.name)) files.push(p);
  }
  return files;
}

const pages = walk("app/[locale]/(main)");
let count = 0;

for (const file of pages) {
  let c = fs.readFileSync(file, "utf8");
  const orig = c;

  // getById: response.data -> direct entity
  c = c.replace(
    /const response = await (\w+)\.getById\(([^)]+)\);\s*\n\s*set(\w+)\(response\.data\)/g,
    "const data = await $1.getById($2);\n        set$3(data)"
  );
  c = c.replace(
    /const res = await (\w+)\.getById\(([^)]+)\);\s*\n\s*set(\w+)\(res\.data\)/g,
    "const data = await $1.getById($2);\n      set$3(data)"
  );
  c = c.replace(
    /const res = await (\w+)\.getById\(([^)]+)\);\s*\n\s*set(\w+)\(res\.data\.data \|\| res\.data\)/g,
    "const data = await $1.getById($2);\n      set$3(data)"
  );
  c = c.replace(
    /const res = await (\w+)\.getById\(([^)]+)\);\s*\n\s*set(\w+)\(res\.data\.data\)/g,
    "const data = await $1.getById($2);\n      set$3(data)"
  );

  // employee hub
  c = c.replace(
    /const res = await employeeService\.getById\(id\);\s*\n\s*setEmployee\(res\.data\)/g,
    "const data = await employeeService.getById(id);\n      setEmployee(data)"
  );

  // leave request detail
  c = c.replace(
    /const leaveData = Array\.isArray\(response\.data\) \? response\.data\[0\] : response\.data;\s*\n\s*setLeaveRequest\(leaveData\)/g,
    "setLeaveRequest(response)"
  );
  c = c.replace(
    /const response = await leaveRequestService\.getById\(id\);\s*\n\s*\n\s*setLeaveRequest\(response\)/g,
    "const response = await leaveRequestService.getById(id);\n        setLeaveRequest(response)"
  );

  // service getAll for options: res.data.data -> res.data
  c = c.replace(/(\w+Res)\.data\.data/g, "$1.data");

  // err.response?.data?.message -> err.message for api errors
  c = c.replace(/err\.response\?\.data\?\.message/g, "err?.message");
  c = c.replace(/err\.response\?\.data\?\.meta\?\.message/g, "err?.message");

  if (c !== orig) {
    fs.writeFileSync(file, c);
    count++;
    console.log("patched", file);
  }
}

console.log("Patched", count, "pages");
