import { expect, test } from "@playwright/test";
import { fixtureStory } from "../fixtures/story";
import { mockLookup, ndjson, openEntry, PROFILE, stageSettled, storyEvent } from "./lookup-mock";

const OUT = process.env.SHOT_DIR!;

for (const graphics of ["off", "full"]) {
  test(`nemesis shot ${graphics}`, async ({ page, isMobile }) => {
    test.setTimeout(120_000);
    if (graphics !== "off") {
      await page.addInitScript(() => localStorage.setItem("soul-ledger:graphics", "full"));
    }
    const story = fixtureStory();
    story.nemesis = { heroId: 15, kills: 37 };
    await mockLookup(page, ndjson({ type: "resolved", accountId: 1 }, storyEvent({}, story)));
    await openEntry(page);
    await page.getByLabel("Paste your Steam profile URL").fill(PROFILE);
    await page.getByRole("button", { name: "Open the ledger" }).click();
    const stage = page.getByTestId("story-stage");
    for (let i = 0; i < 12; i++) {
      if ((await stage.getAttribute("data-slide")) === "kills") break;
      await stageSettled(page);
      await page.keyboard.press("ArrowRight");
    }
    await expect(stage).toHaveAttribute("data-slide", "kills");
    await stageSettled(page);
    await page.waitForTimeout(graphics === "off" ? 1500 : 6000);
    await page.screenshot({ path: `${OUT}/${isMobile ? "phone" : "desktop"}-${graphics}.png` });
  });
}
