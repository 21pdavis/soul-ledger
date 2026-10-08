import { describe, expect, it, vi } from "vitest";
import { runBotGh } from "../../scripts/bot-gh";

describe("runBotGh", () => {
  it("runs gh with GH_TOKEN and passes the exit code through", async () => {
    const spawn = vi.fn(() => 3);
    const code = await runBotGh(["pr", "list"], {
      getToken: async () => "ghs_tok",
      spawn,
      env: { PATH: "p" },
      err: () => {},
    });
    expect(code).toBe(3);
    expect(spawn).toHaveBeenCalledWith("gh", ["pr", "list"], { PATH: "p", GH_TOKEN: "ghs_tok" });
  });

  it("refuses gh auth so the token can never be printed", async () => {
    const spawn = vi.fn(() => 0);
    const getToken = vi.fn(async () => "t");
    const lines: string[] = [];
    const code = await runBotGh(["auth", "token"], {
      getToken,
      spawn,
      env: {},
      err: (m) => lines.push(m),
    });
    expect(code).not.toBe(0);
    expect(spawn).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
    expect(lines).toEqual([expect.stringContaining("auth")]);
  });

  it("reports a one-line message when gh cannot be spawned", async () => {
    const lines: string[] = [];
    const code = await runBotGh(["pr", "list"], {
      getToken: async () => "ghs_tok",
      spawn: () => null,
      env: {},
      err: (m) => lines.push(m),
    });
    expect(code).not.toBe(0);
    expect(lines).toEqual(["bot:gh: could not run gh"]);
  });

  it("exits non-zero with a one-line message and never spawns when auth fails", async () => {
    const spawn = vi.fn(() => 0);
    const lines: string[] = [];
    const code = await runBotGh(["x"], {
      getToken: async () => {
        throw new Error("Missing CLAUDE_BOT_APP_ID");
      },
      spawn,
      env: {},
      err: (m) => lines.push(m),
    });
    expect(code).not.toBe(0);
    expect(spawn).not.toHaveBeenCalled();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("CLAUDE_BOT_APP_ID");
    expect(lines[0]).not.toContain("\n");
  });
});
