import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "app");

const PERMISSIONS = {
  departments: "read:settings",
  shifts: "read:settings",
  account: "read:settings",
  allowanceTypes: "read:settings",
  bonus_types: "read:settings",
  absence_types: "read:settings",
  officialHolidays: "read:settings",
  leaveTypes: "read:settings",
  insurance_settings: "read:settings",
  employees: "read:employees",
  contracts: "read:employees",
  contract_allowances: "read:employees",
  contract_leaves: "read:employees",
  custody: "read:employees",
  employeeRelative: "read:employees",
  employeeExperience: "read:employees",
  employeeDocument: "read:employees",
  employeeLoan: "read:employees",
  employeeBonus: "read:employees",
  absences: "read:employees",
  leave_requests: "read:employees",
};

function addRoleGuard(src, permission) {
  if (src.includes("RoleGuard")) return src;

  src = src.replace(
    /^(["']use client["'];?\s*\n)/,
    `$1import { RoleGuard } from "@/components/shared";\n`
  );

  src = src.replace(
    /if \(isLoading\) return <Loading className="([^"]+)" \/>;/g,
    `if (isLoading) return (<RoleGuard permission="${permission}"><Loading className="$1" /></RoleGuard>);`
  );

  src = src.replace(
    /if \(isLoading\) return <Loading \/>;/g,
    `if (isLoading) return (<RoleGuard permission="${permission}"><Loading /></RoleGuard>);`
  );

  src = src.replace(
    /(if \(error[\s\S]*?\) \{\s*\n\s*return \(\s*\n)(\s*)(<)/,
    `$1$2<RoleGuard permission="${permission}">\n$2$3`
  );

  const errorStart = src.search(/if \(error[\s\S]*?<RoleGuard permission=/);
  if (errorStart !== -1) {
    const tail = src.slice(errorStart);
    const m = tail.match(/\n(\s*)<\/div>\n(\s*)\);\n(\s*)\}/);
    if (m) {
      const [full, indent, closeIndent, braceIndent] = m;
      const replacement = `\n${indent}</div>\n${indent}</RoleGuard>\n${closeIndent});\n${braceIndent}}`;
      src = src.slice(0, errorStart) + tail.replace(full, replacement);
    }
  }

  const split = src.match(/^([\s\S]*?\nexport default function \w+\(\) \{[\s\S]*?)(\n\}\n\n(?:function|\/\/|$))/);
  if (!split) return src;

  const componentBody = split[1];
  const componentTail = split[2];
  const marker = "\n  return (\n";
  const idx = componentBody.lastIndexOf(marker);
  if (idx === -1) return src;

  const before = componentBody.slice(0, idx + marker.length);
  const after = componentBody.slice(idx + marker.length);
  if (after.startsWith(`    <RoleGuard permission="${permission}">`)) return src;

  const closing = after.lastIndexOf("\n  );");
  if (closing === -1) return src;

  const body = after.slice(0, closing);
  const tail = after.slice(closing);
  const wrapped = `${before}    <RoleGuard permission="${permission}">\n${body}\n    </RoleGuard>${tail}${componentTail}`;

  return src.slice(0, src.indexOf(split[1])) + wrapped + src.slice(src.indexOf(split[1]) + split[1].length + split[2].length);
}

const detailFiles = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (name === "page.tsx" && p.includes("[id]") && !p.includes("[employeeId]")) {
      detailFiles.push(p);
    }
  }
}
walk(path.join(root, "[locale]", "(main)"));

for (const file of detailFiles) {
  const folder = path.basename(path.dirname(file));
  const permission = PERMISSIONS[folder];
  if (!permission) continue;

  const src = fs.readFileSync(file, "utf8");
  const next = addRoleGuard(src, permission);
  if (next !== src) {
    fs.writeFileSync(file, next);
    console.log("roleguard", path.relative(root, file));
  }
}

console.log("done");
