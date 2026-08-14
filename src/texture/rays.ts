import type { Dimensions, Texture } from "../types.js";
import { fallbackColor } from "./color.js";

const rayDefaults = { opacity: 0.07, width: 3, count: 24, x: 0.5, y: 1.15 };

interface Origin {
  readonly x: number;
  readonly y: number;
}

/** How far a ray has to run to leave the image from where it starts. */
function reach(origin: Origin, dimensions: Dimensions): number {
  return Math.hypot(
    Math.max(origin.x, dimensions.width - origin.x),
    Math.max(origin.y, dimensions.height - origin.y),
  );
}

/**
 * Straight lines fanning out from one point.
 *
 * The rays are spread around the whole circle rather than over the angle that
 * happens to face the image, so moving the origin changes what is seen without
 * changing how close together the lines are. Nothing clips the ones that point
 * away: they are outside the SVG's viewport and are simply not painted.
 */
export function raysSvg(
  texture: Extract<Texture, { readonly type: "rays" }>,
  dimensions: Dimensions,
): string {
  const count = Math.max(1, Math.round(texture.count ?? rayDefaults.count));
  const origin = {
    x: dimensions.width * (texture.x ?? rayDefaults.x),
    y: dimensions.height * (texture.y ?? rayDefaults.y),
  };
  const length = reach(origin, dimensions);

  let rays = "";

  for (let ray = 0; ray < count; ray += 1) {
    const angle = (ray / count) * Math.PI * 2;

    rays +=
      `<line x1="${String(Math.round(origin.x))}"` +
      ` y1="${String(Math.round(origin.y))}"` +
      ` x2="${String(Math.round(origin.x + Math.cos(angle) * length))}"` +
      ` y2="${String(Math.round(origin.y + Math.sin(angle) * length))}"/>`;
  }

  return (
    `<g stroke="${texture.color ?? fallbackColor}"` +
    ` stroke-width="${String(texture.width ?? rayDefaults.width)}"` +
    ` opacity="${String(texture.opacity ?? rayDefaults.opacity)}">` +
    `${rays}</g>`
  );
}
