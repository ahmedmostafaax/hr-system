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
    else if (p.endsWith(".tsx")) files.push(p);
  }
  return files;
}

for (const file of walk(path.join(root, "app"))) {
  let src = fs.readFileSync(file, "utf8");
  const before = src;
  src = src.replace(/\s*notify\.success\(null\);\n/g, "\n");
  src = src.replace(
    /catch \(e\) \{\s*\n\s*notify\.handleApiError\(err as/g,
    "catch (e) {\n        notify.handleApiError(e as"
  );
  if (src !== before) {
    fs.writeFileSync(file, src);
    console.log("fixed", path.relative(root, file));
  }
}

console.log("done");
