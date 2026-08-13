import type { Rect } from "../layout/index.js";
import { image } from "../layout/index.js";
import type { ImageAsset } from "../types.js";

/** The logo's height, as a fraction of the frame's. */
const logoScale = 0.075;

/**
 * Where the logo goes, or nothing where there is none.
 *
 * Its height comes from the image being drawn rather than from the logo's own
 * pixels, so the same file works on a square and a landscape, and its width
 * follows from the proportions of the picture. A logo whose format does not
 * state its size is drawn in a square, where a wordmark will sit small in the
 * middle rather than being stretched to fit.
 *
 * `area` is the frame's, which is the whole image unless the config named a
 * safe area. Taking it from the image instead would put the mark in a corner
 * a profile cover crops off, and size it against a height nobody sees.
 */
export function logoRect(
  logo: ImageAsset | undefined,
  area: Rect,
  pad: number,
  align: "start" | "middle",
): Rect | undefined {
  if (logo === undefined) {
    return undefined;
  }

  const height = Math.round(area.height * logoScale);
  const width = Math.round(height * logo.aspect);
  const x =
    align === "middle"
      ? Math.round(area.x + (area.width - width) / 2)
      : area.x + area.width - pad - width;

  return { x, y: area.y + pad, width, height };
}

/** The logo drawn in the rectangle it was given, whole rather than cropped. */
export function logoElement(
  logo: ImageAsset | undefined,
  rect: Rect | undefined,
): string {
  return logo === undefined || rect === undefined
    ? ""
    : image(rect, logo.href, { fit: "contain" });
}
