import type { Db } from "@/db";
import { deleteExpiredSharedStories } from "@/db/repository";

/** Runs the weekly cleanup of expired share links (ADR 0079) and describes what it did. */
export async function cleanupSharedStories(
  db: Db,
  now: Date,
): Promise<{ deleted: number; message: string }> {
  const deleted = await deleteExpiredSharedStories(db, now);
  return { deleted, message: `Deleted ${deleted} expired shared stories.` };
}
