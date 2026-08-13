import type { Dimensions, Texture } from "../types.js";
import { grainSvg } from "./grain.js";
import { moireSvg } from "./moire.js";
import { dotsSvg, rulesSvg } from "./pattern.js";
import { raysSvg } from "./rays.js";
import { wavesSvg } from "./waves.js";

export { resolveTexture } from "./resolve.js";

/**
 * Render the treatment laid over a background as SVG, naming whatever it needs
 * in `<defs>` after the given `id`. Not every treatment needs one: `waves` and
 * `rays` are plain elements and name nothing.
 *
 * It is drawn between the background and whatever a template draws, so a
 * texture never comes between a headline and the reader.
 */
export function textureSvg(
  texture: Texture,
  dimensions: Dimensions,
  id: string,
): string {
  if (texture.type === "grain") {
    return grainSvg(texture, dimensions, id);
  }

  if (texture.type === "dots") {
    return dotsSvg(texture, dimensions, id);
  }

  if (texture.type === "waves") {
    return wavesSvg(texture, dimensions);
  }

  if (texture.type === "rays") {
    return raysSvg(texture, dimensions);
  }

  if (texture.type === "moire") {
    return moireSvg(texture, dimensions, id);
  }

  return rulesSvg(texture, dimensions, id);
}
