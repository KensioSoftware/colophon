import type { Dimensions, Texture } from "../types.js";
import { fallbackColor } from "./color.js";
import { tile } from "./tile.js";

const gridDefaults = { opacity: 0.07, width: 1.5, gap: 48, major: 5 };

/** How much heavier the every-so-often line is than the rest. */
const majorScale = 2;

/** One square's worth of grid: a line along two of its edges. */
function square(
  texture: Extract<Texture, { readonly type: "grid" }>,
  gap: number,
  width: number,
): string {
  const middle = String(gap / 2);
  const size = String(gap);

  // Down the middle of the tile on both axes rather than along its edges, for
  // the reason `rulesSvg` gives: a stroke centred on the edge would have half
  // of itself outside the tile, where the pattern does not repeat it.
  return (
    `<path d="M0 ${middle}H${size}M${middle} 0V${size}"` +
    ` stroke="${texture.color ?? fallbackColor}"` +
    ` stroke-width="${String(width)}" fill="none"/>`
  );
}

/**
 * Squared paper: lines both ways, and a heavier one every so often.
 *
 * The heavy lines are a second tile rather than part of the first, since what
 * makes them heavy is that they repeat at a multiple of the spacing. Drawing
 * both from `<pattern>`s keeps this among the cheap treatments: the tiles are
 * square to the image, so a row of the rendered picture repeats, which is what
 * the compression works on.
 */
export function gridSvg(
  texture: Extract<Texture, { readonly type: "grid" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const gap = texture.gap ?? gridDefaults.gap;
  const width = texture.width ?? gridDefaults.width;
  const opacity = texture.opacity ?? gridDefaults.opacity;
  const major = texture.major ?? gridDefaults.major;

  const fine = tile(
    `${id}a`,
    gap,
    square(texture, gap, width),
    "",
    dimensions,
    opacity,
  );

  if (major < 2) {
    return fine;
  }

  return (
    fine +
    tile(
      `${id}b`,
      gap * major,
      square(texture, gap * major, width * majorScale),
      "",
      dimensions,
      opacity,
    )
  );
}
