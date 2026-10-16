import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Width and height of a WebP (lossy VP8, lossless VP8L or extended VP8X), read from its header. */
function webpSize(buf: Buffer): { width: number; height: number } {
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X")
    return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
  if (chunk === "VP8 ")
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L") {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  throw new Error(`not a WebP: ${chunk}`);
}

// The still city behind the story on Off (ADR 0069) is stretched to cover the whole screen, so a
// small render looks blurry on a large or high-density display.
describe("the still city picture", () => {
  const buf = readFileSync(join(process.cwd(), "public/world/still.webp"));

  it("is large enough to stay sharp on a 1440p or high-density screen", () => {
    const { width, height } = webpSize(buf);
    expect(width).toBeGreaterThanOrEqual(2560);
    expect(height).toBeGreaterThanOrEqual(1600);
  });

  it("stays a reasonable download", () => {
    expect(buf.byteLength).toBeLessThan(600 * 1024);
  });
});
