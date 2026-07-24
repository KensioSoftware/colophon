import type { Background, Dimensions } from "./types.js";

/**
 * Render a full-bleed background as SVG. For a gradient, this emits a `<defs>`
 * block with a `<linearGradient>` (using the given `id`) followed by a filled
 * rect; for a solid colour it emits just the rect.
 */
export function backgroundSvg(
  background: Background,
  dimensions: Dimensions,
  id: string,
): string {
  const { width, height } = dimensions;

  if (background.type === "solid") {
    return `<rect width="${String(width)}" height="${String(height)}" fill="${background.color}"/>`;
  }

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
