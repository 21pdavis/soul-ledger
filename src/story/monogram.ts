/**
 * Initials for a hero's monogram tile (ADR 0051: deco tiles stand in for hero icons).
 * Two words give two initials, one word gives its first two letters, and an unknown hero
 * ("Hero #99", see heroName) gets "?".
 */
export function monogramFor(name: string): string {
  if (/^Hero #\d+$/.test(name)) return "?";
  const words = name.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** A rate clamped into 0..1 (and NaN to 0), for bar widths. */
export function clampShare(rate: number): number {
  if (Number.isNaN(rate)) return 0;
  return Math.min(1, Math.max(0, rate));
}
