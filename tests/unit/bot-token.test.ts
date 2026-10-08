import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  base64url,
  buildAppJwt,
  loadBotConfig,
  mintInstallationToken,
  parseRegQuery,
} from "../../scripts/bot-token";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();

describe("base64url", () => {
  it("uses the url alphabet without padding", () => {
    expect(base64url(Buffer.from([0xfb, 0xff, 0xfe]))).toBe("-__-");
    expect(base64url("a")).toBe("YQ");
  });
});

describe("buildAppJwt", () => {
  const now = 1_700_000_000;
  const jwt = buildAppJwt("123", pem, now);
  const [h, p, s] = jwt.split(".");

  it("has RS256 header and the expected claims", () => {
    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({
      alg: "RS256",
      typ: "JWT",
    });
    expect(JSON.parse(Buffer.from(p, "base64url").toString())).toEqual({
      iat: now - 60,
      exp: now + 540,
      iss: "123",
    });
  });

  it("carries a valid RS256 signature", () => {
    const v = createVerify("RSA-SHA256").update(`${h}.${p}`);
    expect(v.verify(publicKey, Buffer.from(s, "base64url"))).toBe(true);
  });
});

describe("loadBotConfig", () => {
  const reg = (vals: Record<string, string>) => (name: string) => vals[name];

  it("prefers env over the registry", () => {
    const c = loadBotConfig({
      env: { CLAUDE_BOT_APP_ID: "1", CLAUDE_BOT_INSTALLATION_ID: "2", CLAUDE_BOT_KEY_PATH: "k" },
      regQuery: reg({ CLAUDE_BOT_APP_ID: "9" }),
      platform: "win32",
    });
    expect(c).toEqual({ appId: "1", installationId: "2", keyPath: "k" });
  });

  it("falls back to the registry on windows when env is empty", () => {
    const c = loadBotConfig({
      env: { CLAUDE_BOT_APP_ID: "" },
      regQuery: reg({
        CLAUDE_BOT_APP_ID: "1",
        CLAUDE_BOT_INSTALLATION_ID: "2",
        CLAUDE_BOT_KEY_PATH: "k",
      }),
      platform: "win32",
    });
    expect(c.appId).toBe("1");
  });

  it("does not query the registry off windows", () => {
    const regQuery = vi.fn();
    expect(() => loadBotConfig({ env: {}, regQuery, platform: "linux" })).toThrow(
      /CLAUDE_BOT_APP_ID/,
    );
    expect(regQuery).not.toHaveBeenCalled();
  });

  it("names the missing variable without leaking the others", () => {
    const opts = {
      env: { CLAUDE_BOT_APP_ID: "1", CLAUDE_BOT_KEY_PATH: "secret-path" },
      regQuery: () => undefined,
      platform: "win32" as const,
    };
    expect(() => loadBotConfig(opts)).toThrow(/CLAUDE_BOT_INSTALLATION_ID/);
    expect(() => loadBotConfig(opts)).not.toThrow(/secret-path/);
  });
});

describe("parseRegQuery", () => {
  it("extracts the value from reg query output", () => {
    const out =
      "\r\nHKEY_CURRENT_USER\\Environment\r\n    CLAUDE_BOT_APP_ID    REG_SZ    5240783\r\n\r\n";
    expect(parseRegQuery(out, "CLAUDE_BOT_APP_ID")).toBe("5240783");
    expect(parseRegQuery("", "CLAUDE_BOT_APP_ID")).toBeUndefined();
  });
});

describe("mintInstallationToken", () => {
  it("posts with bearer jwt and returns token and expiry", async () => {
    const fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ token: "ghs_x", expires_at: "2026-01-01T00:00:00Z" }), {
          status: 201,
        }),
    );
    const r = await mintInstallationToken({ jwt: "J", installationId: "77", fetch });
    expect(r).toEqual({ token: "ghs_x", expiresAt: "2026-01-01T00:00:00Z" });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.github.com/app/installations/77/access_tokens");
    expect(init.method).toBe("POST");
    const h = init.headers as Record<string, string>;
    expect(h.Authorization).toBe("Bearer J");
    expect(h.Accept).toBe("application/vnd.github+json");
    expect(h["X-GitHub-Api-Version"]).toBe("2022-11-28");
  });

  it("throws a clear error on non-201 without leaking the jwt", async () => {
    const fetch = vi.fn(async () => new Response("bad", { status: 401 }));
    const err = await mintInstallationToken({
      jwt: "SECRETJWT",
      installationId: "77",
      fetch,
    }).catch((e) => e);
    expect(String(err)).toMatch(/401/);
    expect(String(err)).not.toContain("SECRETJWT");
  });
});
