import type { Dimensions, Texture } from "../types.js";
import { fallbackColor } from "./color.js";

const wavesDefaults = { opacity: 0.14, width: 2, gap: 24 };

/**
 * How much fainter the set drawn from the right is than the set from the left.
 *
 * Two sets at one opacity read as two sets of rings, because the eye follows
 * whichever arc it is on. Dropping one of them is what turns the crossings
 * into a single surface with a grain to it, and it is the same trick that
 * keeps a flat tile from reading as graph paper.
 */
const secondaryScale = 0.65;

interface Centre {
  readonly x: number;
  readonly y: number;
}

/**
 * Rings around one centre at `gap` apart, out to the furthest corner of the
 * image, which is where the pattern stops being able to cover anything.
 *
 * Nothing clips them: a circle drawn past the edge of the image is outside the
 * SVG's viewport and simply is not painted.
 */
function rings(centre: Centre, dimensions: Dimensions, gap: number): string {
  const furthest = Math.hypot(
    Math.max(centre.x, dimensions.width - centre.x),
    Math.max(centre.y, dimensions.height - centre.y),
  );

  let out = "";

  for (let ring = 1; ring * gap <= furthest; ring += 1) {
    out +=
      `<circle cx="${String(centre.x)}" cy="${String(centre.y)}"` +
      ` r="${String(Math.round(ring * gap))}"/>`;
  }

  return out;
}

/** One set of rings, with the stroke named once on the group. */
function family(
  centre: Centre,
  dimensions: Dimensions,
  texture: Extract<Texture, { readonly type: "waves" }>,
  opacity: number,
): string {
  const gap = texture.gap ?? wavesDefaults.gap;

  return (
    `<g fill="none" stroke="${texture.color ?? fallbackColor}"` +
    ` stroke-width="${String(texture.width ?? wavesDefaults.width)}"` +
    ` opacity="${String(opacity)}">${rings(centre, dimensions, gap)}</g>`
  );
}

/**
 * Two sets of concentric rings, one from the middle of each side edge.
 *
 * Unlike the dot grid and the ruled lines this is not a tile, and it cannot be
 * one: what makes it worth looking at is the interference between the two
 * sets, which is different everywhere on the image.
 *
 * It is a few dozen circles to draw and expensive to store, which are not the
 * same thing. Antialiased curves put a different set of colours in every row,
 * so a 1200x1200 PNG goes from around 80KB to around 620KB at the default gap,
 * against 100KB for the dot grid. `gap` is the only real lever on that, and
 * the docs say so.
 */
export function wavesSvg(
  texture: Extract<Texture, { readonly type: "waves" }>,
  dimensions: Dimensions,
): string {
  const opacity = texture.opacity ?? wavesDefaults.opacity;
  const middle = Math.round(dimensions.height / 2);

  return (
    family({ x: 0, y: middle }, dimensions, texture, opacity) +
    family(
      { x: dimensions.width, y: middle },
      dimensions,
      texture,
      Math.round(opacity * secondaryScale * 1000) / 1000,
    )
  );
}
