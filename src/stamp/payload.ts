/**
 * Keyword the stamp is stored under, in whichever container it goes into.
 * Keeping the stamp in the image means there is no sidecar file to fall out of
 * sync, and deleting an image deletes its stamp with it.
 */
export const stampKeyword = "colophon";

/**
 * What a carrier stores: `keyword\0text`.
 *
 * That is the shape of a PNG `tEXt` chunk, which is where the stamp started,
 * and the other containers reuse it rather than each inventing one. The keyword
 * is what tells Colophon's own note from somebody else's, and where a container
 * has the stamp appended to it, it is also what finds it again.
 */
export function stampPayload(stamp: string): Buffer {
  return Buffer.concat([
    Buffer.from(stampKeyword, "latin1"),
    Buffer.from([0]),
    Buffer.from(stamp, "latin1"),
  ]);
}

/** The stamp in `payload`, or `undefined` where the note is somebody else's. */
export function stampFromPayload(payload: Buffer): string | undefined {
  const separator = payload.indexOf(0);

  return separator !== -1 &&
    payload.toString("latin1", 0, separator) === stampKeyword
    ? payload.toString("latin1", separator + 1)
    : undefined;
}

/**
 * Where the payload starts in a window taken from the end of a file, or `-1`.
 *
 * Searched backwards because the stamp is the last thing an appending carrier
 * writes, so the last match is Colophon's own and anything earlier is the same
 * eight letters happening to turn up in compressed image data. The header in
 * front of it is then checked, which is what turns a likely match into a
 * certain one.
 */
export function findPayload(window: Buffer): number {
  return window.lastIndexOf(Buffer.from(stampKeyword, "latin1"));
}
