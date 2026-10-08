import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoadingScreen } from "@/components/app/LoadingScreen";
import type { ClientLookupEvent } from "@/lib/client/lookup-stream";

const resolved: ClientLookupEvent = { type: "resolved", accountId: 1 };
const profile = (over: Record<string, unknown> = {}): ClientLookupEvent => ({
  type: "profile",
  accountId: 1,
  personaName: "Gaben",
  avatarUrl: "https://avatars.steamstatic.com/g_full.jpg",
  ...over,
});
const history = (over: Record<string, unknown> = {}): ClientLookupEvent => ({
  type: "history",
  totalMatches: 120,
  newMatches: 120,
  heroIds: [1, 2, 18],
  ...over,
});
const details = (fetched: number, total = 100): ClientLookupEvent => ({
  type: "details",
  fetched,
  total,
  kills: fetched * 8,
  breakables: fetched * 3,
  sinnerJackpots: 1,
});
const waiting: ClientLookupEvent = { type: "waiting" };

/** jsdom has no matchMedia; this answers the reduced-motion query only. */
function setReducedMotion(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }));
}

beforeEach(() => setReducedMotion(true));
afterEach(() => vi.unstubAllGlobals());

describe("LoadingScreen", () => {
  it("has the page's one h1 at every stage, above the stage headings", () => {
    const stages = [
      [resolved],
      [resolved, profile()],
      [resolved, profile(), history(), details(40)],
    ];
    for (const progress of stages) {
      const { unmount } = render(<LoadingScreen progress={progress} />);
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your Soul Ledger");
      unmount();
    }
  });

  it("before any stage, says it is looking up the ledger", () => {
    render(<LoadingScreen progress={[resolved]} />);
    expect(screen.getByRole("status")).toHaveTextContent("Looking up your ledger...");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("stage 1: shows the avatar and the persona name with a teaser", () => {
    const { container } = render(<LoadingScreen progress={[resolved, profile()]} />);
    expect(screen.getByText("Gaben")).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://avatars.steamstatic.com/g_full.jpg",
    );
    expect(screen.getByText(/found you, gaben/i)).toBeInTheDocument();
  });

  it("stage 1 without an avatar or name still renders a placeholder sigil", () => {
    render(<LoadingScreen progress={[profile({ personaName: null, avatarUrl: null })]} />);
    expect(screen.getByText(/found you\./i)).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("stage 2: shows the match count and a monogram tile per hero", () => {
    render(<LoadingScreen progress={[resolved, profile(), history()]} />);
    expect(screen.getByText("120 matches on the books")).toBeInTheDocument();
    const heroes = within(screen.getByRole("list", { name: "Heroes you have played" }));
    expect(heroes.getAllByRole("listitem")).toHaveLength(3);
    expect(heroes.getByText("Infernus")).toBeInTheDocument();
    expect(heroes.getByText("MK")).toBeInTheDocument();
    // The earlier stage stays on the page.
    expect(screen.getByText("Gaben")).toBeInTheDocument();
  });

  it("stage 2 says how many matches are new on a return visit", () => {
    render(<LoadingScreen progress={[profile(), history({ newMatches: 14 })]} />);
    expect(screen.getByText("120 matches, 14 new to the ledger")).toBeInTheDocument();
  });

  it("stage 2 shows at most 12 hero tiles and counts the rest", () => {
    const heroIds = Array.from({ length: 20 }, (_, i) => i + 1);
    render(<LoadingScreen progress={[profile(), history({ heroIds })]} />);
    const heroes = within(screen.getByRole("list", { name: "Heroes you have played" }));
    // 12 tiles plus the "+8 more" item.
    expect(heroes.getAllByRole("listitem")).toHaveLength(13);
    expect(heroes.getAllByTitle(/.+/)).toHaveLength(12);
    expect(screen.getByText("+8 more")).toBeInTheDocument();
  });

  it("stage 3: shows the counters and the tally", () => {
    render(<LoadingScreen progress={[profile(), history(), details(40)]} />);
    const bar = screen.getByRole("progressbar", { name: "Match details read" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("/ 100")).toBeInTheDocument();
    expect(screen.getByText("320")).toBeInTheDocument(); // kills
    expect(screen.getByText("120")).toBeInTheDocument(); // crates
    expect(screen.getByText(/counting every kill/i)).toBeInTheDocument();
  });

  it("a return visit with nothing new (resolved, profile, history, done) says the ledger is up to date", () => {
    render(
      <LoadingScreen
        progress={[
          resolved,
          profile(),
          history({ newMatches: 0 }),
          { type: "done", matchCount: 120 },
        ]}
      />,
    );
    expect(screen.getByText(/already up to date/i)).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("The tally")).toBeInTheDocument();
  });

  it("the avatar image does not leak a referrer and falls back to the sigil if it fails to load", () => {
    const { container } = render(<LoadingScreen progress={[profile()]} />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
    fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Gaben")).toBeInTheDocument();
  });

  it("does not load an avatar from a host that is not Steam's CDN", () => {
    const { container } = render(
      <LoadingScreen progress={[profile({ avatarUrl: "https://tracker.example/pixel.png" })]} />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("an empty history shows no tile list and no roster teaser", () => {
    render(
      <LoadingScreen
        progress={[profile(), history({ totalMatches: 0, newMatches: 0, heroIds: [] })]}
      />,
    );
    expect(screen.getByText("No matches on the books yet")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Heroes you have played" })).not.toBeInTheDocument();
    expect(screen.queryByText(/roster/i)).not.toBeInTheDocument();
  });

  it("keeps its teasers celebratory rather than ominous", () => {
    render(<LoadingScreen progress={[profile(), history()]} />);
    expect(document.body.textContent).not.toMatch(/evidence|already open/i);
  });

  it("shows later entries as blank lines until their stage arrives", () => {
    render(<LoadingScreen progress={[profile()]} />);
    expect(screen.getByText("The matches")).toBeInTheDocument();
    expect(screen.getByText("The tally")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("waiting: shows a waiting state and keeps the stage it reached", () => {
    render(<LoadingScreen progress={[profile(), history(), waiting]} />);
    expect(screen.getByRole("status")).toHaveTextContent(/waiting our turn/i);
    expect(screen.getByText("120 matches on the books")).toBeInTheDocument();
    expect(screen.queryByText(/error|failed/i)).not.toBeInTheDocument();
  });

  it("waiting before any stage still renders and does not error", () => {
    render(<LoadingScreen progress={[resolved, waiting]} />);
    expect(screen.getByRole("status")).toHaveTextContent(/waiting our turn/i);
  });

  describe("accessibility", () => {
    it("announces through one polite status region", () => {
      render(<LoadingScreen progress={[profile()]} />);
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent("Found Gaben.");
      expect(status).toHaveAttribute("aria-live", "polite");
      expect(screen.getAllByRole("status")).toHaveLength(1);
    });

    it("announces stage changes, not counter ticks", () => {
      const { rerender } = render(<LoadingScreen progress={[profile(), history()]} />);
      rerender(<LoadingScreen progress={[profile(), history(), details(10)]} />);
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent("Reading your match details.");
      const before = status.textContent;
      rerender(<LoadingScreen progress={[profile(), history(), details(10), details(70)]} />);
      expect(screen.getByRole("status").textContent).toBe(before);
      expect(status).not.toHaveTextContent("70");
    });

    it("keeps the animated counters out of the live region", () => {
      render(<LoadingScreen progress={[profile(), history(), details(40)]} />);
      expect(within(screen.getByRole("status")).queryByText("40")).not.toBeInTheDocument();
    });
  });

  describe("motion", () => {
    it("with reduced motion, counters show their final values at once", () => {
      setReducedMotion(true);
      const { rerender } = render(<LoadingScreen progress={[profile(), history(), details(10)]} />);
      expect(screen.getByText("10")).toBeInTheDocument();
      rerender(<LoadingScreen progress={[profile(), history(), details(10), details(100)]} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("800")).toBeInTheDocument();
    });

    it("without reduced motion, counters count up and settle on the final value", async () => {
      setReducedMotion(false);
      render(<LoadingScreen progress={[profile(), history(), details(100)]} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
      await waitFor(() => expect(screen.getByText("800")).toBeInTheDocument(), { timeout: 3000 });
    });
  });
});
