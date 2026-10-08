// `pnpm bot:gh <gh args>`: run gh as the "Soul Ledger Claude" GitHub App (ADR 0059).
// Never falls back to the owner's identity, never prints the token or key.
import { spawnSync, execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { buildAppJwt, loadBotConfig, mintInstallationToken, parseRegQuery } from "./bot-token";

export type BotGhDeps = {
  getToken: () => Promise<string>;
  spawn: (cmd: string, args: string[], env: Record<string, string | undefined>) => number | null;
  env: Record<string, string | undefined>;
  err: (line: string) => void;
};

export async function runBotGh(args: string[], deps: BotGhDeps): Promise<number> {
  if (args[0] === "auth") {
    deps.err("bot:gh: `gh auth` is refused so the bot token can never be printed");
    return 1;
  }
  let token: string;
  try {
    token = await deps.getToken();
  } catch (e) {
    const msg = (e instanceof Error ? e.message : "unknown error").replace(/\s+/g, " ");
    deps.err(`bot:gh: cannot authenticate as the bot (${msg}); not falling back to the owner`);
    return 1;
  }
  const code = deps.spawn("gh", args, { ...deps.env, GH_TOKEN: token });
  if (code === null) {
    deps.err("bot:gh: could not run gh");
    return 1;
  }
  return code;
}

function regQuery(name: string): string | undefined {
  const reg = `${process.env.SystemRoot ?? "C:\\Windows"}\\System32\\reg.exe`;
  let out: string;
  try {
    out = execFileSync(reg, ["query", "HKCU\\Environment", "/v", name], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return undefined;
  }
  return parseRegQuery(out, name);
}

async function mintToken(): Promise<string> {
  const cfg = loadBotConfig({ env: process.env, regQuery, platform: process.platform });
  let pem: string;
  try {
    pem = readFileSync(cfg.keyPath, "utf8");
  } catch {
    throw new Error("the key file named by CLAUDE_BOT_KEY_PATH cannot be read");
  }
  const jwt = buildAppJwt(cfg.appId, pem, Math.floor(Date.now() / 1000));
  const { token } = await mintInstallationToken({
    jwt,
    installationId: cfg.installationId,
    fetch,
  });
  return token;
}

if (process.argv[1] && /bot-gh\.ts$/.test(process.argv[1].replace(/\\/g, "/"))) {
  runBotGh(process.argv.slice(2), {
    getToken: mintToken,
    spawn: (cmd, args, env) =>
      spawnSync(cmd, args, { env: env as NodeJS.ProcessEnv, stdio: "inherit" }).status,
    env: process.env,
    err: (l) => console.error(l),
  }).then((code) => process.exit(code));
}
