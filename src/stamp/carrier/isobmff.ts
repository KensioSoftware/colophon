import { findPayload, stampFromPayload } from "../payload.js";
import type { StampCarrier } from "./types.js";

/**
 * The UUID the stamp box is tagged with. ISO base media keeps the `uuid` box
 * for data its own format does not define, identified by a UUID whoever writes
 * it picks once. This is Colophon's, and it means nothing beyond being
 * unlikely to be anybody else's.
 */
const stampUuid = Buffer.from("5d5f8f3a9b7c4e2ab1c6f0a83d47e912", "hex");

/** A four-byte size, four characters of type, then the UUID. */
const header = 8 + stampUuid.length;

function isIsobmff(head: Buffer): boolean {
  return head.length >= 8 && head.toString("latin1", 4, 8) === "ftyp";
}

/**
 * The file with the stamp box on the end of it.
 *
 * Appended rather than put after `ftyp`, where it would read better, because
 * an AVIF locates the picture inside `mdat` by its offset from the start of the
 * file. Anything inserted in front of `mdat` moves it, and the file then names
 * the wrong bytes as its own image.
 */
function write(image: Buffer, payload: Buffer): Buffer {
  const box = Buffer.alloc(header + payload.length);

  box.writeUInt32BE(box.length, 0);
  box.write("uuid", 4, "latin1");
  stampUuid.copy(box, 8);
  payload.copy(box, header);

  return Buffer.concat([image, box]);
}

function read(tail: Buffer): string | undefined {
  const at = findPayload(tail);
  const start = at - header;

  if (
    start < 0 ||
    tail.toString("latin1", start + 4, start + 8) !== "uuid" ||
    !tail.subarray(start + 8, at).equals(stampUuid)
  ) {
    return undefined;
  }

  // Unlike a RIFF chunk, a box states the size of the whole of itself.
  const end = start + tail.readUInt32BE(start);
  return end > tail.length
    ? undefined
    : stampFromPayload(tail.subarray(at, end));
}

/**
 * ISO base media, which is AVIF and HEIC, where the stamp is a `uuid` box on
 * the end of the file.
 */
export const isobmffCarrier: StampCarrier = {
  format: "AVIF",
  end: "tail",
  matches: isIsobmff,
  write,
  read,
};
