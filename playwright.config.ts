import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const GATE_PORT = 3101;

/** Local stand-in secrets for the gated server; never used anywhere real. */
export const TEST_BYPASS_TOKEN = "e2e-bypass-token-0123456789abcdef0123";

/**
 * Two modes:
 * - Local (default): `pnpm test:e2e` builds once, then starts an open server (like production)
 *   and a gated one (like staging) to test the gate itself.
 * - Remote: with STAGING_URL and STAGING_BYPASS_TOKEN set, `pnpm test:e2e:staging` runs the
 *   phone and desktop suites against live staging, passing the gate with the bypass token.
 */
const remote = process.env.STAGING_URL;

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
    extraHTTPHeaders: remote ? { "x-staging-token": process.env.STAGING_BYPASS_TOKEN ?? "" } : {},
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
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
        {
          command: `pnpm exec next start -p ${GATE_PORT}`,
          url: `http://localhost:${GATE_PORT}/api/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
          env: {
            STAGING_GATE: "on",
            STAGING_ALLOWED_EMAILS: "owner@example.com",
            STAGING_BYPASS_TOKEN: TEST_BYPASS_TOKEN,
            AUTH_SECRET: "e2e-only-auth-secret-not-used-anywhere-real",
            AUTH_GOOGLE_ID: "e2e-google-client-id",
            AUTH_GOOGLE_SECRET: "e2e-google-client-secret",
          },
        },
      ],
});
