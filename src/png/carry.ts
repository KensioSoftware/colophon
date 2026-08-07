import type { PngChunk } from "./chunk.js";
import { chunkBytes, pngSignature, readChunks } from "./chunk.js";

/**
 * Whether a chunk is ancillary rather than critical, which PNG says in the case
 * of the first letter of its type: `tEXt` and `pHYs` are optional information
 * about the image, where `IHDR`, `PLTE`, `IDAT` and `IEND` are the image.
 *
 * Spec: https://www.w3.org/TR/png-3/#5Chunk-naming-conventions
 */
function isAncillary({ type }: PngChunk): boolean {
  const first = type.codePointAt(0) ?? 0;

  return first >= 0x61 && first <= 0x7a;
}

/**
 * `encoded` with `source`'s ancillary chunks put back, straight after the
 * header.
 *
 * An encoder that reads a picture out of a PNG and writes a new one keeps the
 * pixels and drops everything said about them, which for this package means the
 * rebuild stamp: `stamp/carrier/png.ts` stores it as a `tEXt` chunk, and an
 * image that came back without one would be an image every later build
 * re-rendered, quietly and for ever. A rasteriser's own `pHYs` or `gAMA` goes
 * the same way and says how the image is meant to be shown, so this is the
 * promise `recompressPng` already keeps by rebuilding a file rather than
 * re-encoding it.
 *
 * They go after `IHDR` rather than before the image data, which is where both
 * the specification and this package want them: `gAMA` and `pHYs` have to
 * precede `PLTE`, and the stamp reader takes a window off the front of the file
 * rather than reading all of it.
 *
 * Critical chunks are never carried, since the header and the palette describe
 * the picture the encoder just wrote rather than the one it read. Neither is a
 * type the encoder wrote for itself, which is already its answer for that
 * chunk. Bytes either side that do not read as chunks mean there is nothing to
 * move or nowhere to put it, and `encoded` is handed back as it is: deciding an
 * image is broken is not this function's job.
 */
export function carryAncillaryChunks(source: Buffer, encoded: Buffer): Buffer {
  const from = readChunks(source);
  const into = readChunks(encoded);

  if (from === undefined || into === undefined || into[0]?.type !== "IHDR") {
    return encoded;
  }

  const present = new Set(into.map(({ type }) => type));
  const carried = from.filter(
    (chunk) => isAncillary(chunk) && !present.has(chunk.type),
  );

  if (carried.length === 0) {
    return encoded;
  }

  return Buffer.concat([
    pngSignature,
    ...[into[0], ...carried, ...into.slice(1)].map(({ type, data }) =>
      chunkBytes(type, data),
    ),
  ]);
}
