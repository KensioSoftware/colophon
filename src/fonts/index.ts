import type { FontSource } from "../types.js";

export { fontFilePaths } from "./materialise.js";
export { resolveFonts } from "./resolve.js";

/**
 * The family the rasteriser should fall back to when a `font-family` names
 * something it has not loaded — the first declared family, so the fallback is
 * the same wherever the build runs rather than whichever font loaded first.
 */
export function fallbackFamily(
  fonts: readonly FontSource[],
): string | undefined {
  return fonts.find((font) => font.family !== undefined)?.family;
}
