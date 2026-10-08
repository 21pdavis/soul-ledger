/** Hours played: one decimal under 10 hours, whole hours from 10, and never "0" for someone who played. */
export function formatHours(hours: number): string {
  if (hours <= 0) return "0";
  const rounded = Math.max(0.1, Math.round(hours * 10) / 10);
  return rounded < 10 ? rounded.toFixed(1) : String(Math.round(rounded));
}

/** A 0..1 rate as a whole percent. */
export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * The number in "Top N%": one decimal under 10 (a trailing .0 dropped), whole percent from 10 up.
 * `topPercent` is already in [0.5, 99.5], so it never reads "Top 0%". The one formatter for every
 * slide, so the same stat reads the same everywhere.
 */
export function formatTopPercent(topPercent: number): string {
  if (topPercent >= 10) return String(Math.round(topPercent));
  return String(Math.round(topPercent * 10) / 10);
}

/** Patch dates are UTC midnight (ADR 0035); format in UTC so every viewer sees the same day. */
export function formatPatchDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
