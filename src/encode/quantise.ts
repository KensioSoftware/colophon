import { carryAncillaryChunks, readChunks } from "../png/index.js";
import { encodePalettePng } from "./sharp.js";

/**
 * The rendered PNG reduced to a palette, keeping whatever the file said about
 * itself.
 *
 * sharp decodes the picture and writes a new file around it, so everything the
 * container held is gone from what comes back, the rebuild stamp included.
 * `carryAncillaryChunks` is what puts it there again, and is the reason this is
 * a step of its own rather than one call.
 *
 * Bytes that are not a PNG are handed back as they are, which is what
 * `recompressPng` does with them too. `quantise` is a PNG setting, and a
 * rasteriser producing another format has already decided how its bytes are
 * encoded, so converting one here would be answering a question nobody asked.
 *
 * There is no fallback for a palette that came out larger than the original.
 * Quantising is an explicit choice, and an image that is sometimes reduced and
 * sometimes not, depending on how a particular gradient happened to compress,
 * is worse to reason about than one that always is. Across the sample gallery
 * the smallest saving is 39%.
 */
export async function quantisePng(
  raster: Buffer,
  level: number,
): Promise<Buffer> {
  if (readChunks(raster) === undefined) {
    return raster;
  }

  return carryAncillaryChunks(raster, await encodePalettePng(raster, level));
}
