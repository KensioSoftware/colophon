import type { Dimensions, Texture } from "../types.js";
import { chevronsSvg } from "./chevrons.js";
import { grainSvg } from "./grain.js";
import { halftoneSvg } from "./halftone.js";
import { gridSvg } from "./grid.js";
import { honeycombSvg } from "./honeycomb.js";
import { moireSvg } from "./moire.js";
import { crossesSvg, dotsSvg, rulesSvg } from "./pattern.js";
import { raysSvg } from "./rays.js";
import { scallopsSvg } from "./scallops.js";
import { topographicSvg } from "./topographic/index.js";
import { wavesSvg } from "./waves.js";

export { resolveTexture } from "./resolve.js";

/** What draws one treatment: its own variant, the size, and an id for `<defs>`. */
type Draw<T extends Texture["type"]> = (
  texture: Extract<Texture, { readonly type: T }>,
  dimensions: Dimensions,
  id: string,
) => string;

/**
 * Which function draws which treatment.
 *
 * A table rather than a chain of `if`s, because the chain had a branch per
 * texture and there are ten of them: the file was close to the complexity
 * threshold and every new treatment made it worse. The type is what keeps this
 * honest, and it does the job the chain's final `return` used to do badly: a
 * variant added to `Texture` with no entry here fails to compile, where before
 * it silently came out as ruled lines.
 *
 * `waves` and `rays` name nothing in `<defs>` and take no id. They are wrapped
 * rather than given a parameter to ignore, so each one's own signature still
 * says what it uses.
 */
const drawers: { [T in Texture["type"]]: Draw<T> } = {
  grain: grainSvg,
  dots: dotsSvg,
  rules: rulesSvg,
  grid: gridSvg,
  crosses: crossesSvg,
  chevrons: chevronsSvg,
  honeycomb: honeycombSvg,
  moire: moireSvg,
  scallops: scallopsSvg,
  waves: (texture, dimensions) => wavesSvg(texture, dimensions),
  rays: (texture, dimensions) => raysSvg(texture, dimensions),
  halftone: (texture, dimensions) => halftoneSvg(texture, dimensions),
  topographic: (texture, dimensions) => topographicSvg(texture, dimensions),
};

/**
 * Render the treatment laid over a background as SVG, naming whatever it needs
 * in `<defs>` after the given `id`.
 *
 * It is drawn between the background and whatever a template draws, so a
 * texture never comes between a headline and the reader.
 */
export function textureSvg(
  texture: Texture,
  dimensions: Dimensions,
  id: string,
): string {
  // The value and the lookup narrow separately, so the compiler cannot see
  // that they are the same variant, though the table's type is what makes them
  // so. This is the one line that knows better than the checker.
  const draw = drawers[texture.type] as Draw<Texture["type"]>;

  return draw(texture, dimensions, id);
}
