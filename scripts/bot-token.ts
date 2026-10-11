// Mints GitHub App installation tokens for the "Soul Ledger Claude" bot (ADR 0059).
// Pure, injectable functions: nothing here prints or logs a secret.
import { createSign } from "node:crypto";

export function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function buildAppJwt(appId: string, privateKeyPem: string, nowSec: number): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iat: nowSec - 60, exp: nowSec + 540, iss: appId }));
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(privateKeyPem);
  return `${header}.${claims}.${base64url(signature)}`;
}

export type BotConfig = { appId: string; installationId: string; keyPath: string };

const VARS = {
  appId: "CLAUDE_BOT_APP_ID",
  installationId: "CLAUDE_BOT_INSTALLATION_ID",
  keyPath: "CLAUDE_BOT_KEY_PATH",
} as const;

export function loadBotConfig(opts: {
  env: Record<string, string | undefined>;
  regQuery: (name: string) => string | undefined;
  platform: string;
}): BotConfig {
  const out = {} as BotConfig;
  for (const [field, name] of Object.entries(VARS) as [keyof BotConfig, string][]) {
    let value = opts.env[name]?.trim();
    if (!value && opts.platform === "win32") value = opts.regQuery(name)?.trim();
    if (!value) {
      throw new Error(
        `Bot is not configured: ${name} is not set in the environment or the Windows user registry`,
      );
    }
    out[field] = value;
  }
  return out;
}

/** Reads a user-scope Windows environment variable via `reg query`. */
export function parseRegQuery(stdout: string, name: string): string | undefined {
  const m = stdout.match(new RegExp(`^\\s*${name}\\s+REG_(EXPAND_)?SZ\\s+(.*)$`, "m"));
  if (m?.[1] && m[2].includes("%")) {
    throw new Error(`${name} is a REG_EXPAND_SZ value with %VAR% in it; store it as plain REG_SZ`);
  }
  return m?.[2].trim() || undefined;
}

export async function mintInstallationToken(opts: {
  jwt: string;
  installationId: string;
  fetch: typeof fetch;
}): Promise<{ token: string; expiresAt: string }> {
  const res = await opts.fetch(
    `https://api.github.com/app/installations/${opts.installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (res.status !== 201) {
    throw new Error(`Could not mint a bot installation token: GitHub returned HTTP ${res.status}`);
  }
  const body = (await res.json()) as { token: string; expires_at: string };
  if (typeof body.token !== "string" || body.token === "") {
    throw new Error("GitHub's response did not include a token");
  }
  return { token: body.token, expiresAt: body.expires_at };
}
