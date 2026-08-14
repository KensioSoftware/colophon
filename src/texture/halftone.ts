import type { Dimensions, Texture } from "../types.js";
import { fallbackColor } from "./color.js";

const halftoneDefaults = {
  opacity: 0.12,
  size: 18,
  gap: 45,
  angle: 90,
  from: 0.1,
};

/**
 * How far along the growth a point is, from 0 at one edge to 1 at the other.
 *
 * It is the point's distance along the direction the dots grow in, measured
 * from whichever corner is furthest back along it, so the ramp covers the
 * whole image whatever angle it runs at.
 */
function ramp(
  dimensions: Dimensions,
  angle: number,
): (px: number, py: number) => number {
  const radians = (angle * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  const { width, height } = dimensions;

  // The four corners projected onto the direction give its full span, so the
  // ends of the ramp land on the image rather than somewhere outside it.
  const corners = [0, width].flatMap((cx) =>
    [0, height].map((cy) => cx * dx + cy * dy),
  );
  const low = Math.min(...corners);
  const span = Math.max(...corners) - low || 1;

  return (px, py) => (px * dx + py * dy - low) / span;
}

/**
 * A grid of dots that grow across the image, which is a gradient made out of
 * print.
 *
 * It cannot be a tile: every dot is a different size, which is the whole
 * effect. What keeps it affordable is that the size depends on the position
 * rather than on chance, so a run of dots across the image is a smooth ramp
 * and there is nothing noisy for the compression to choke on.
 */
export function halftoneSvg(
  texture: Extract<Texture, { readonly type: "halftone" }>,
  dimensions: Dimensions,
): string {
  const gap = texture.gap ?? halftoneDefaults.gap;
  const size = texture.size ?? halftoneDefaults.size;
  const from = texture.from ?? halftoneDefaults.from;
  const at = ramp(dimensions, texture.angle ?? halftoneDefaults.angle);

  let dots = "";

  for (let y = gap / 2; y < dimensions.height + gap; y += gap) {
    for (let x = gap / 2; x < dimensions.width + gap; x += gap) {
      const radius = (size / 2) * (from + (1 - from) * at(x, y));

      dots +=
        `<circle cx="${String(Math.round(x))}" cy="${String(Math.round(y))}"` +
        ` r="${String(Math.round(radius * 100) / 100)}"/>`;
    }
  }

  return (
    `<g fill="${texture.color ?? fallbackColor}"` +
    ` opacity="${String(texture.opacity ?? halftoneDefaults.opacity)}">` +
    `${dots}</g>`
  );
}
