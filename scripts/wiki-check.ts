import { posix } from "node:path";
import { parse } from "yaml";

/**
 * Checks the OKF wiki against the spec plus this repo's conventions (CLAUDE.md), so agents don't
 * have to remember the bookkeeping. `files` maps paths relative to wiki/ (forward slashes) to
 * their contents. Returns human-readable errors; an empty array means the wiki is consistent.
 */
export function checkWiki(files: Record<string, string>): string[] {
  const errors: string[] = [];
  const exists = (p: string) => p in files;

  for (const [path, content] of Object.entries(files)) {
    if (content.includes("\r\n")) errors.push(`${path}: uses CRLF line endings; use LF`);
    checkLinks(path, content, exists, errors);

    const name = posix.basename(path);
    if (name === "index.md") checkIndex(path, content, errors);
    else if (name === "log.md") checkLog(path, content, errors);
    else checkConcept(path, content, files, errors);
  }
  return errors;
}

const TYPES = new Set([
  "Vision",
  "Decision Record",
  "Open Question",
  "Reference",
  "Recommendation",
  "Backlog",
]);

type Frontmatter = Record<string, unknown>;

function readFrontmatter(
  content: string,
): { ok: true; data: Frontmatter } | { ok: false; reason: string } | null {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") return null;
  const end = lines.indexOf("---", 1); // the closing line must be exactly ---
  if (end === -1) return { ok: false, reason: "unterminated" };
  try {
    const data: unknown = parse(lines.slice(1, end).join("\n")) ?? {};
    return typeof data === "object" && !Array.isArray(data)
      ? { ok: true, data: data as Frontmatter }
      : { ok: false, reason: "not a mapping" };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message.split("\n")[0] : String(err) };
  }
}

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
/** A frontmatter value that may be one path or a list of paths. */
const targets = (v: unknown): string[] => [v].flat().filter(nonEmpty);

function checkConcept(
  path: string,
  content: string,
  files: Record<string, string>,
  errors: string[],
): void {
  const fm = readFrontmatter(content);
  if (fm === null)
    return void errors.push(`${path}: missing YAML frontmatter (needs at least type)`);
  if (!fm.ok) return void errors.push(`${path}: invalid frontmatter (${fm.reason})`);
  const data = fm.data;

  if (!nonEmpty(data.type)) errors.push(`${path}: missing type`);
  else if (!TYPES.has(data.type)) errors.push(`${path}: unknown type "${data.type}"`);
  if (!nonEmpty(data.description)) errors.push(`${path}: missing description`);

  checkListedInIndex(path, data, files, errors);

  const dir = posix.dirname(path);
  const sibling = (target: string) => posix.join(dir, target);

  if (data.type === "Decision Record") {
    const successors = targets(data.superseded_by);
    if (data.decision === "superseded") {
      if (data.status !== "deprecated")
        errors.push(`${path}: superseded but status is not deprecated`);
      if (successors.length === 0) errors.push(`${path}: superseded but no superseded_by`);
    } else if (data.status === "deprecated") {
      errors.push(`${path}: status deprecated but decision is "${String(data.decision)}"`);
    }
    for (const target of successors) {
      if (!(sibling(target) in files)) {
        errors.push(`${path}: superseded_by target ${target} does not exist`);
      }
    }
  }

  if (data.type === "Open Question" && data.question_status === "resolved") {
    const resolvers = targets(data.resolved_by);
    if (resolvers.length === 0) errors.push(`${path}: resolved but no resolved_by`);
    for (const target of resolvers) {
      if (!(sibling(target) in files)) {
        errors.push(`${path}: resolved_by target ${target} does not exist`);
      }
    }
  }
}

/** A link target allowing one level of balanced parentheses, e.g. foo_(bar).md. */
const TARGET = String.raw`(?:[^()\s]|\([^()\s]*\))+`;
const INDEX_ENTRY = new RegExp(String.raw`^\* \[(.+?)\]\((${TARGET})\) - (.*)$`);

/** Decodes %-escapes and drops a leading ./ so equivalent spellings compare equal. */
function cleanTarget(raw: string): string {
  let target = raw;
  try {
    target = decodeURIComponent(raw);
  } catch {
    // Keep malformed escapes as written.
  }
  return target.startsWith("./") ? target.slice(2) : target;
}

function indexEntries(content: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of content.split("\n")) {
    const m = INDEX_ENTRY.exec(line.trimEnd());
    if (m) entries.set(cleanTarget(m[2]), m[3]);
  }
  return entries;
}

function checkListedInIndex(
  path: string,
  data: Frontmatter,
  files: Record<string, string>,
  errors: string[],
): void {
  const dir = posix.dirname(path);
  const indexPath = dir === "." ? "index.md" : `${dir}/index.md`;
  const name = posix.basename(path);
  const description = nonEmpty(data.description) ? data.description : "";

  const index = files[indexPath];
  if (index === undefined) return void errors.push(`${path}: ${indexPath} does not exist`);

  const listed = indexEntries(index).get(name);
  if (listed === undefined) {
    const title = nonEmpty(data.title) ? data.title : name;
    errors.push(
      `${path}: not listed in ${indexPath} (add: * [${title}](${name}) - ${description})`,
    );
  } else if (description && listed !== description) {
    errors.push(`${indexPath}: description for ${name} should be "${description}"`);
  }
}

function checkIndex(path: string, content: string, errors: string[]): void {
  const fm = readFrontmatter(content);
  if (fm === null) return;
  const isRoot = path === "index.md";
  const onlyVersion = fm.ok && Object.keys(fm.data).every((k) => k === "okf_version");
  if (!isRoot || !onlyVersion) errors.push(`${path}: index files must not have frontmatter`);
}

function checkLog(path: string, content: string, errors: string[]): void {
  let previous: string | null = null;
  for (const line of content.split("\n")) {
    const m = /^## (.+)$/.exec(line.trimEnd());
    if (!m) continue;
    const date = m[1].trim();
    if (!isRealDate(date)) {
      errors.push(`${path}: heading "${date}" is not an ISO YYYY-MM-DD date`);
      continue;
    }
    if (previous !== null && date >= previous) {
      errors.push(`${path}: heading ${date} is out of order (newest first)`);
    }
    previous = date;
  }
}

function isRealDate(date: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const parsed = new Date(Date.UTC(y, mo - 1, d));
  return (
    parsed.getUTCFullYear() === y && parsed.getUTCMonth() === mo - 1 && parsed.getUTCDate() === d
  );
}

const LINK = new RegExp(String.raw`\]\((${TARGET})\)`, "g");

function checkLinks(
  path: string,
  content: string,
  exists: (p: string) => boolean,
  errors: string[],
): void {
  // Code isn't links: drop fenced blocks (``` or ~~~) and inline code first.
  const text = content.replace(/^(```|~~~)[\s\S]*?^\1/gm, "").replace(/`[^`\n]*`/g, "");
  for (const [, raw] of text.matchAll(LINK)) {
    if (/^(https?:|mailto:|#|\/)/.test(raw)) continue;
    const target = cleanTarget(raw.split("#")[0].split("?")[0]);
    if (!target) continue;
    const resolved = posix.normalize(posix.join(posix.dirname(path), target));
    if (resolved.startsWith("../")) continue; // outside the wiki
    // A directory link, with or without a trailing slash, resolves to its index.md.
    const ok = exists(resolved) || exists(posix.join(resolved, "index.md"));
    if (!ok) errors.push(`${path}: broken link ${raw.split("#")[0]}`);
  }
}
