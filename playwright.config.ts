import { defineConfig, devices } from "@playwright/test";
import { GRAPHICS_KEY } from "./src/lib/client/graphics";
import { PACE_OVERRIDE_KEY } from "./src/lib/client/loading-pace";

const DEFAULT_PORT = 3100;
const DEFAULT_GATE_PORT = 3101;

/**
 * Ports are per worktree: with several checkouts (or agents) running e2e at once, give each its own
 * `PLAYWRIGHT_PORT` and `PLAYWRIGHT_GATE_PORT`, or one run silently tests another one's server.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? DEFAULT_PORT);
export const GATE_PORT = Number(process.env.PLAYWRIGHT_GATE_PORT ?? DEFAULT_GATE_PORT);

/**
 * Reuse a server that is already listening only on the default ports, locally, and never when
 * `PLAYWRIGHT_REUSE_SERVER=0`. On a custom port a listener is not ours to trust: Playwright then
 * fails fast ("already used") instead of testing someone else's build.
 */
const mayReuse = (port: number, defaultPort: number) =>
  !process.env.CI && process.env.PLAYWRIGHT_REUSE_SERVER !== "0" && port === defaultPort;

/** Local stand-in secrets for the gated server; never used anywhere real. */
export const TEST_ACCESS_KEY = "e2e-access-key-0123456789abcdef0123456";

/**
 * Two modes:
 * - Local (default): `pnpm test:e2e` builds once, then starts an open server (like production)
 *   and a gated one (like staging) to test the gate itself.
 * - Remote: with STAGING_URL and STAGING_ACCESS_KEY set, `pnpm test:e2e:staging` runs the
 *   phone and desktop suites against live staging, passing the gate with the key header.
 */
const remote = process.env.STAGING_URL;

/**
 * The loader holds each stage for a minimum time so a player can read it (ADR 0056). Most specs
 * just need to get through it, so every context starts with the pacing override set to "off",
 * which only REMOVES delay and so is harmless. loading-pace.spec.ts opts out to test the real
 * pacing. The origin must match the one the specs open.
 */
const paceOff = {
  cookies: [],
  origins: [
    {
      origin: new URL(remote ?? `http://localhost:${PORT}`).origin,
      localStorage: [
        { name: PACE_OVERRIDE_KEY, value: "off" },
        // The 3D world off by default: test browsers draw WebGL in software, far too slowly for
        // the story specs. world.spec.ts turns it back on to test the world itself.
        { name: GRAPHICS_KEY, value: "off" },
      ],
    },
  ],
};

const devicesProjects = [
  // Phone and desktop are both first-class (ADR 0028).
  { name: "phone", use: { ...devices["Pixel 7"] } },
  {
    name: "desktop",
    use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
  },
].map((p) => ({ ...p, testIgnore: /gate\.spec\.ts/ }));

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: remote ?? `http://localhost:${PORT}`,
    trace: "on-first-retry",
    storageState: paceOff,
    extraHTTPHeaders: remote ? { "x-staging-token": process.env.STAGING_ACCESS_KEY ?? "" } : {},
  },
  projects: remote
    ? devicesProjects
    : [
        ...devicesProjects,
        {
          name: "gate",
          testMatch: /gate\.spec\.ts/,
          use: { ...devices["Desktop Chrome"], baseURL: `http://localhost:${GATE_PORT}` },
        },
      ],
  // The build runs once beforehand (see the test:e2e script); these only start servers.
  webServer: remote
    ? undefined
    : [
        {
          command: `pnpm exec next start -p ${PORT}`,
          url: `http://localhost:${PORT}/api/health`,
          reuseExistingServer: mayReuse(PORT, DEFAULT_PORT),
          timeout: 60_000,
        },
        {
          command: `pnpm exec next start -p ${GATE_PORT}`,
          url: `http://localhost:${GATE_PORT}/api/health`,
          reuseExistingServer: mayReuse(GATE_PORT, DEFAULT_GATE_PORT),
          timeout: 60_000,
          env: { STAGING_GATE: "on", STAGING_ACCESS_KEY: TEST_ACCESS_KEY },
        },
      ],
});
