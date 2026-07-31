import { findPayload, stampFromPayload } from "../payload.js";
import type { StampCarrier } from "./types.js";

/**
 * The chunk type the stamp is stored under. The WebP container says a reader
 * should skip a chunk it does not know, which is what makes an invented one
 * safe; there is no registered type for a note of one's own.
 */
const stampChunk = "CLPH";

/** Four characters of type and a four-byte length, little-endian. */
const header = 8;

function isWebp(head: Buffer): boolean {
  return (
    head.length >= 12 &&
    head.toString("latin1", 0, 4) === "RIFF" &&
    head.toString("latin1", 8, 12) === "WEBP"
  );
}

/**
 * The file with the stamp chunk on the end of it, and the RIFF length, which
 * counts everything after itself, brought up to match.
 *
 * Appended rather than inserted because a plain WebP is `RIFF`, `WEBP` and then
 * the bitstream, with no room declared for anything else: libwebp reads the
 * chunk straight after `WEBP` as the image and refuses a file where it is
 * something else. Only the extended layout tolerates chunks in front of the
 * picture, and a build cannot know which layout it has been handed.
 */
function write(webp: Buffer, payload: Buffer): Buffer {
  // RIFF chunks are padded to an even length; the padding is not counted.
  const chunk = Buffer.alloc(header + payload.length + (payload.length % 2));

  chunk.write(stampChunk, 0, "latin1");
  chunk.writeUInt32LE(payload.length, 4);
  payload.copy(chunk, header);

  const stamped = Buffer.concat([webp, chunk]);
  stamped.writeUInt32LE(stamped.length - 8, 4);
  return stamped;
}

function read(tail: Buffer): string | undefined {
  const at = findPayload(tail);
  const start = at - header;

  if (start < 0 || tail.toString("latin1", start, at - 4) !== stampChunk) {
    return undefined;
  }

  const end = at + tail.readUInt32LE(at - 4);
  return end > tail.length
    ? undefined
    : stampFromPayload(tail.subarray(at, end));
}

/** WebP, where the stamp is a chunk of its own on the end of the RIFF file. */
export const riffCarrier: StampCarrier = {
  format: "WebP",
  end: "tail",
  matches: isWebp,
  write,
  read,
};
