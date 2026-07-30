import { resolveConfig } from "../config/index.js";
import type { Dimensions, ResolvedConfig } from "../types.js";

/**
 * Rasterise an SVG string to image bytes at `dimensions`.
 *
 * Every path that produces an image goes through here, so this is the one place
 * the configured rasteriser has to be chosen. A project that supplies its own
 * gets it used by `renderMetaImages`, by `generate` and by `colophon preview`
 * alike, none of which knows there was a choice to make.
 *
 * The name is what it was before the backend became configurable. PNG is still
 * what comes back by default, and renaming this would break every caller to say
 * something the config already says.
 */
export async function renderSvgToPng(
  svg: string,
  dimensions: Dimensions,
  config: ResolvedConfig = resolveConfig(),
): Promise<Buffer> {
  const bytes = await config.rasteriser(svg, dimensions, config);

  // A rasteriser returns bytes, since not every one of them has a `Buffer` to
  // return. Everything downstream of here is Node, and the stamp reads the PNG
  // with `Buffer`'s own methods, so this is where the two meet. A `Buffer`
  // arrives as itself rather than being copied.
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
}
