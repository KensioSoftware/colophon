import type { Dimensions, Texture } from "../types.js";
import { fallbackColor } from "./color.js";
import { tile } from "./tile.js";

const moireDefaults = { opacity: 0.1, width: 1.5, gap: 24, angle: 4 };

/**
 * How much fainter the turned grid is than the square one.
 *
 * The same reasoning as the second set of rings in `waves`: two grids at one
 * opacity read as two grids, and dropping one of them is what turns the
 * crossings into a surface.
 */
const secondaryScale = 0.65;

/** One square grid: a line through the middle of the tile on each axis. */
function grid(
  texture: Extract<Texture, { readonly type: "moire" }>,
  dimensions: Dimensions,
  id: string,
  angle: number,
  opacity: number,
): string {
  const gap = texture.gap ?? moireDefaults.gap;
  const middle = String(gap / 2);
  const size = String(gap);

  // Down the middle of the tile on both axes rather than along its edges, for
  // the reason `rulesSvg` gives: a stroke centred on the edge would have half
  // of itself outside the tile, where the pattern does not repeat it.
  const lines =
    `<path d="M0 ${middle}H${size}M${middle} 0V${size}"` +
    ` stroke="${texture.color ?? fallbackColor}"` +
    ` stroke-width="${String(texture.width ?? moireDefaults.width)}"` +
    ` fill="none"/>`;

  return tile(
    id,
    gap,
    lines,
    angle === 0 ? "" : ` patternTransform="rotate(${String(angle)})"`,
    dimensions,
    opacity,
  );
}

/**
 * Two square grids, one turned a few degrees against the other.
 *
 * What is seen is the interference between them rather than either grid: the
 * lines cross at a different offset in every part of the image, which the eye
 * reads as broad bands sweeping across it. It is the same idea as `waves` with
 * straight edges instead of arcs, and that is what makes it much cheaper to
 * store, since a row of the image is closer to repeating.
 *
 * The angle is the whole texture. Below about a degree the bands are wider
 * than the image and it looks like one grid slightly out of true; above about
 * ten they are tight enough to read as a weave.
 */
export function moireSvg(
  texture: Extract<Texture, { readonly type: "moire" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const opacity = texture.opacity ?? moireDefaults.opacity;

  return (
    grid(texture, dimensions, `${id}a`, 0, opacity) +
    grid(
      texture,
      dimensions,
      `${id}b`,
      texture.angle ?? moireDefaults.angle,
      Math.round(opacity * secondaryScale * 1000) / 1000,
    )
  );
}
