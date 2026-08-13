import type { Dimensions, Texture } from "../types.js";
import { fallbackColor } from "./color.js";
import { tile } from "./tile.js";

const combDefaults = { opacity: 0.07, width: 1.5, size: 26 };

/** Rounded to keep the path short, since it is written out twice a tile. */
function at(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * One flat-topped hexagon, from its centre and the length of a side.
 *
 * A hexagon of side `s` is `2s` across the points and `s * sqrt(3)` across the
 * flats, which is where every number below comes from.
 */
function hexagon(cx: number, cy: number, side: number): string {
  const half = (side * Math.sqrt(3)) / 2;

  return (
    `M${at(cx - side)} ${at(cy)}` +
    `L${at(cx - side / 2)} ${at(cy - half)}` +
    `L${at(cx + side / 2)} ${at(cy - half)}` +
    `L${at(cx + side)} ${at(cy)}` +
    `L${at(cx + side / 2)} ${at(cy + half)}` +
    `L${at(cx - side / 2)} ${at(cy + half)}Z`
  );
}

/**
 * A honeycomb of hexagon outlines.
 *
 * The grid repeats every three sides across and every `side * sqrt(3)` down,
 * which is the smallest rectangle a honeycomb fits in. Two hexagons go in it,
 * the second offset by half of each, and the ones that fall outside are drawn
 * anyway so that the tile joins its neighbours: the pattern clips them, and a
 * hexagon cut in half by the tile edge meets its other half in the next tile.
 */
export function honeycombSvg(
  texture: Extract<Texture, { readonly type: "honeycomb" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const side = texture.size ?? combDefaults.size;
  const height = side * Math.sqrt(3);
  const width = side * 3;

  const comb =
    `<path d="${hexagon(side, height / 2, side)}${hexagon(
      side * 2.5,
      0,
      side,
    )}${hexagon(side * 2.5, height, side)}" stroke="${texture.color ?? fallbackColor}"` +
    ` stroke-width="${String(texture.width ?? combDefaults.width)}"` +
    ` fill="none"/>`;

  // Not the square tile the others use: a honeycomb's repeat is wider than it
  // is tall, so `tile` takes the two separately here.
  return tile(
    id,
    { width, height },
    comb,
    "",
    dimensions,
    texture.opacity ?? combDefaults.opacity,
  );
}
