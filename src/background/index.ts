import type { Background, Dimensions, ImageAsset } from "../types.js";
import { gradientBackground } from "./gradient.js";
import { imageBackground } from "./image.js";
import { meshBackground } from "./mesh.js";

/**
 * Render a full-bleed background as SVG. Gradients and meshes emit a `<defs>`
 * block naming their fills after the given `id`, followed by the rects that
 * use them; a solid colour is just the rect.
 *
 * A background image has to be read before it can be drawn, which is the
 * renderer's job. Called without one, an image background is the colour behind
 * it, so a caller assembling an SVG by hand gets a plain image rather than a
 * reference to something that is not there.
 */
export function backgroundSvg(
  background: Background,
  dimensions: Dimensions,
  id: string,
  asset?: ImageAsset,
): string {
  const { width, height } = dimensions;

  if (background.type === "solid") {
    return `<rect width="${String(width)}" height="${String(height)}" fill="${background.color}"/>`;
  }

  if (background.type === "image") {
    return imageBackground(
      background,
      { x: 0, y: 0, width, height },
      id,
      asset,
    );
  }

  if (background.type === "mesh") {
    return meshBackground(background, dimensions, id);
  }

  return gradientBackground(background, dimensions, id);
}
