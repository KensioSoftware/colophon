import { chunkBytes, pngSignature } from "../../png/chunk.js";
import { stampFromPayload } from "../payload.js";
import type { StampCarrier } from "./types.js";

/** Signature + the whole `IHDR` chunk: length, type, 13 bytes of data, CRC. */
const afterHeader = pngSignature.length + 4 + 4 + 13 + 4;

function isPng(head: Buffer): boolean {
  return (
    head.length >= afterHeader &&
    head.subarray(0, pngSignature.length).equals(pngSignature) &&
    head.toString("latin1", 12, 16) === "IHDR"
  );
}

/**
 * The stamp in the first `tEXt` chunk that carries one, reading the chunks in
 * the order the file declares them.
 */
function read(head: Buffer): string | undefined {
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
      const stamp = stampFromPayload(head.subarray(start, end));

      if (stamp !== undefined) {
        return stamp;
      }
    }

    offset = end + 4;
  }

  return undefined;
}

/**
 * PNG, where the stamp is a `tEXt` chunk straight after the header, so it can
 * be read back without decoding the image.
 */
export const pngCarrier: StampCarrier = {
  format: "PNG",
  end: "head",
  matches: isPng,
  write: (png, payload) =>
    Buffer.concat([
      png.subarray(0, afterHeader),
      chunkBytes("tEXt", payload),
      png.subarray(afterHeader),
    ]),
  read,
};
