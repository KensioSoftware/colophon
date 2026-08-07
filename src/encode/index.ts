import { recompressPng } from "../png/recompress.js";
import type { ResolvedConfig } from "../types.js";
import { fitToBytes } from "./fit.js";
import { mediaTypeFor } from "./format.js";
import { quantisePng } from "./quantise.js";
import type { LossyFormat } from "./sharp.js";
import { openRaster } from "./sharp.js";
import { warnIfOverCap } from "./warn.js";

export { extensionFor, mediaTypeFor, withExtension } from "./format.js";

/**
 * The rendered bytes as the configured format, before the cap is considered.
 *
 * PNG is what the rasteriser already produces, so there is nothing to convert
 * and the encoding is the whole of the work: the lossless recompression, or the
 * palette where `quantise` asks for one, which is the same file made much
 * smaller by changing the picture rather than by looking harder for matches.
 * The other three formats are encoded from whatever came back, which is a
 * decode and an encode per image, paid once because an image whose rebuild
 * stamp still matches is not rendered again.
 *
 * Bytes that are already in the configured format are handed straight on. A
 * project whose rasteriser produces WebP and whose config asks for WebP means
 * one encoding, not two, and re-encoding a lossy image is how a picture loses a
 * generation for nothing.
 */
async function toFormat(
  raster: Buffer,
  config: ResolvedConfig,
): Promise<Buffer> {
  if (config.format === "png") {
    return config.quantise
      ? quantisePng(raster, config.compressionLevel)
      : recompressPng(raster, config.compressionLevel);
  }

  // Read off the config once, so the narrowing above survives into the closure
  // below, where TypeScript would otherwise have to assume the field had moved.
  const format: LossyFormat = config.format;
  const source = await openRaster(raster);

  if (source.mediaType === mediaTypeFor(format)) {
    return raster;
  }

  const encode = async (quality: number): Promise<Buffer> =>
    source.encode(format, quality);

  return config.maxBytes === undefined
    ? encode(config.quality)
    : fitToBytes(encode, config.quality, config.maxBytes);
}

/**
 * Turn the raster a {@link ResolvedConfig.rasteriser} produced into the bytes a
 * build writes: the configured format, at the configured quality, under the
 * configured cap where one can be met.
 *
 * It sits between rasterising and writing rather than inside either, for the
 * reason the recompression it replaces did: every path to an image goes through
 * `renderSvgToImage`, so `renderMetaImages`, `generate` and `colophon preview`
 * all get this without knowing there was a choice to make.
 */
export async function encodeImage(
  raster: Buffer,
  config: ResolvedConfig,
): Promise<Buffer> {
  const image = await toFormat(raster, config);
  warnIfOverCap(image, config);

  return image;
}
