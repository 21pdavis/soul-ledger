/**
 * The 3D world's graphics level (ADR 0068): Full, Simple, or Off (a still image). A choice the
 * reader saved on this device always wins, except that without WebGL there is nothing to draw.
 * Otherwise the world starts on Full (Simple on a weak device or software-drawn WebGL, ADR 0075),
 * or Off for readers who prefer reduced motion.
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
  hint = "full",
}: {
  webgl: boolean;
  reducedMotion: boolean;
  saved: GraphicsLevel | null;
  /** Where to start when nothing else decides (see deviceHintLevel). */
  hint?: GraphicsLevel;
}): GraphicsLevel {
  if (!webgl) return "off";
  if (saved) return saved;
  return reducedMotion ? "off" : hint;
}

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|basic render driver|mesa offscreen/i;

/** True when a WebGL renderer string names a software (no graphics card) rasteriser (ADR 0075). */
export function isSoftwareRenderer(renderer: string | undefined): boolean {
  return renderer !== undefined && SOFTWARE_RENDERER.test(renderer);
}

/**
 * A weak device (few cores or little memory) or software-drawn WebGL starts on Simple; the lowest
 * hint wins. Unknown values count as fine. The thresholds are a first guess, not tuned yet.
 */
export function deviceHintLevel({
  cores,
  memory,
  softwareRenderer,
}: {
  cores?: number;
  memory?: number;
  softwareRenderer?: boolean;
}): GraphicsLevel {
  if (softwareRenderer) return "simple";
  if (cores !== undefined && cores <= 4) return "simple";
  if (memory !== undefined && memory <= 4) return "simple";
  return "full";
}

/** The hint for this browser (`deviceMemory` is Chromium-only, so it may be missing). */
export function browserDeviceHint(): GraphicsLevel {
  if (typeof navigator === "undefined") return "full";
  const n = navigator as Navigator & { deviceMemory?: number };
  supportsWebGL(); // runs the one-time probe, which also reads the renderer name
  return deviceHintLevel({
    cores: n.hardwareConcurrency,
    memory: n.deviceMemory,
    softwareRenderer: isSoftwareRenderer(webglRenderer),
  });
}

/** The button's order: Full, then Simple, then Off, then round again. */
export function nextGraphicsLevel(level: GraphicsLevel): GraphicsLevel {
  return LEVELS[(LEVELS.indexOf(level) + 1) % LEVELS.length];
}

export function graphicsLabel(level: GraphicsLevel): string {
  return { full: "Full", simple: "Simple", off: "Off" }[level];
}

/** Remember the reader's choice on this device. Storage can be blocked, so failures are ignored. */
export function saveGraphics(
  level: GraphicsLevel,
  storage: Pick<Storage, "setItem"> | undefined = safeStorage(),
): void {
  try {
    storage?.setItem(GRAPHICS_KEY, level);
  } catch {
    // Not saved; the choice still holds for this visit.
  }
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
let webglRenderer: string | undefined;

/** The GPU's name: the unmasked one when the browser offers it, else the generic RENDERER. */
function readRenderer(gl: WebGLRenderingContext): string | undefined {
  try {
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const name = gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
    return typeof name === "string" ? name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * True when this browser can draw WebGL. Checked once per page on a throwaway canvas whose
 * context is released straight away (browsers cap live contexts, and Replay remounts the world).
 */
export function supportsWebGL(): boolean {
  // On the server there is nothing to probe; say no, but do not remember it.
  if (typeof document === "undefined") return false;
  if (webglSupport !== undefined) return webglSupport;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (gl) webglRenderer = readRenderer(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    webglSupport = Boolean(gl);
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}
