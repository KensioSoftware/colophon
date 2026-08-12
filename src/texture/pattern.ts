import type { Dimensions, Texture } from "../types.js";
import { fallbackColor } from "./color.js";

const dotDefaults = { opacity: 0.08, size: 5, gap: 44 };
const ruleDefaults = { opacity: 0.06, width: 2, gap: 28, angle: 45 };

/**
 * A tiled pattern over the whole image: the `<pattern>` under the given `id`,
 * and the rect that fills with it.
 */
function tile(
  id: string,
  gap: number,
  contents: string,
  transform: string,
  dimensions: Dimensions,
  opacity: number,
): string {
  const { width, height } = dimensions;
  const size = String(gap);

  return (
    `<defs>` +
    `<pattern id="${id}" width="${size}" height="${size}"` +
    ` patternUnits="userSpaceOnUse"${transform}>${contents}</pattern>` +
    `</defs>` +
    `<rect width="${String(width)}" height="${String(height)}"` +
    ` fill="url(#${id})" opacity="${String(opacity)}"/>`
  );
}

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

  return tile(
    id,
    gap,
    line,
    ` patternTransform="rotate(${String(angle)})"`,
    dimensions,
    texture.opacity ?? ruleDefaults.opacity,
  );
}
