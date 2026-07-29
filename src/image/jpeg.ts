import type { Extent } from "./size.js";

/** Markers that carry no payload, so nothing follows them to skip over. */
const standalone = new Set([0xd8, 0xd9, 0x01]);

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
 * The dimensions of a JPEG, by walking its segments to the frame header.
 *
 * Unlike every other format here, a JPEG does not state its size at a fixed
 * offset: the frame header comes after however many comment, quantisation and
 * application segments the encoder felt like writing.
 */
export function jpegExtent(bytes: Uint8Array): Extent | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;

  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      // Anything between segments is skipped a byte at a time rather than
      // read as a length, since a length taken from the middle of one would
      // jump somewhere arbitrary.
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1] ?? 0;

    if (marker === 0xff) {
      // A marker may be preceded by any number of `0xff` fill bytes, so this
      // is the first of them rather than a marker of its own.
      offset += 1;
      continue;
    }

    if (standalone.has(marker)) {
      offset += 2;
      continue;
    }

    if (isFrameHeader(marker)) {
      // The dimensions run to offset + 8, further than the loop guarantees, so
      // a file truncated inside its own frame header is unmeasurable rather
      // than a read past the end of the buffer.
      return offset + 8 < bytes.length
        ? {
            width: view.getUint16(offset + 7),
            height: view.getUint16(offset + 5),
          }
        : undefined;
    }

    offset += 2 + view.getUint16(offset + 2);
  }

  return undefined;
}
