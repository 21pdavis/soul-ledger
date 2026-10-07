import type { PatchEntry } from "@/lib/deadlock-api/schemas";

/** Changelog titles look like "09-29-2026 Update". */
const TITLE_DATE = /\b(\d{2})-(\d{2})-(\d{4})\b/;

function patchDate(patch: PatchEntry): Date {
  const m = TITLE_DATE.exec(patch.title);
  if (m) return new Date(Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2])));
  return new Date(patch.pub_date);
}

/**
 * When the current patch went live, for the "this patch" window (ADR 0004). The title date is
 * used because `pub_date` moves whenever a changelog post is edited.
 */
export function currentPatchStart(patches: PatchEntry[]): Date | null {
  if (patches.length === 0) return null;
  return new Date(Math.max(...patches.map((p) => patchDate(p).getTime())));
}
