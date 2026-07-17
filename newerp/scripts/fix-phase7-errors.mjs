import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === "node_modules" || name === ".next") continue;
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else if (p.endsWith(".tsx") || p.endsWith(".ts")) files.push(p);
  }
  return files;
}

const skip = new Set([
  path.join(root, "lib", "toast.ts"),
  path.join(root, "app", "[locale]", "error.tsx"),
]);

for (const file of walk(path.join(root, "app"))) {
  if (skip.has(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("console.error")) continue;

  if (!src.includes('from "@/lib/toast"') && !src.includes("from '@/lib/toast'")) {
    const useClient = src.startsWith('"use client"') || src.startsWith("'use client'");
    const importLine = 'import { notify } from "@/lib/toast";\n';
    if (useClient) {
      src = src.replace(/^(["']use client["'];?\s*\n)/, `$1${importLine}`);
    } else {
      src = importLine + src;
    }
  }

  src = src.replace(
    /console\.error\([^)]+\);?/g,
    "notify.handleApiError(err as { message?: string });"
  );
  src = src.replace(
    /console\.error\((\w+)\);?/g,
    "notify.handleApiError($1 as { message?: string });"
  );
  src = src.replace(
    /console\.error\(e\);?/g,
    "notify.handleApiError(e as { message?: string });"
  );
  src = src.replace(
    /console\.error\("Failed to fetch options", e\);?/g,
    "notify.handleApiError(e as { message?: string });"
  );
  src = src.replace(
    /console\.error\("Error loading options", e\);?/g,
    "notify.handleApiError(e as { message?: string });"
  );

  fs.writeFileSync(file, src);
  console.log("fixed", path.relative(root, file));
}

for (const file of [
  path.join(root, "components", "ui", "SearchInput.tsx"),
  path.join(root, "components", "ui", "Pagination.tsx"),
]) {
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("console.error")) continue;
  if (!src.includes("@/lib/toast")) {
    src = src.replace(
      /^(["']use client["'];?\s*\n)/,
      `$1import { notify } from "@/lib/toast";\n`
    );
  }
  src = src.replace(
    /console\.error\([^)]+\);?/g,
    "notify.handleApiError(error as { message?: string });"
  );
  fs.writeFileSync(file, src);
  console.log("fixed", path.relative(root, file));
}

console.log("done");
