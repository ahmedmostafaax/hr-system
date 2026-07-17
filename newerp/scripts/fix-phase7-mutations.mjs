import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "app");

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
  let src = fs.readFileSync(file, "utf8");
  let changed = false;

  if (!src.includes("@/lib/toast")) {
    src = src.replace(
      /^(["']use client["'];?\s*\n)/,
      `$1import { notify } from "@/lib/toast";\n`
    );
    changed = true;
  }

  const before = src;
  src = src.replace(
    /(\} catch \(err(?:: any)?\) \{)\s*\n(\s*)setFormError\(/g,
    `$1\n$2notify.handleApiError(err as { message?: string });\n$2setFormError(`
  );
  if (src !== before) changed = true;

  const before2 = src;
  src = src.replace(
    /(\s*)setFormSuccess\(([^)]+)\);\s*\n/g,
    (match, indent, msg) => {
      if (!match.includes("handleFormSubmit") && !src.slice(0, src.indexOf(match)).includes("handleFormSubmit")) {
        return match;
      }
      if (src.slice(Math.max(0, src.indexOf(match) - 200), src.indexOf(match)).includes("notify.success")) {
        return match;
      }
      return `${indent}notify.success(${msg});\n${indent}setFormSuccess(${msg});\n`;
    }
  );

  if (changed || src !== fs.readFileSync(file, "utf8")) {
    fs.writeFileSync(file, src);
    console.log("patched", path.relative(root, file));
  }
}

console.log("done");
