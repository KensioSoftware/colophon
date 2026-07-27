import type { FileHandle } from "node:fs/promises";
import { open } from "node:fs/promises";

import { pngSignature, stampKeyword } from "./chunk.js";

/**
 * How much of a PNG to read when looking for a stamp. The stamp goes in
 * immediately after `IHDR`, so this only has to cover the header — reading
 * whole images just to compare a hash would defeat the point of skipping them.
 */
const headBytes = 4096;

/**
 * Find the stamp in the leading bytes of a PNG, or `undefined` if there is
 * none — the image was written by something else, or by a Colophon that did
 * not stamp yet.
 */
function findStamp(head: Buffer): string | undefined {
  if (!head.subarray(0, pngSignature.length).equals(pngSignature)) {
    return undefined;
  }

  let offset = pngSignature.length;

  while (offset + 8 <= head.length) {
    const length = head.readUInt32BE(offset);
    const type = head.toString("latin1", offset + 4, offset + 8);
    const start = offset + 8;
    const end = start + length;

    // Image data starts here; anything past it is not worth reading for a hash.
    if (type === "IDAT" || type === "IEND" || end > head.length) {
      return undefined;
    }

    if (type === "tEXt") {
      const data = head.subarray(start, end);
      const separator = data.indexOf(0);

      if (
        separator !== -1 &&
        data.toString("latin1", 0, separator) === stampKeyword
      ) {
        return data.toString("latin1", separator + 1);
      }
    }

    offset = end + 4;
  }

  return undefined;
}

/**
 * Read the stamp out of a PNG file. Returns `undefined` when the file is
 * missing, unreadable, not a PNG, or carries no stamp — all of which mean the
 * image cannot be shown to be up to date, so it should be rendered again.
 */
export async function readPngStamp(file: string): Promise<string | undefined> {
  let handle: FileHandle;

  try {
    handle = await open(file, "r");
  } catch {
    return undefined;
  }

  try {
    const buffer = Buffer.alloc(headBytes);
    const { bytesRead } = await handle.read(buffer, 0, headBytes, 0);
    return findStamp(buffer.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}
