// Downloads each hero’s card and small icon from deadlock-api into public/heroes/ (ADR 0060).
// Re-run after a patch adds heroes, then commit the new files. Usage: node scripts/fetch-hero-art.mjs
// The API’s art is sometimes wrong (another hero’s file, or the small icon standing in for the card), so
// a file is skipped if it is named after a different hero, and so is a card that is only the small icon.
// Art is often named after a codename (Lady Geist is "spectre"), so a name that matches nobody is kept.
// Anything skipped is logged and shows the monogram tile in the app.
import { mkdir, rm, writeFile } from "node:fs/promises";

const res = await fetch("https://api.deadlock-api.com/v1/assets/heroes", {
  signal: AbortSignal.timeout(30_000),
});
if (!res.ok) throw new Error(`heroes request failed: ${res.status}`);
const heroes = await res.json();
await rm("public/heroes", { recursive: true, force: true });
await mkdir("public/heroes", { recursive: true });

const classes = new Map(heroes.map((h) => [h.class_name?.replace(/^hero_/, ""), h.id]));
let saved = 0;
for (const h of heroes) {
  for (const [key, suffix] of [
    ["icon_hero_card_webp", "card"],
    ["icon_image_small_webp", "sm"],
  ]) {
    const url = h.images?.[key];
    if (!url) continue;
    const file = url.split("/").pop();
    const owner = classes.get(file.split("_")[0]);
    if (owner !== undefined && owner !== h.id) {
      console.warn(`skip ${h.id} ${h.name} ${suffix}: ${file} belongs to hero ${owner}`);
      continue;
    }
    if (suffix === "card" && file.includes("_sm.")) {
      console.warn(`skip ${h.id} ${h.name} card: only the small icon exists`);
      continue;
    }
    const img = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!img.ok) {
      console.warn(`skip ${h.id} ${h.name} ${suffix}: ${img.status}`);
      continue;
    }
    await writeFile(`public/heroes/${h.id}-${suffix}.webp`, Buffer.from(await img.arrayBuffer()));
    saved++;
  }
}
console.log(`saved ${saved} files`);
