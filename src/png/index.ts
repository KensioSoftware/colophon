/**
 * Reading and rewriting the PNG container itself, as against the picture in it.
 *
 * Three things in the package have to open a finished PNG: the rebuild stamp,
 * which puts a `tEXt` chunk in the header, the recompressor, which replaces the
 * image data with a smaller encoding of the same bytes, and the carrier that
 * moves what an outside encoder dropped into what it wrote. They need the same
 * chunk arithmetic, and writing a CRC in three places is how they would come to
 * disagree.
 */
export type { PngChunk } from "./chunk.js";
export { carryAncillaryChunks } from "./carry.js";
export { chunkBytes, pngSignature, readChunks } from "./chunk.js";
export { recompressPng } from "./recompress.js";
