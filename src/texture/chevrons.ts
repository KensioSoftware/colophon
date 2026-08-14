import type { Dimensions, Texture } from "../types.js";
import { fallbackColor } from "./color.js";
import { tile } from "./tile.js";

const chevronDefaults = { opacity: 0.07, width: 3, gap: 54 };

/**
 * Rows of chevrons: one V to a tile, meeting its neighbours at the tile edge.
 *
 * The V spans the whole width and stops short of the top and bottom, so the
 * rows have air between them. Its ends sit at the same height on both edges,
 * which is what makes one tile's chevron continue into the next rather than
 * ending in a corner.
 */
export function chevronsSvg(
  texture: Extract<Texture, { readonly type: "chevrons" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const gap = texture.gap ?? chevronDefaults.gap;
  const low = String(gap * 0.7);
  const high = String(gap * 0.3);
  const chevron =
    `<path d="M0 ${low}L${String(gap / 2)} ${high}L${String(gap)} ${low}"` +
    ` stroke="${texture.color ?? fallbackColor}"` +
    ` stroke-width="${String(texture.width ?? chevronDefaults.width)}"` +
    ` fill="none"/>`;

  return tile(
    id,
    gap,
    chevron,
    "",
    dimensions,
    texture.opacity ?? chevronDefaults.opacity,
  );
}
