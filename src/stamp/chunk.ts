import { crc32 } from "node:zlib";

/**
 * PNG `tEXt` keyword the stamp is stored under. Keeping it in the image means
 * there is no sidecar file to fall out of sync, and deleting an image deletes
 * its stamp with it.
 */
export const stampKeyword = "colophon";

/** The eight bytes every PNG file starts with. */
export const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/** Signature + the whole `IHDR` chunk: length, type, 13 bytes of data, CRC. */
export const afterHeader = pngSignature.length + 4 + 4 + 13 + 4;

/**
 * A PNG `tEXt` chunk: length, type, `keyword\0text`, CRC over type and data.
 */
function textChunk(keyword: string, text: string): Buffer {
  const data = Buffer.concat([
    Buffer.from(keyword, "latin1"),
    Buffer.from([0]),
    Buffer.from(text, "latin1"),
  ]);
  const chunk = Buffer.alloc(4 + 4 + data.length + 4);

  chunk.writeUInt32BE(data.length, 0);
  chunk.write("tEXt", 4, "latin1");
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    crc32(chunk.subarray(4, 8 + data.length)),
    8 + data.length,
  );

  return chunk;
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
    throw new Error("Cannot stamp: not a PNG image.");
  }

  return Buffer.concat([
    png.subarray(0, afterHeader),
    textChunk(stampKeyword, stamp),
    png.subarray(afterHeader),
  ]);
}
