import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..", "fixtures");

export function fixtureText(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

export function fixtureJson<T = unknown>(path: string): T {
  return JSON.parse(fixtureText(path)) as T;
}

/** The test account's recorded data (wiki/research/test-account.md). */
export const TEST_ACCOUNT_ID = 134751831;
