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
  const text = content.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { ok: false, reason: "unterminated" };
  try {
    const data: unknown = parse(text.slice(4, end));
    return data && typeof data === "object" && !Array.isArray(data)
      ? { ok: true, data: data as Frontmatter }
      : { ok: false, reason: "not a mapping" };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message.split("\n")[0] : String(err) };
  }
}

const nonEmpty = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

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
    const successors = data.superseded_by;
    if (data.decision === "superseded") {
      if (data.status !== "deprecated")
        errors.push(`${path}: superseded but status is not deprecated`);
      if (successors === undefined) errors.push(`${path}: superseded but no superseded_by`);
    } else if (data.status === "deprecated") {
      errors.push(`${path}: status deprecated but decision is "${String(data.decision)}"`);
    }
    for (const target of [successors].flat().filter(nonEmpty)) {
      if (!(sibling(target) in files)) {
        errors.push(`${path}: superseded_by target ${target} does not exist`);
      }
    }
  }

  if (data.type === "Open Question" && data.question_status === "resolved") {
    if (!nonEmpty(data.resolved_by)) errors.push(`${path}: resolved but no resolved_by`);
    else if (!(sibling(data.resolved_by) in files)) {
      errors.push(`${path}: resolved_by target ${data.resolved_by} does not exist`);
    }
  }
}

const INDEX_ENTRY = /^\* \[(.+?)\]\(([^)]+)\) - (.*)$/;

function indexEntries(content: string): Map<string, string> {
  const entries = new Map<string, string>();
  for (const line of content.split("\n")) {
    const m = INDEX_ENTRY.exec(line.trimEnd());
    if (m) entries.set(m[2], m[3]);
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`${path}: heading "${date}" is not an ISO YYYY-MM-DD date`);
      continue;
    }
    if (previous !== null && date >= previous) {
      errors.push(`${path}: heading ${date} is out of order (newest first)`);
    }
    previous = date;
  }
}

const LINK = /\]\(([^)\s]+)\)/g;

function checkLinks(
  path: string,
  content: string,
  exists: (p: string) => boolean,
  errors: string[],
): void {
  const text = content.replace(/```[\s\S]*?```/g, "");
  for (const [, raw] of text.matchAll(LINK)) {
    if (/^(https?:|mailto:|#|\/)/.test(raw)) continue;
    const target = raw.split("#")[0].split("?")[0];
    if (!target) continue;
    const resolved = posix.normalize(posix.join(posix.dirname(path), target));
    if (resolved.startsWith("../")) continue; // outside the wiki
    const ok = target.endsWith("/") ? exists(posix.join(resolved, "index.md")) : exists(resolved);
    if (!ok) errors.push(`${path}: broken link ${raw.split("#")[0]}`);
  }
}
