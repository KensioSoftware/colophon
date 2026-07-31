/**
 * Reading and rewriting the PNG container itself, as against the picture in it.
 *
 * Two things in the package have to open a finished PNG: the rebuild stamp,
 * which puts a `tEXt` chunk in the header, and the recompressor, which replaces
 * the image data with a smaller encoding of the same bytes. Both need the same
 * chunk arithmetic, and writing a CRC in two places is how the two would come
 * to disagree.
 */
export type { PngChunk } from "./chunk.js";
export { chunkBytes, pngSignature, readChunks } from "./chunk.js";
export { recompressPng } from "./recompress.js";
