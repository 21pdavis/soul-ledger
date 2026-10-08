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
