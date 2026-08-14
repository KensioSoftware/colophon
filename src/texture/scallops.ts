import type { Dimensions, Texture } from "../types.js";
import { fallbackColor } from "./color.js";
import { tile } from "./tile.js";

const scallopDefaults = { opacity: 0.07, width: 3, size: 60 };

/** One arc of a row, bulging downwards from the two points it spans. */
function scallop(cx: number, y: number, radius: number): string {
  return (
    `M${String(cx - radius)} ${String(y)}` +
    `A${String(radius)} ${String(radius)} 0 0 0 ${String(cx + radius)} ${String(y)}`
  );
}

/**
 * Fish scales: rows of arcs, each row offset by half a scale from the one
 * above, which is what makes them read as overlapping rather than as stacked
 * semicircles.
 *
 * The tile holds two rows for that reason: one repeat has to contain both the
 * offset row and the row it is offset from, since a `<pattern>` cannot stagger
 * its own rows.
 */
export function scallopsSvg(
  texture: Extract<Texture, { readonly type: "scallops" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const size = texture.size ?? scallopDefaults.size;
  const radius = size / 2;
  const rows =
    scallop(radius, 0, radius) +
    scallop(0, radius, radius) +
    scallop(size, radius, radius);

  const arcs =
    `<path d="${rows}" stroke="${texture.color ?? fallbackColor}"` +
    ` stroke-width="${String(texture.width ?? scallopDefaults.width)}"` +
    ` fill="none"/>`;

  return tile(
    id,
    size,
    arcs,
    "",
    dimensions,
    texture.opacity ?? scallopDefaults.opacity,
  );
}
