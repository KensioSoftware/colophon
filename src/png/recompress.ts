import { promisify } from "node:util";
import { deflate, inflate } from "node:zlib";

import type { PngChunk } from "./chunk.js";
import { chunkBytes, pngSignature, readChunks } from "./chunk.js";

const inflateAsync = promisify(inflate);
const deflateAsync = promisify(deflate);

/**
 * Where the compression method sits in `IHDR`, after the width, the height,
 * the bit depth and the colour type.
 */
const compressionMethodOffset = 10;

/**
 * Whether the image data is a plain zlib stream, which is the only compression
 * method PNG defines and so the only one there is anything here to re-encode.
 * A file whose header says otherwise is left as it is rather than guessed at.
 */
function isDeflated(chunks: readonly PngChunk[]): boolean {
  const header = chunks[0];

  return (
    header?.type === "IHDR" &&
    header.data.length >= 13 &&
    header.data[compressionMethodOffset] === 0
  );
}

/**
 * The file put back together with `idat` in place of the image data it held.
 *
 * Every other chunk is kept, in its original order and at its original place:
 * a rasteriser may have written a `pHYs` or a `gAMA` that says how the image is
 * meant to be shown, and dropping one to save a few bytes would change what the
 * image is. The new data goes where the first `IDAT` was, since the ones after
 * it were the same stream split up.
 */
function rebuild(chunks: readonly PngChunk[], idat: Buffer): Buffer {
  const parts: Buffer[] = [pngSignature];
  let isWritten = false;

  for (const chunk of chunks) {
    if (chunk.type !== "IDAT") {
      parts.push(chunkBytes(chunk.type, chunk.data));
    } else if (!isWritten) {
      isWritten = true;
      parts.push(chunkBytes("IDAT", idat));
    }
  }

  return Buffer.concat(parts);
}

/**
 * Re-encode a PNG's image data at zlib level `level`, returning the smaller of
 * what that produced and what came in.
 *
 * This is lossless in the strongest sense available: the filtered scanlines are
 * inflated and deflated again untouched, so not a pixel moves and not even a
 * row filter changes. All that differs is how hard the deflater looked for
 * matches. resvg encodes for speed, which on a 1200x1200 gradient costs about
 * three times the file size, and these are images a site commits and then
 * serves to everyone who shares a link.
 *
 * Re-filtering the rows adaptively rather than keeping resvg's fixed `Sub` was
 * measured too, and bought about another 5% for more time again and a filter
 * implementation to maintain, so it is not done.
 *
 * A `level` of `0` means leave the bytes alone, as does anything that is not a
 * PNG this can take apart: a rasteriser other than the default may return a
 * format with nothing in common with this, and refusing it here would be
 * refusing it for the wrong reason. Bytes that claim to be a PNG and then fail
 * to inflate are a broken image, and that does throw.
 */
export async function recompressPng(
  png: Buffer,
  level: number,
): Promise<Buffer> {
  const chunks = level === 0 ? undefined : readChunks(png);

  if (chunks === undefined || !isDeflated(chunks)) {
    return png;
  }

  const image = chunks.filter((chunk) => chunk.type === "IDAT");

  if (image.length === 0) {
    return png;
  }

  const data = await inflateAsync(Buffer.concat(image.map(({ data }) => data)));
  const rebuilt = rebuild(chunks, await deflateAsync(data, { level }));

  // A rasteriser that already compresses well would otherwise be undone by a
  // level that happens to suit it less than the one it chose for itself.
  return rebuilt.length < png.length ? rebuilt : png;
}
