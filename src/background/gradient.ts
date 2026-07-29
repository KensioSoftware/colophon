import type { Background, Dimensions } from "../types.js";

/**
 * A linear gradient across the whole image: a `<defs>` block holding the
 * gradient under the given `id`, and a rect filled with it.
 *
 * The coordinates are object-bounding-box units, so the default runs corner to
 * corner whatever the image's proportions are.
 */
export function gradientBackground(
  background: Extract<Background, { readonly type: "gradient" }>,
  dimensions: Dimensions,
  id: string,
): string {
  const { width, height } = dimensions;
  const from = background.from ?? { x: 0, y: 0 };
  const to = background.to ?? { x: 1, y: 1 };

  const stops = background.stops
    .map((stop) => `<stop offset="${stop.offset}" stop-color="${stop.color}"/>`)
    .join("");

  return (
    `<defs>` +
    `<linearGradient id="${id}" x1="${String(from.x)}" y1="${String(from.y)}"` +
    ` x2="${String(to.x)}" y2="${String(to.y)}">${stops}</linearGradient>` +
    `</defs>` +
    `<rect width="${String(width)}" height="${String(height)}" fill="url(#${id})"/>`
  );
}
