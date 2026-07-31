import { resolveConfig } from "../config/index.js";
import { encodeImage } from "../encode/index.js";
import type { Dimensions, ResolvedConfig } from "../types.js";

/**
 * Rasterise an SVG string to image bytes at `dimensions`.
 *
 * Every path that produces an image goes through here, so this is the one place
 * the configured rasteriser has to be chosen. A project that supplies its own
 * gets it used by `renderMetaImages`, by `generate` and by `colophon preview`
 * alike, none of which knows there was a choice to make.
 *
 * It is also where the bytes are encoded as `config.format`, for the same
 * reason and on the same terms: which format a build writes is the project's
 * decision rather than the rasteriser's, and a caller taking the bytes away to
 * write them itself should not have to encode them again to get what it asked
 * for.
 *
 * It was `renderSvgToPng` while PNG was the only thing it could return. Now
 * that a config chooses, that name would be wrong three times in four.
 */
export async function renderSvgToImage(
  svg: string,
  dimensions: Dimensions,
  config: ResolvedConfig = resolveConfig(),
): Promise<Buffer> {
  const bytes = await config.rasteriser(svg, dimensions, config);

  // A rasteriser returns bytes, since not every one of them has a `Buffer` to
  // return. Everything downstream of here is Node, and the stamp reads the
  // image with `Buffer`'s own methods, so this is where the two meet. A
  // `Buffer` arrives as itself rather than being copied.
  const raster = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);

  return encodeImage(raster, config);
}
