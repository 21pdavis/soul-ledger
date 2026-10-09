// Downloads each hero's card and small icon from deadlock-api into public/heroes/ (ADR 0060).
// Re-run after a patch adds heroes, then commit the new files. Usage: node scripts/fetch-hero-art.mjs
import { mkdir, writeFile } from "node:fs/promises";

const res = await fetch("https://api.deadlock-api.com/v1/assets/heroes");
if (!res.ok) throw new Error(`heroes request failed: ${res.status}`);
const heroes = await res.json();
await mkdir("public/heroes", { recursive: true });

let saved = 0;
for (const h of heroes) {
  for (const [key, suffix] of [
    ["icon_hero_card_webp", "card"],
    ["icon_image_small_webp", "sm"],
  ]) {
    const url = h.images?.[key];
    if (!url) continue;
    const img = await fetch(url);
    if (!img.ok) {
      console.warn(`skip ${h.id} ${suffix}: ${img.status}`);
      continue;
    }
    await writeFile(`public/heroes/${h.id}-${suffix}.webp`, Buffer.from(await img.arrayBuffer()));
    saved++;
  }
}
console.log(`saved ${saved} files`);
