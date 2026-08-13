import type { Dimensions, Texture } from "../types.js";
import { fallbackColor } from "./color.js";
import { tile } from "./tile.js";

const dotDefaults = { opacity: 0.08, size: 5, gap: 44 };
const ruleDefaults = { opacity: 0.06, width: 2, gap: 28, angle: 45 };
const crossDefaults = { opacity: 0.09, size: 9, width: 1.5, gap: 48 };

/**
 * How much fainter the crossing set of rules is than the first.
 *
 * The same figure the two sets of rings in `waves` use, and for the same
 * reason: two sets at one opacity read as two sets, and dropping one of them
 * is what turns the crossings into a surface with a weave to it.
 */
const crossScale = 0.65;

/** A grid of dots, one to a tile. */
export function dotsSvg(
  texture: Extract<Texture, { readonly type: "dots" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const gap = texture.gap ?? dotDefaults.gap;
  const centre = String(gap / 2);
  const dot =
    `<circle cx="${centre}" cy="${centre}"` +
    ` r="${String((texture.size ?? dotDefaults.size) / 2)}"` +
    ` fill="${texture.color ?? fallbackColor}"/>`;

  return tile(
    id,
    gap,
    dot,
    "",
    dimensions,
    texture.opacity ?? dotDefaults.opacity,
  );
}

/**
 * A small cross where each line of a grid would meet, one to a tile.
 *
 * It is the dot grid with a little more to look at, and it costs the same: the
 * mark is two strokes rather than a fill, and the tile is square to the image
 * either way.
 */
export function crossesSvg(
  texture: Extract<Texture, { readonly type: "crosses" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const gap = texture.gap ?? crossDefaults.gap;
  const centre = gap / 2;
  const arm = (texture.size ?? crossDefaults.size) / 2;
  const from = String(centre - arm);
  const to = String(centre + arm);
  const cross =
    `<path d="M${from} ${String(centre)}H${to}M${String(centre)} ${from}V${to}"` +
    ` stroke="${texture.color ?? fallbackColor}"` +
    ` stroke-width="${String(texture.width ?? crossDefaults.width)}"` +
    ` fill="none"/>`;

  return tile(
    id,
    gap,
    cross,
    "",
    dimensions,
    texture.opacity ?? crossDefaults.opacity,
  );
}

/**
 * Ruled lines, one to a tile, rotated as a set.
 *
 * The line runs down the middle of its tile rather than along the edge, so
 * that the whole of its width is inside the tile: a stroke centred on the edge
 * would have half of itself outside the tile, where the pattern does not
 * repeat it, and the lines would come out half as thick as asked for.
 */
export function rulesSvg(
  texture: Extract<Texture, { readonly type: "rules" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const gap = texture.gap ?? ruleDefaults.gap;
  const x = String(gap / 2);
  const line =
    `<line x1="${x}" y1="0" x2="${x}" y2="${String(gap)}"` +
    ` stroke="${texture.color ?? fallbackColor}"` +
    ` stroke-width="${String(texture.width ?? ruleDefaults.width)}"/>`;
  const angle = texture.angle ?? ruleDefaults.angle;
  const opacity = texture.opacity ?? ruleDefaults.opacity;

  const set = (name: string, at: number, alpha: number): string =>
    tile(
      name,
      gap,
      line,
      ` patternTransform="rotate(${String(at)})"`,
      dimensions,
      alpha,
    );

  if (texture.cross !== true) {
    // One set keeps the id it always had, so that the common case draws what
    // it drew before, down to the byte.
    return set(id, angle, opacity);
  }

  return (
    set(`${id}a`, angle, opacity) +
    set(`${id}b`, -angle, Math.round(opacity * crossScale * 1000) / 1000)
  );
}
