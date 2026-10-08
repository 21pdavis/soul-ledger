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

/** Patch dates are UTC midnight (ADR 0035); format in UTC so every viewer sees the same day. */
export function formatPatchDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
