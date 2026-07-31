import { chunkBytes, pngSignature } from "../png/chunk.js";

/**
 * PNG `tEXt` keyword the stamp is stored under. Keeping it in the image means
 * there is no sidecar file to fall out of sync, and deleting an image deletes
 * its stamp with it.
 */
export const stampKeyword = "colophon";

/** Signature + the whole `IHDR` chunk: length, type, 13 bytes of data, CRC. */
export const afterHeader = pngSignature.length + 4 + 4 + 13 + 4;

/** What a `tEXt` chunk carries: `keyword\0text`. */
function textData(keyword: string, text: string): Buffer {
  return Buffer.concat([
    Buffer.from(keyword, "latin1"),
    Buffer.from([0]),
    Buffer.from(text, "latin1"),
  ]);
}

/**
 * Return `png` with the stamp embedded as a `tEXt` chunk, inserted straight
 * after the header so it can be read back without decoding the image.
 */
export function stampPng(png: Buffer, stamp: string): Buffer {
  if (
    png.length < afterHeader ||
    !png.subarray(0, pngSignature.length).equals(pngSignature) ||
    png.toString("latin1", 12, 16) !== "IHDR"
  ) {
    // Reachable in practice only through a configured rasteriser, since resvg
    // writes nothing else. Saying why beats leaving someone to work out that
    // the stamp is the reason their WebP backend cannot be used yet.
    throw new Error(
      "Cannot stamp: not a PNG image. The rebuild stamp is a PNG chunk, so a" +
        " rasteriser has to produce PNG for a build to be able to skip it.",
    );
  }

  return Buffer.concat([
    png.subarray(0, afterHeader),
    chunkBytes("tEXt", textData(stampKeyword, stamp)),
    png.subarray(afterHeader),
  ]);
}
