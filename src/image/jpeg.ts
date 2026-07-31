import { jpegSegments } from "../jpeg/segments.js";
import type { Extent } from "./size.js";

/** The frame headers, which are the segments that state the image size. */
function isFrameHeader(marker: number): boolean {
  // 0xC4, 0xC8 and 0xCC sit in the same range and are tables rather than
  // frames, which is the whole subtlety of reading a JPEG header.
  return (
    marker >= 0xc0 &&
    marker <= 0xcf &&
    marker !== 0xc4 &&
    marker !== 0xc8 &&
    marker !== 0xcc
  );
}

/**
 * The dimensions of a JPEG, from the first frame header among its segments.
 *
 * A frame header opens with one byte of sample precision and then the height
 * and the width, each big-endian, in that order. One declaring less than that
 * is a file cut off inside its own frame, and is unmeasurable rather than a
 * read past the end of the buffer.
 */
export function jpegExtent(bytes: Uint8Array): Extent | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (const { marker, start, end } of jpegSegments(bytes)) {
    if (isFrameHeader(marker)) {
      return end - start < 5
        ? undefined
        : {
            width: view.getUint16(start + 3),
            height: view.getUint16(start + 1),
          };
    }
  }

  return undefined;
}
