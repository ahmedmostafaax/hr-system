import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "app");

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules" || name === ".next") continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (p.endsWith("page.tsx")) files.push(p);
  }
  return files;
}

for (const file of walk(path.join(root, "[locale]", "(main)"))) {
  let src = fs.readFileSync(file, "utf8");
  const before = src;

  // After successful service update/create in try blocks, add toast if missing
  src = src.replace(
    /(await \w+Service\.(update|create)\([^;]+;)\n(\s*)(setFormSuccess\(([^)]+)\);)/g,
    (m, awaitLine, _op, indent, setLine, msg) => {
      if (m.includes("notify.success")) return m;
      return `${awaitLine}\n${indent}notify.success(${msg});\n${indent}${setLine}`;
    }
  );

  src = src.replace(
    /(await \w+Service\.update\([^;]+;)\n(\s*)(await fetch\w+\(\);)/g,
    (m, awaitLine, indent, fetchLine) => {
      if (m.includes("notify.success")) return m;
      return `${awaitLine}\n${indent}notify.success("تم التحديث بنجاح");\n${indent}${fetchLine}`;
    }
  );

  if (src !== before) {
    if (!src.includes("@/lib/toast")) {
      src = src.replace(
        /^(["']use client["'];?\s*\n)/,
        `$1import { notify } from "@/lib/toast";\n`
      );
    }
    fs.writeFileSync(file, src);
    console.log("toast", path.relative(root, file));
  }
}

console.log("done");
