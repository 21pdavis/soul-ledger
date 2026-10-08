import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/app/App";
import type { SlideProps } from "@/story/types";
import { fixtureStory } from "../fixtures/story";

// A stand-in for the real story player: it has slide state, so we can see Replay reset it.
vi.mock("@/components/app/StoryStage", () => ({
  StoryStage: ({ actions }: SlideProps) => {
    const [slide, setSlide] = useState(1);
    return (
      <div>
        <p>{`Slide ${slide}`}</p>
        <button onClick={() => setSlide((s) => s + 1)}>Next</button>
        <button onClick={actions.onReplay}>Replay</button>
      </div>
    );
  },
}));

beforeEach(() => localStorage.clear());

describe("App replay", () => {
  it("Replay returns the story to slide 1 without another lookup", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            type: "story",
            player: { accountId: 1, personaName: null, avatarUrl: null },
            window: "all",
            patchStart: null,
            stale: false,
            story: fixtureStory(),
          }) + "\n",
        ),
    );
    const user = userEvent.setup();
    render(<App fetchImpl={fetchMock as unknown as typeof fetch} />);
    await user.type(
      screen.getByLabelText("Paste your Steam profile URL"),
      "https://steamcommunity.com/id/gaben",
    );
    await user.click(screen.getByRole("button", { name: /open the ledger/i }));
    await screen.findByText("Slide 1");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Slide 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Replay" }));
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
