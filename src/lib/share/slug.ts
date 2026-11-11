import { randomBytes } from "node:crypto";

/** The name part of a share link is capped at about 20 characters (ADR 0079). */
export const SLUG_NAME_MAX = 20;

const RANDOM_LENGTH = 8;
// 32 symbols, so each random byte maps to one evenly (byte & 31).
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/**
 * A Steam name reduced to plain lowercase letters and digits for a URL: accents are folded to
 * their base letter, everything else is dropped. Empty when nothing usable is left.
 */
export function slugName(personaName: string | null | undefined): string {
  return (personaName ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, SLUG_NAME_MAX);
}

/** The unguessable part of a share link: 8 characters, 40 bits. */
export function randomSlugPart(): string {
  return Array.from(randomBytes(RANDOM_LENGTH), (b) => ALPHABET[b & 31]).join("");
}

/** `/w/<name>-<random>`, or the random part alone when the name has nothing usable (ADR 0079). */
export function buildSlug(personaName: string | null | undefined, random: string): string {
  const name = slugName(personaName);
  return name ? `${name}-${random}` : random;
}
