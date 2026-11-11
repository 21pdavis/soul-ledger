import { tmpdir } from "node:os";
import { join } from "node:path";

/** Env var that points the e2e server at fake share links (see open.ts). */
export const SHARE_FIXTURES_ENV = "SHARED_STORY_FIXTURES";

/** The one file the hook will ever read; tests/e2e/shared-fixtures.ts writes it. */
export const SHARE_FIXTURES_FILE = join(tmpdir(), "soul-ledger-e2e", "share-fixtures.json");
