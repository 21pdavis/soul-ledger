/**
 * The 3D world's graphics level (ADR 0068): Full, Simple, or Off (a still image). A choice the
 * reader saved on this device always wins, except that without WebGL there is nothing to draw.
 * Otherwise the world starts on Full, or Off for readers who prefer reduced motion.
 */
export type GraphicsLevel = "full" | "simple" | "off";

export const GRAPHICS_KEY = "soul-ledger:graphics";

const LEVELS: readonly GraphicsLevel[] = ["full", "simple", "off"];

export function isGraphicsLevel(v: unknown): v is GraphicsLevel {
  return typeof v === "string" && (LEVELS as readonly string[]).includes(v);
}

export function chooseGraphics({
  webgl,
  reducedMotion,
  saved,
}: {
  webgl: boolean;
  reducedMotion: boolean;
  saved: GraphicsLevel | null;
}): GraphicsLevel {
  if (!webgl) return "off";
  if (saved) return saved;
  return reducedMotion ? "off" : "full";
}

/** The level saved on this device, or null. Storage can be missing or throw, so it is guarded. */
export function loadSavedGraphics(
  storage: Pick<Storage, "getItem"> | undefined = safeStorage(),
): GraphicsLevel | null {
  try {
    const v = storage?.getItem(GRAPHICS_KEY);
    return isGraphicsLevel(v) ? v : null;
  } catch {
    return null;
  }
}

function safeStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

let webglSupport: boolean | undefined;

/**
 * True when this browser can draw WebGL. Checked once per page on a throwaway canvas whose
 * context is released straight away (browsers cap live contexts, and Replay remounts the world).
 */
export function supportsWebGL(): boolean {
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    webglSupport = Boolean(gl);
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}
