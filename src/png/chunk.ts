import { crc32 } from "node:zlib";

/** The eight bytes every PNG file starts with. */
export const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/** One chunk of a PNG: its four-character type and the data it carries. */
export interface PngChunk {
  readonly type: string;
  readonly data: Buffer;
}

/**
 * A whole PNG chunk as bytes: its length, its type, its data, and the CRC over
 * the type and data together.
 */
export function chunkBytes(type: string, data: Buffer): Buffer {
  const chunk = Buffer.alloc(4 + 4 + data.length + 4);

  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, "latin1");
  data.copy(chunk, 8);
  chunk.writeUInt32BE(
    crc32(chunk.subarray(4, 8 + data.length)),
    8 + data.length,
  );

  return chunk;
}

/**
 * The chunks of a PNG, in the order the file declares them.
 *
 * `undefined` where the bytes are not a PNG at all, or where a chunk runs past
 * the end of them, which between them cover everything a caller can do about
 * it: whatever this is, it is not a file to take apart and put back together.
 * The CRCs are not checked, since nothing here is deciding whether to trust the
 * image, only where one chunk ends and the next begins.
 */
export function readChunks(png: Buffer): PngChunk[] | undefined {
  if (!png.subarray(0, pngSignature.length).equals(pngSignature)) {
    return undefined;
  }

  const chunks: PngChunk[] = [];
  let offset = pngSignature.length;

  while (offset + 12 <= png.length) {
    const length = png.readUInt32BE(offset);
    const end = offset + 12 + length;

    if (end > png.length) {
      return undefined;
    }

    chunks.push({
      type: png.toString("latin1", offset + 4, offset + 8),
      data: png.subarray(offset + 8, offset + 8 + length),
    });
    offset = end;
  }

  // Trailing bytes that are not a chunk mean this was read wrong somewhere.
  return offset === png.length ? chunks : undefined;
}
