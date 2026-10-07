// `pnpm check:wiki`: validates wiki/ (see wiki-check.ts). Exits non-zero on any problem.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { checkWiki } from "./wiki-check";

const root = join(__dirname, "..", "wiki");
const files: Record<string, string> = {};
for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
  const full = join(entry.parentPath, entry.name);
  files[relative(root, full).split(sep).join("/")] = readFileSync(full, "utf8");
}

const errors = checkWiki(files);
if (errors.length > 0) {
  console.error(
    `wiki check failed (${errors.length}):\n` + errors.map((e) => `  - ${e}`).join("\n"),
  );
  process.exit(1);
}
console.log(`wiki check passed (${Object.keys(files).length} files)`);
